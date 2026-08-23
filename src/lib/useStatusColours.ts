import { useEffect, useState } from 'react';
import { statusColours, halo } from '../theme/map-style.js';
import type { Feature } from '../data/schema.js';

export type Palette = {
  status: Record<Feature['status'], string>;
  halo: { width: number; colour: string };
};

/**
 * Theme colours live in CSS custom properties, which resolve only once the
 * stylesheet is applied. Reading them in a render body returns `transparent`
 * on the hydration pass — which silently produced an empty legend while the
 * map layer (read inside an effect) looked correct.
 *
 * Resolves after mount, and again whenever [data-mode] flips, so a light/dark
 * switch re-tunes the data colours instead of stranding the previous mode's.
 * Returns null until the first resolve so callers can hold off rendering.
 */
export function usePalette(): Palette | null {
  const [palette, setPalette] = useState<Palette | null>(null);

  useEffect(() => {
    const resolve = () => setPalette({ status: statusColours(), halo: halo() });
    resolve();

    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-mode'],
    });
    return () => observer.disconnect();
  }, []);

  return palette;
}
