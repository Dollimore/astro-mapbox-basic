import './Chip.css';

export type ChipProps = { label: string; active?: boolean; onClick?: () => void };

export function Chip({ label, active = false, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className="chip kit-chip"
      data-active={active}
      data-testid="chip"
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
