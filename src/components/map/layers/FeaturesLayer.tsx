import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import type { Feature } from '../../../data/schema.js';
import { statusColours, halo } from '../../../theme/map-style.js';

export type FeaturesLayerProps = {
  map: mapboxgl.Map | null;
  features: Feature[];
  onSelect: (f: Feature) => void;
};

const SOURCE = 'features';
const LAYER = 'features-circles';

export function FeaturesLayer({ map, features, onSelect }: FeaturesLayerProps) {
  useEffect(() => {
    if (!map) return;
    const colours = statusColours();
    const { width, colour } = halo();

    const geojson = {
      type: 'FeatureCollection' as const,
      features: features.map((f) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [f.lng, f.lat] },
        properties: { ...f },
      })),
    };

    const existing = map.getSource(SOURCE) as mapboxgl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(geojson);
      return;
    }

    map.addSource(SOURCE, { type: 'geojson', data: geojson });
    map.addLayer({
      id: LAYER,
      type: 'circle',
      source: SOURCE,
      paint: {
        'circle-radius': 7,
        'circle-color': [
          'match', ['get', 'status'],
          'operational', colours.operational,
          'construction', colours.construction,
          'announced', colours.announced,
          'halted', colours.halted,
          colours.announced,
        ],
        'circle-stroke-width': width,
        'circle-stroke-color': colour,
      },
    });

    map.on('click', LAYER, (e) => {
      const hit = e.features?.[0];
      if (!hit) return;
      // mapbox-gl types GeoJSONFeature without `properties`; the runtime object
      // always carries it for a geojson source, so narrow explicitly.
      const props = (hit as unknown as { properties?: Feature }).properties;
      if (props) onSelect(props);
    });
    map.on('mouseenter', LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', LAYER, () => { map.getCanvas().style.cursor = ''; });
  }, [map, features, onSelect]);

  return null;
}
