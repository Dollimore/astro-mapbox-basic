import { useEffect, useState, type ReactNode } from 'react';
import './HeadlineBlock.css';

export type HeadlineBlockProps = {
  title: string;
  subline?: string;
  live?: boolean;
  children?: ReactNode;
};

export function HeadlineBlock({ title, subline, live = false, children }: HeadlineBlockProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    if (!live) return;
    const tick = () => setClock(new Date().toISOString().slice(11, 19) + 'Z');
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [live]);

  return (
    <div className="glass kit-headline" data-testid="headline-block">
      <div className="kit-headline__row">
        <h1 className="panel-title">{title}</h1>
        {live && (
          <span className="kit-headline__live mono" data-testid="live-badge">
            <span className="kit-headline__dot" aria-hidden="true" />
            {clock}
          </span>
        )}
      </div>
      {subline && <p className="panel-sub">{subline}</p>}
      {children}
    </div>
  );
}
