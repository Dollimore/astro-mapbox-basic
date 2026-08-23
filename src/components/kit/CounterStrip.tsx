import { useEffect, useRef, useState } from 'react';
import './CounterStrip.css';

export type Stat = { label: string; value: number | string };
export type CounterStripProps = { primary: Stat; secondary?: Stat[]; methodHref?: string };

/** Count-up on change, capped at 400ms. Numbers feel alive; they never blink. */
function useCountUp(target: number | string): string {
  const [shown, setShown] = useState<number | string>(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (typeof target !== 'number' || typeof shown !== 'number') { setShown(target); return; }
    const from = shown;
    const delta = target - from;
    if (delta === 0) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / 400, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + delta * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return typeof shown === 'number' ? shown.toLocaleString() : String(shown);
}

export function CounterStrip({ primary, secondary = [], methodHref }: CounterStripProps) {
  const value = useCountUp(primary.value);
  return (
    <div className="kit-counter" data-testid="counter-strip">
      <div className="kit-counter__primary">
        <span className="kit-counter__value mono" data-testid="counter-primary">{value}</span>
        <span className="kit-counter__label">{primary.label}</span>
      </div>
      {secondary.length > 0 && (
        <div className="kit-counter__secondary">
          {secondary.map((s) => (
            <span key={s.label} className="kit-counter__pair">
              <span className="mono">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
              <span className="kit-counter__label">{s.label}</span>
            </span>
          ))}
        </div>
      )}
      {methodHref && <a className="kit-counter__method" href={methodHref}>(how we estimate)</a>}
    </div>
  );
}
