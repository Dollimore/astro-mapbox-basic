import type { ReactNode } from 'react';
import './ControlStack.css';

export type ControlStackProps = { children: ReactNode };

export function ControlStack({ children }: ControlStackProps) {
  return <div className="kit-controls" data-testid="control-stack">{children}</div>;
}

export type ControlButtonProps = { label: string; onClick?: () => void; children: ReactNode };

export function ControlButton({ label, onClick, children }: ControlButtonProps) {
  return (
    <button type="button" className="glass kit-controls__btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
