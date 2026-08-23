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
import { StoryCard } from '../kit/StoryCard.js';
import { StoryPin } from '../kit/StoryPin.js';
import { StampMark } from '../kit/StampMark.js';
import { loadFeatures } from '../../lib/loadData.js';
import { statusColours } from '../../theme/map-style.js';
import { titleCase } from '../../lib/format.js';
import type { Feature } from '../../data/schema.js';

export function HelloMap() {
  const features = useMemo(() => loadFeatures(), []);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selected, setSelected] = useState<Feature | null>(null);
  const [year, setYear] = useState(2014);
  const [playing, setPlaying] = useState(false);
  const [, setTick] = useState(0);

  // Pins are absolutely positioned in screen space, so they must re-project
  // whenever the map moves. A render tick on 'move' is the cheapest correct fix.
  const handleReady = useCallback((m: mapboxgl.Map) => {
    setMap(m);
    m.on('move', () => setTick((t) => t + 1));
  }, []);

  const colours = statusColours();
  const pins = features.slice(0, 4);
  const operational = features.filter((f) => f.status === 'operational').length;

  return (
    <MapRoot onReady={handleReady}>
      <FeaturesLayer map={map} features={features} onSelect={setSelected} />

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
      </ControlStack>

      <TimePanel
        range={[2014, 2026]} value={year} interval="year" playable playing={playing}
        onPlayToggle={() => setPlaying((p) => !p)} onChange={setYear}
      />

      <LegendCanvas
        mode="swatches" title="Status"
        items={[
          { label: 'Operational', colour: colours.operational },
          { label: 'Construction', colour: colours.construction },
          { label: 'Announced', colour: colours.announced },
          { label: 'Halted', colour: colours.halted },
        ]}
      />

      {map && pins.map((f, i) => {
        const pt = map.project([f.lng, f.lat]);
        return (
          <StoryPin
            key={f.id} n={i + 1} lngLat={[f.lng, f.lat]} title={f.name}
            line={titleCase(f.status)} screen={{ x: pt.x, y: pt.y }}
          />
        );
      })}

      {selected && (
        <StoryCard
          title={selected.name}
          body={titleCase(selected.status)}
          stat={selected.value !== undefined ? { label: 'value', value: selected.value } : undefined}
          onClose={() => setSelected(null)}
        />
      )}

      <HintToast text="Click a marker to inspect it" />
    </MapRoot>
  );
}
