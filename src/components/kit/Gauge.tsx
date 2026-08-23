import './Gauge.css';

export type GaugeProps = {
  /** 0–1. Clamped. */
  value: number;
  label: string;
  display?: string;
  tone?: 'success' | 'alert' | 'info' | 'danger' | 'brand';
};

const SIZE = 72;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;
/** Leave a gap at the bottom — a full ring reads as a spinner, not a value. */
const SWEEP = 0.78;

/**
 * The Electricity Maps radial gauge. An arc on a muted track: the eye reads
 * proportion from arc length without needing the number, and the number is
 * there anyway for the people who want it.
 */
export function Gauge({ value, label, display, tone = 'success' }: GaugeProps) {
  const pct = Math.min(Math.max(value, 0), 1);
  const arc = CIRC * SWEEP;

  return (
    <figure className="kit-gauge" data-testid="gauge" data-tone={tone}>
      <div className="kit-gauge__dial">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <g transform={`rotate(${90 + (1 - SWEEP) * 180} ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              className="kit-gauge__track"
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none" strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={`${arc} ${CIRC}`}
            />
            <circle
              className="kit-gauge__value"
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none" strokeWidth={STROKE} strokeLinecap="round"
              strokeDasharray={`${arc * pct} ${CIRC}`}
            />
          </g>
        </svg>
        <span className="kit-gauge__readout" data-testid="gauge-readout">
          {display ?? `${Math.round(pct * 100)}%`}
        </span>
      </div>
      <figcaption className="kit-gauge__label">{label}</figcaption>
    </figure>
  );
}
