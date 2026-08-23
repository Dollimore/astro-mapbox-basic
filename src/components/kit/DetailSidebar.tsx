import { useEffect, useRef, type ReactNode } from 'react';
import { StatTile, type StatTone } from './StatTile.js';
import { Gauge } from './Gauge.js';
import './DetailSidebar.css';

export type DetailStat = {
  label: string;
  value: ReactNode;
  /** 0–1. Renders the beautifului.dev strength meter under the value. */
  meter?: number;
};

export type DetailTone = 'success' | 'alert' | 'info' | 'danger';

export type DetailTile = { value: string | number; unit?: string; label: string; tone?: StatTone };
export type DetailGauge = { value: number; label: string; display?: string; tone?: 'success' | 'alert' | 'info' | 'danger' | 'brand' };

export type DetailSidebarProps = {
  open: boolean;
  /** The Electricity Maps stat row: filled tiles first, then radial gauges. */
  tiles?: DetailTile[];
  gauges?: DetailGauge[];
  title: string;
  eyebrow?: string;
  badge?: { label: string; tone: DetailTone };
  stats?: DetailStat[];
  meta?: Array<{ label: string; value: ReactNode }>;
  sourceHref?: string;
  onClose: () => void;
  children?: ReactNode;
};

/**
 * The click-a-feature panel. Anchored right, full height, sliding rather than
 * appearing — a panel that snaps in reads as a popup, one that glides reads as
 * part of the surface. Stays mounted while closed so the exit animates too.
 */
export function DetailSidebar({
  open, title, eyebrow, badge, tiles = [], gauges = [], stats = [], meta = [],
  sourceHref, onClose, children,
}: DetailSidebarProps) {
  const panel = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <aside
      ref={panel}
      className="kit-detail"
      data-open={open}
      data-testid="detail-sidebar"
      aria-hidden={!open}
      aria-label={title}
    >
      <header className="kit-detail__head">
        <div className="kit-detail__heading">
          {eyebrow && <p className="kit-detail__eyebrow mono">{eyebrow}</p>}
          <h2 className="panel-title">{title}</h2>
          {badge && (
            <span className="badge" data-tone={badge.tone} data-testid="detail-badge">
              {badge.label}
            </span>
          )}
        </div>
        <button
          type="button"
          className="kit-detail__close"
          aria-label="Close details"
          data-testid="detail-close"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      <div className="kit-detail__body">
        {(tiles.length > 0 || gauges.length > 0) && (
          <section className="kit-detail__readout" data-testid="detail-readout">
            {tiles.map((t) => (
              <StatTile key={t.label} value={t.value} unit={t.unit} label={t.label} tone={t.tone} />
            ))}
            {gauges.map((g) => (
              <Gauge key={g.label} value={g.value} label={g.label} display={g.display} tone={g.tone} />
            ))}
          </section>
        )}

        {stats.length > 0 && (
          <section className="kit-detail__stats">
            {stats.map((s) => (
              <div key={s.label} className="kit-detail__stat">
                <span className="kit-detail__stat-label">{s.label}</span>
                <span className="kit-detail__stat-value mono">{s.value}</span>
                {s.meter !== undefined && (
                  <div className="meter" role="presentation">
                    <div
                      className="meter__fill"
                      style={{ width: `${Math.round(Math.min(Math.max(s.meter, 0), 1) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {meta.length > 0 && (
          <dl className="kit-detail__meta">
            {meta.map((m) => (
              <div key={m.label} className="kit-detail__meta-row">
                <dt>{m.label}</dt>
                <dd className="mono">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {children}
      </div>

      {sourceHref && (
        <footer className="kit-detail__foot">
          <a className="kit-detail__source" href={sourceHref} target="_blank" rel="noreferrer noopener">
            View source ↗
          </a>
        </footer>
      )}
    </aside>
  );
}
