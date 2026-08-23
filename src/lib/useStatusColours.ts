import { useEffect, useState } from 'react';
import { statusColours } from '../theme/map-style.js';
import type { Feature } from '../data/schema.js';

type Colours = Record<Feature['status'], string>;

/**
 * Theme colours live in CSS custom properties, which are only resolvable once
 * the stylesheet has been applied. Reading them in a component's render body
 * returns `transparent` on the hydration pass — which silently produced an
 * empty legend while the map layer (read inside an effect) looked correct.
 *
 * Resolve after mount instead. Returns null until then so callers can hold off.
 */
export function useStatusColours(): Colours | null {
  const [colours, setColours] = useState<Colours | null>(null);
  useEffect(() => { setColours(statusColours()); }, []);
  return colours;
}
