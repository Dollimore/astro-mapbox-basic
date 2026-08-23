#!/usr/bin/env tsx
/**
 * check:dist — the one everyone misses.
 * Bundlers inline env vars, so a carelessly-referenced secret ships to the world
 * inside your JS. A pk. token here is EXPECTED and fine: it is public by design
 * and URL-restricted, therefore inert anywhere else. An sk. match is instant,
 * loud failure.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const DIST = 'dist';
const SCAN_EXT = new Set(['.js', '.mjs', '.cjs', '.html', '.json', '.css', '.map']);

const SK = /sk\.ey[A-Za-z0-9._-]{20,}/g;
const CANDIDATE = /\b[A-Za-z0-9+/_-]{40,}\b/g;
const ENTROPY_FLOOR = 4.5;

function shannon(s: string): number {
  const freq = new Map<string, number>();
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  for (const n of freq.values()) {
    const p = n / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (SCAN_EXT.has(extname(p))) acc.push(p);
  }
  return acc;
}

if (!existsSync(DIST)) {
  console.error('✗ check:dist — dist/ does not exist. Run npm run build first.');
  process.exit(1);
}

const fatal: string[] = [];
const warnings: string[] = [];
let pkSeen = 0;

for (const file of walk(DIST)) {
  const rel = relative('.', file);
  const src = readFileSync(file, 'utf8');

  for (const m of src.matchAll(SK)) {
    fatal.push(`${rel} — SECRET TOKEN in bundle: ${m[0].slice(0, 12)}…`);
  }
  if (/pk\.ey[A-Za-z0-9._-]{20,}/.test(src)) pkSeen++;

  for (const m of src.matchAll(CANDIDATE)) {
    const s = m[0];
    if (s.startsWith('pk.') || s.startsWith('sk.')) continue;
    if (shannon(s) >= ENTROPY_FLOOR) warnings.push(`${rel} — high-entropy string: ${s.slice(0, 16)}…`);
  }
}

if (pkSeen > 0) {
  console.log(`  note: pk. token present in ${pkSeen} file(s) — expected, public, URL-restricted.`);
}
if (warnings.length) {
  console.log(`  ${warnings.length} high-entropy string(s) — review if unexpected:`);
  for (const w of warnings.slice(0, 5)) console.log(`    · ${w}`);
}
if (fatal.length) {
  console.error(`✗ check:dist FAILED — ${fatal.length} secret(s) shipped to the bundle:`);
  for (const f of fatal) console.error(`  · ${f}`);
  process.exit(1);
}
console.log('✓ check:dist — no secret tokens in the bundle.');
