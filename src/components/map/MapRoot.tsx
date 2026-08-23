import { useEffect, useRef, useState, type ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken } from '../../lib/mapbox.js';
import { BASEMAP_STYLE } from '../../theme/map-style.js';
import './MapRoot.css';

export type MapRootProps = {
  center?: [number, number];
  zoom?: number;
  children?: ReactNode;
  onReady?: (map: mapboxgl.Map) => void;
};

export function MapRoot({
  center = [103.82, 1.35],
  zoom = 10.5,
  children,
  onReady,
}: MapRootProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    try {
      mapboxgl.accessToken = getMapboxToken();
      map.current = new mapboxgl.Map({
        container: container.current,
        style: BASEMAP_STYLE,
        center,
        zoom,
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
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="map-root" data-testid="map-root">
      <div ref={container} className="map-root__canvas" data-testid="map-canvas" />
      {error && (
        <div className="map-root__error" data-testid="map-error" role="alert">
          {error}
        </div>
      )}
      <div className="map-root__chrome">{children}</div>
    </div>
  );
}
