import { useEffect, useRef, useState, type ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken } from '../../lib/mapbox.js';
import { basemapFor, getMode, type Mode } from '../../theme/map-style.js';
import './MapRoot.css';

export type MapRootProps = {
  center?: [number, number];
  zoom?: number;
  children?: ReactNode;
  onReady?: (map: mapboxgl.Map) => void;
  /** CSS length the right-anchored chrome should clear, e.g. an open sidebar. */
  insetRight?: string;
};

export function MapRoot({
  center = [103.82, 1.35],
  zoom = 10.5,
  children,
  onReady,
  insetRight = '0px',
}: MapRootProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setModeState] = useState<Mode>('light');
  const previousView = useRef<{ center: [number, number]; zoom: number } | null>(null);

  // Track [data-mode] so the map can be rebuilt for it.
  useEffect(() => {
    setModeState(getMode());
    const observer = new MutationObserver(() => setModeState(getMode()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!container.current) return;
    try {
      mapboxgl.accessToken = getMapboxToken();
      map.current = new mapboxgl.Map({
        container: container.current,
        style: basemapFor(mode),
        center: previousView.current?.center ?? center,
        zoom: previousView.current?.zoom ?? zoom,
        attributionControl: true,
      });
      map.current.on('load', () => {
        document.documentElement.dataset.mapReady = 'true';
        if (map.current && onReady) onReady(map.current);
      });
      map.current.on('error', (e) => setError(e.error?.message ?? 'Map failed to load.'));
    } catch (err) {
      setError((err as Error).message);
    }

    const onResize = () => map.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      // Preserve the viewport across a rebuild so a mode flip does not yank
      // the user back to the initial camera.
      if (map.current) {
        const c = map.current.getCenter();
        previousView.current = { center: [c.lng, c.lat], zoom: map.current.getZoom() };
      }
      document.documentElement.removeAttribute('data-map-ready');
      map.current?.remove();
      map.current = null;
    };
  }, [mode]);

  return (
    <div className="map-root" data-testid="map-root">
      <div ref={container} className="map-root__canvas" data-testid="map-canvas" />
      {error && (
        <div className="map-root__error" data-testid="map-error" role="alert">
          {error}
        </div>
      )}
      <div
        className="map-root__chrome"
        style={{ ['--chrome-inset-right' as string]: insetRight }}
      >
        {children}
      </div>
    </div>
  );
}
