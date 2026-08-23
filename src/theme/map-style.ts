import type { Feature } from '../data/schema.js';

export const BASEMAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

/**
 * Colours are read from the CSS custom properties at runtime so tokens.css stays
 * the single source of truth and no literal ever appears outside src/theme/.
 */
function token(name: string): string {
  if (typeof window === 'undefined') return 'transparent';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || 'transparent';
}

export function statusColours(): Record<Feature['status'], string> {
  return {
    operational: token('--status-operational'),
    construction: token('--status-construction'),
    announced: token('--status-announced'),
    halted: token('--status-halted'),
  };
}

/** Points must read against terrain — a halo is not decoration. */
export function halo(): { width: number; colour: string } {
  return { width: 1.5, colour: token('--ink-max') };
}
