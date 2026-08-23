import './LegendCanvas.css';

export type LegendItem = { label: string; colour: string };

export type LegendCanvasProps =
  | { mode: 'swatches'; title: string; items: LegendItem[]; stops?: never }
  | { mode: 'gradient'; title: string; stops: LegendItem[]; items?: never };

/** Always visible, never a menu. */
export function LegendCanvas(props: LegendCanvasProps) {
  const { mode, title } = props;
  return (
    <div className="glass kit-legend" data-testid="legend">
      <p className="kit-legend__title">{title}</p>
      {mode === 'swatches' ? (
        <ul className="kit-legend__list">
          {props.items.map((it) => (
            <li key={it.label} className="kit-legend__item" data-testid="legend-item">
              <span className="kit-legend__swatch" style={{ background: it.colour }} aria-hidden="true" />
              <span>{it.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="kit-legend__gradient">
          <div
            className="kit-legend__ramp"
            style={{ backgroundImage: `linear-gradient(90deg, ${props.stops.map((s) => s.colour).join(', ')})` }}
            aria-hidden="true"
          />
          <div className="kit-legend__ticks">
            {props.stops.map((s) => (
              <span key={s.label} className="mono" data-testid="legend-item">{s.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
