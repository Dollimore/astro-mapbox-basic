import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import type { Feature } from '../../../data/schema.js';
import type { Palette } from '../../../lib/useStatusColours.js';

export type FeaturesLayerProps = {
  map: mapboxgl.Map | null;
  features: Feature[];
  palette: Palette | null;
  onSelect: (f: Feature) => void;
};

const SOURCE = 'features';
const LAYER = 'features-circles';

function colourExpression(palette: Palette) {
  return [
    'match', ['get', 'status'],
    'operational', palette.status.operational,
    'construction', palette.status.construction,
    'announced', palette.status.announced,
    'halted', palette.status.halted,
    palette.status.announced,
  ] as unknown as mapboxgl.ExpressionSpecification;
}

/**
 * Renders the point layer, and survives a basemap swap.
 *
 * setStyle() drops every source and layer. Rebuilding from a React effect is a
 * race: the palette updates the instant [data-mode] flips, so the effect runs
 * while the new style is still loading, bails on isStyleLoaded(), and the
 * style.load that would have retriggered it has already fired. The data then
 * silently disappears with no error anywhere.
 *
 * So the work is imperative and idempotent: one `ensure()` that can be called
 * at any time, wired to both the effect and every style event.
 */
export function FeaturesLayer({ map, features, palette, onSelect }: FeaturesLayerProps) {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!map || !palette) return;
    let disposed = false;

    const geojson = {
      type: 'FeatureCollection' as const,
      features: features.map((f) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [f.lng, f.lat] },
        properties: { ...f },
      })),
    };

    const ensure = () => {
      if (disposed || !map.isStyleLoaded()) return;

      const existing = map.getSource(SOURCE) as mapboxgl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(geojson);
      } else {
        map.addSource(SOURCE, { type: 'geojson', data: geojson });
      }

      if (!map.getLayer(LAYER)) {
        map.addLayer({
          id: LAYER,
          type: 'circle',
          source: SOURCE,
          paint: {
            'circle-radius': 7,
            'circle-color': colourExpression(palette),
            'circle-stroke-width': palette.halo.width,
            'circle-stroke-color': palette.halo.colour,
          },
        });
      } else {
        map.setPaintProperty(LAYER, 'circle-color', colourExpression(palette));
        map.setPaintProperty(LAYER, 'circle-stroke-color', palette.halo.colour);
      }

      // Test hook. A basemap swap can silently drop the layer with no error
      // anywhere, so its presence has to be assertable rather than eyeballed.
      // Force topmost. `styledata` fires repeatedly while a new style is still
      // populating, so a layer added mid-load gets buried under every basemap
      // layer mapbox appends afterwards. queryRenderedFeatures still counts them
      // — they are in the render tree, just painted underneath — which makes
      // this fail as "data invisible" with no error and a healthy-looking count.
      map.moveLayer(LAYER);

      // Test hook: is our layer the last one, i.e. actually on top?
      const layers = map.getStyle()?.layers ?? [];
      document.documentElement.dataset.featuresRendered = String(features.length);
      document.documentElement.dataset.featuresOnTop =
        layers.length > 0 && layers[layers.length - 1]?.id === LAYER ? 'true' : 'false';

    };

    // Handlers are registered against the map, not the style, so they survive
    // a swap — which is why the click handler must not be re-added each time.
    const onClick = (e: mapboxgl.MapMouseEvent & { features?: object[] }) => {
      const hit = e.features?.[0];
      if (!hit) return;
      const props = (hit as unknown as { properties?: Feature }).properties;
      if (props) onSelectRef.current(props);
    };
    const enter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const leave = () => { map.getCanvas().style.cursor = ''; };

    ensure();
    map.on('style.load', ensure);
    map.on('styledata', ensure);
    map.on('click', LAYER, onClick);
    map.on('mouseenter', LAYER, enter);
    map.on('mouseleave', LAYER, leave);

    return () => {
      disposed = true;
      map.off('style.load', ensure);
      map.off('styledata', ensure);
      map.off('click', LAYER, onClick);
      map.off('mouseenter', LAYER, enter);
      map.off('mouseleave', LAYER, leave);
    };
  }, [map, features, palette]);

  return null;
}
