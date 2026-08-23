import type { Feature } from '../data/schema.js';

/**
 * The basemap is deliberately the same in both modes. The doctrine is that the
 * chrome is neutral and the MAP carries colour — swapping basemaps per mode
 * would change the map's identity, not just its skin. If a project wants a dark
 * basemap, that is a PLAN.md decision, and it changes only this constant.
 */
export const BASEMAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';
export const BASEMAP_STYLE_DARK = 'mapbox://styles/mapbox/dark-v11';

/** The basemap follows the mode: terrain in light, ink in dark. */
export function basemapFor(mode: Mode): string {
  return mode === 'dark' ? BASEMAP_STYLE_DARK : BASEMAP_STYLE;
}

/**
 * Read from CSS custom properties at runtime so tokens.css stays the single
 * source of truth — and so status colours re-tune automatically when the mode
 * flips (700-step in light, 300-step in dark).
 *
 * NOTE: only resolvable once the stylesheet is applied. Call from an effect,
 * never a render body. Use `useStatusColours()` in src/lib/.
 */
function token(name: string): string {
  if (typeof window === 'undefined') return 'transparent';
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? toMapboxColour(raw) : 'transparent';
}

let probe: CanvasRenderingContext2D | null = null;

/**
 * mapbox-gl parses CSS Color Level 3 only — hex, rgb(), hsl(), named. A modern
 * token system speaks oklch/oklab/color(), which the DOM renders happily but
 * the map rejects outright, printing "Could not parse color" and dropping the
 * layer. The legend keeps working (it is DOM), so the failure presents as
 * missing data rather than as a colour problem.
 *
 * Reading back `ctx.fillStyle` is not enough — modern Chrome returns oklch as
 * oklch, just re-serialised. So we actually RASTERISE one pixel and read its
 * RGBA. Whatever the browser can paint, we can hand to mapbox.
 */
export function toMapboxColour(value: string): string {
  if (/^(#|rgb\(|rgba\(|hsl\(|hsla\()/i.test(value)) return value;
  if (typeof document === 'undefined') return value;

  if (!probe) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    probe = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!probe) return value;

  try {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
    if (a === 0) return 'transparent';
    return a === 255
      ? `rgb(${r}, ${g}, ${b})`
      : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch {
    return value;
  }
}

export function statusColours(): Record<Feature['status'], string> {
  return {
    operational: token('--status-operational'),
    construction: token('--status-construction'),
    announced: token('--status-announced'),
    halted: token('--status-halted'),
  };
}

/** Points must read against terrain — a halo is structural, not decorative. */
export function halo(): { width: number; colour: string } {
  return { width: 1.5, colour: token('--raised') };
}

export type Mode = 'light' | 'dark';

export const MODE_STORAGE_KEY = 'map-kit-mode';

export function getMode(): Mode {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';
}

export function setMode(mode: Mode): void {
  document.documentElement.dataset.mode = mode;
  document.documentElement.style.colorScheme = mode;
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    // private mode / storage disabled — the toggle still works for this session
  }
}
