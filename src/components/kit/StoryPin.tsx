import { useState } from 'react';
import './StoryPin.css';

export type StoryPinProps = {
  n: number;
  lngLat: [number, number];
  title: string;
  line: string;
  /** Screen position supplied by the map projection. */
  screen: { x: number; y: number };
};

export function StoryPin({ n, title, line, screen }: StoryPinProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="kit-pin" style={{ left: `${screen.x}px`, top: `${screen.y}px` }} data-testid="story-pin">
      <button
        type="button"
        className="kit-pin__dot mono"
        aria-expanded={open}
        aria-label={title}
        onClick={() => setOpen((o) => !o)}
      >
        {n}
      </button>
      {open && (
        <div className="glass kit-pin__card" data-testid="story-pin-card">
          <p className="kit-pin__title">{title}</p>
          <p className="panel-sub">{line}</p>
        </div>
      )}
    </div>
  );
}
