import './StampMark.css';

export type StampMarkProps = {
  lat: number;
  lng: number;
  label?: string;
  variant?: 'default' | 'compact';
};

/** The terminal soul survives inside the glass world. */
export function StampMark({ lat, lng, label, variant = 'default' }: StampMarkProps) {
  const coords = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  return (
    <div className="stamp kit-stamp" data-variant={variant} data-testid="stamp">
      {label && <span className="kit-stamp__label">{label}</span>}
      <span className="kit-stamp__coords">{coords}</span>
    </div>
  );
}
