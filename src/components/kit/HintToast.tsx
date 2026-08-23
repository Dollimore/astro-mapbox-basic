import { useEffect, useState } from 'react';
import './HintToast.css';

export type HintToastProps = { text: string; showOnce?: boolean };

/** Single-interaction teacher. Fades on the first interaction, then never returns. */
export function HintToast({ text, showOnce = true }: HintToastProps) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!showOnce) return;
    const dismiss = () => {
      setLeaving(true);
      window.setTimeout(() => setVisible(false), 240); // matches --t-med
    };
    const events = ['pointerdown', 'keydown', 'wheel'] as const;
    for (const e of events) window.addEventListener(e, dismiss, { once: true });
    return () => { for (const e of events) window.removeEventListener(e, dismiss); };
  }, [showOnce]);

  if (!visible) return null;
  return (
    <div className="glass kit-hint" data-leaving={leaving} data-testid="hint-toast" role="status">
      {text}
    </div>
  );
}
