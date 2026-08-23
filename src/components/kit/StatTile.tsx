import './StatTile.css';

export type StatTone = 'success' | 'alert' | 'info' | 'danger' | 'neutral';

export type StatTileProps = {
  value: string | number;
  unit?: string;
  label: string;
  tone?: StatTone;
  title?: string;
};

/**
 * The Electricity Maps stat tile: a filled rounded square carrying the number,
 * with its caption sitting outside and below. The fill IS the encoding — tone
 * comes from the semantic status tokens, so it re-tunes across light and dark.
 */
export function StatTile({ value, unit, label, tone = 'neutral', title }: StatTileProps) {
  return (
    <figure className="kit-tile" data-testid="stat-tile" title={title}>
      <div className="kit-tile__face" data-tone={tone}>
        <span className="kit-tile__value">{value}</span>
        {unit && <span className="kit-tile__unit">{unit}</span>}
      </div>
      <figcaption className="kit-tile__label">{label}</figcaption>
    </figure>
  );
}
