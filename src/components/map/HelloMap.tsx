import { useCallback, useMemo, useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import { MapRoot } from './MapRoot.js';
import { FeaturesLayer } from './layers/FeaturesLayer.js';
import { HeadlineBlock } from '../kit/HeadlineBlock.js';
import { CounterStrip } from '../kit/CounterStrip.js';
import { ControlStack, ControlButton } from '../kit/ControlStack.js';
import { LegendCanvas } from '../kit/LegendCanvas.js';
import { TimePanel } from '../kit/TimePanel.js';
import { HintToast } from '../kit/HintToast.js';
import { StoryPin } from '../kit/StoryPin.js';
import { StampMark } from '../kit/StampMark.js';
import { DetailSidebar, type DetailTone } from '../kit/DetailSidebar.js';
import { loadFeatures } from '../../lib/loadData.js';
import { usePalette } from '../../lib/useStatusColours.js';
import { getMode, setMode } from '../../theme/map-style.js';
import { titleCase, formatCoords } from '../../lib/format.js';
import type { Feature } from '../../data/schema.js';

const TONE: Record<Feature['status'], DetailTone> = {
  operational: 'success',
  construction: 'alert',
  announced: 'info',
  halted: 'danger',
};

export function HelloMap() {
  const features = useMemo(() => loadFeatures(), []);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selected, setSelected] = useState<Feature | null>(null);
  const [year, setYear] = useState(2014);
  const [playing, setPlaying] = useState(false);
  const [dark, setDark] = useState(false);
  const [, setTick] = useState(0);

  const palette = usePalette();

  // Pins are absolutely positioned in screen space, so they must re-project
  // whenever the map moves. A render tick on 'move' is the cheapest correct fix.
  const handleReady = useCallback((m: mapboxgl.Map) => {
    setMap(m);
    setDark(getMode() === 'dark');
    m.on('move', () => setTick((t) => t + 1));
  }, []);

  const toggleMode = useCallback(() => {
    const next = getMode() === 'dark' ? 'light' : 'dark';
    setMode(next);
    setDark(next === 'dark');
  }, []);

  const pins = features.slice(0, 4);
  const operational = features.filter((f) => f.status === 'operational').length;
  const maxValue = Math.max(...features.map((f) => f.value ?? 0), 1);

  return (
    <MapRoot onReady={handleReady} insetRight={selected ? 'var(--detail-width)' : '0px'}>
      <FeaturesLayer map={map} features={features} palette={palette} onSelect={setSelected} />

      <HeadlineBlock title="astro-mapbox-basic" subline="A basic Astro + Mapbox boilerplate" live>
        <CounterStrip
          primary={{ label: 'sample records', value: features.length }}
          secondary={[{ label: 'operational', value: operational }]}
        />
        <StampMark lat={1.3521} lng={103.8198} label="Singapore" variant="compact" />
        <span data-testid="feature-count" hidden>{features.length}</span>
      </HeadlineBlock>

      <ControlStack>
        <ControlButton label="Zoom in" onClick={() => map?.zoomIn()}>+</ControlButton>
        <ControlButton label="Zoom out" onClick={() => map?.zoomOut()}>−</ControlButton>
        <ControlButton
          label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={toggleMode}
        >
          {dark ? '☀' : '☾'}
        </ControlButton>
      </ControlStack>

      <TimePanel
        range={[2014, 2026]} value={year} interval="year" playable playing={playing}
        onPlayToggle={() => setPlaying((p) => !p)} onChange={setYear}
      />

      {palette && (
        <LegendCanvas
          mode="swatches" title="Status"
          items={[
            { label: 'Operational', colour: palette.status.operational },
            { label: 'Construction', colour: palette.status.construction },
            { label: 'Announced', colour: palette.status.announced },
            { label: 'Halted', colour: palette.status.halted },
          ]}
        />
      )}

      {map && pins.map((f, i) => {
        const pt = map.project([f.lng, f.lat]);
        return (
          <StoryPin
            key={f.id} n={i + 1} lngLat={[f.lng, f.lat]} title={f.name}
            line={titleCase(f.status)} screen={{ x: pt.x, y: pt.y }}
          />
        );
      })}

      <DetailSidebar
        open={selected !== null}
        eyebrow={selected?.id}
        title={selected?.name ?? ''}
        badge={selected ? { label: titleCase(selected.status), tone: TONE[selected.status] } : undefined}
        tiles={
          selected?.value !== undefined
            ? [{ value: selected.value, unit: 'MW', label: 'Capacity', tone: TONE[selected.status] }]
            : []
        }
        gauges={
          selected?.value !== undefined
            ? [{
                value: selected.value / maxValue,
                label: 'Share of largest',
                tone: TONE[selected.status] === 'danger' ? 'danger' : 'success',
              }]
            : []
        }
        meta={
          selected
            ? [
                { label: 'Status', value: titleCase(selected.status) },
                { label: 'Coordinates', value: formatCoords(selected.lat, selected.lng) },
                { label: 'ID', value: selected.id },
              ]
            : []
        }
        sourceHref={selected?.source_url}
        onClose={() => setSelected(null)}
      />

      <HintToast text="Click a marker to inspect it" />
    </MapRoot>
  );
}
