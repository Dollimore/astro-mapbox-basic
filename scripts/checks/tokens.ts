#!/usr/bin/env tsx
/**
 * check:tokens — the anti-slop enforcement.
 * 1. No colour literal under src/ outside src/theme/.
 * 2. No CSS-framework utility or import inside src/components/kit/ —
 *    kit components must stay portable to a future Vite sibling.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, sep } from 'node:path';

const ROOT = 'src';
const THEME = join('src', 'theme');
const KIT = join('src', 'components', 'kit');
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.astro', '.css']);

const COLOUR = [
  { name: 'hex', re: /#[0-9a-fA-F]{3,8}\b/g },
  { name: 'rgb', re: /\brgba?\s*\(/g },
  { name: 'hsl', re: /\bhsla?\s*\(/g },
  { name: 'oklch', re: /\boklch\s*\(/g },
];

const FRAMEWORK = [
  { name: 'framework import', re: /@import\s+["']tailwindcss|from\s+["']tailwindcss|@tailwind\b|@apply\b/g },
  { name: 'arbitrary-value utility', re: /\b(?:bg|text|border|fill|stroke|shadow|ring)-\[[^\]]+\]/g },
  { name: 'utility class', re: /\bclassName\s*=\s*["'][^"']*\b(?:flex|grid|p[xytrbl]?-\d|m[xytrbl]?-\d|gap-\d|w-\d|h-\d|text-(?:xs|sm|base|lg|xl)|bg-\w+-\d{2,3})\b/g },
];

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (EXT.has(extname(p))) acc.push(p);
  }
  return acc;
}

const errors: string[] = [];

for (const file of walk(ROOT)) {
  const rel = relative('.', file);
  const inTheme = rel.startsWith(THEME + sep);
  const inKit = rel.startsWith(KIT + sep);

  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    // Documenting a colour in a comment is allowed; using one is not.
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    if (!inTheme) {
      for (const { name, re } of COLOUR) {
        for (const m of line.matchAll(re)) {
          errors.push(`${rel}:${i + 1} — ${name} literal "${m[0]}". All colour lives in src/theme/.`);
        }
      }
    }
    if (inKit) {
      for (const { name, re } of FRAMEWORK) {
        for (const m of line.matchAll(re)) {
          errors.push(
            `${rel}:${i + 1} — ${name} "${m[0].slice(0, 40)}". Kit components must be framework-free.`
          );
        }
      }
    }
  });
}

if (errors.length) {
  console.error(`✗ check:tokens failed — ${errors.length} violation(s):`);
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}
console.log('✓ check:tokens — no colour literals outside src/theme/, no framework leaks in kit/.');
