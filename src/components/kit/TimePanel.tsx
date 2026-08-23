import { useEffect, useRef } from 'react';
import { Chip } from './Chip.js';
import './TimePanel.css';

export type TimePanelProps = {
  range: [number, number];
  value: number;
  interval?: string;
  onChange: (value: number) => void;
  playable?: boolean;
  playing?: boolean;
  onPlayToggle?: () => void;
};

/** THE Electricity-Maps scrubber. Hero-mechanic host for temporal maps. */
export function TimePanel({
  range, value, interval, onChange,
  playable = false, playing = false, onPlayToggle,
}: TimePanelProps) {
  const [min, max] = range;
  const timer = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      onChange(value >= max ? min : value + 1);
    }, 700);
    return () => window.clearInterval(timer.current);
  }, [playing, value, min, max, onChange]);

  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="glass kit-time" data-testid="time-panel">
      <div className="kit-time__head">
        <span className="kit-time__value mono" data-testid="time-value">{value}</span>
        {interval && <Chip label={interval} active />}
      </div>
      <div className="kit-time__controls">
        {playable && (
          <button
            type="button"
            className="kit-time__play"
            data-playing={playing}
            data-testid="time-play"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={onPlayToggle}
          >
            {playing ? '❚❚' : '▶'}
          </button>
        )}
        <div className="kit-time__track">
          <input
            type="range" min={min} max={max} step={1} value={value}
            data-testid="time-slider" aria-label="Time"
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <div className="kit-time__ticks" aria-hidden="true">
            {ticks.map((t) => <span key={t} className="kit-time__tick" data-on={t <= value} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
