import './StoryCard.css';

export type StoryCardProps = {
  title: string;
  body?: string;
  stat?: { label: string; value: string | number };
  onClose?: () => void;
};

export function StoryCard({ title, body, stat, onClose }: StoryCardProps) {
  return (
    <div className="glass kit-card" data-testid="story-card" role="dialog" aria-label={title}>
      <div className="kit-card__head">
        <h2 className="panel-title kit-card__title">{title}</h2>
        {onClose && (
          <button type="button" className="kit-card__close" aria-label="Close" onClick={onClose}>×</button>
        )}
      </div>
      {stat && (
        <div className="kit-card__stat">
          <span className="kit-card__stat-value mono">{stat.value}</span>
          <span className="kit-card__stat-label">{stat.label}</span>
        </div>
      )}
      {body && <p className="panel-sub">{body}</p>}
    </div>
  );
}
