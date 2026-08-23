#!/usr/bin/env tsx
/**
 * check:env — reconcile every env read against .env.example.
 * Fails if: a read var is undeclared · an example value is non-empty ·
 * git tracks any .env* other than .env.example.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, extname } from 'node:path';

const SCAN_DIRS = ['src', 'scripts/checks', 'data-pipeline'];
const SCAN_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.astro']);
const ENV_READ = /(?:process\.env|import\.meta\.env)\.([A-Z0-9_]+)/g;

// Provided by the bundler/runtime, never declared in .env.example.
const BUILTIN = new Set([
  'MODE', 'BASE_URL', 'PROD', 'DEV', 'SSR', 'SITE', 'ASSETS_PREFIX', 'NODE_ENV', 'PATH', 'CI',
]);

function walk(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (SCAN_EXT.has(extname(p))) acc.push(p);
  }
  return acc;
}

const errors: string[] = [];

// 1 · .env.example must exist, and every value must be empty.
const declared = new Set<string>();
if (!existsSync('.env.example')) {
  errors.push('.env.example is missing.');
} else {
  readFileSync('.env.example', 'utf8').split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith('#')) return;
    const eq = line.indexOf('=');
    if (eq === -1) {
      errors.push(`.env.example:${i + 1} is not KEY= — got "${line}"`);
      return;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    declared.add(key);
    if (value !== '') {
      errors.push(
        `.env.example:${i + 1} — ${key} has a value. Examples name variables, never contain values.`
      );
    }
  });
}

// 2 · Every env read must be declared.
const reads = new Map<string, string[]>();
for (const file of SCAN_DIRS.flatMap((d) => walk(d))) {
  for (const m of readFileSync(file, 'utf8').matchAll(ENV_READ)) {
    const name = m[1]!;
    if (BUILTIN.has(name)) continue;
    if (!reads.has(name)) reads.set(name, []);
    if (!reads.get(name)!.includes(file)) reads.get(name)!.push(file);
  }
}
for (const [name, files] of reads) {
  if (!declared.has(name)) {
    errors.push(`${name} is read in ${files.join(', ')} but is not in .env.example`);
  }
}

// 3 · git must not track any .env* except .env.example.
try {
  const tracked = execSync("git ls-files -- '.env*'", { encoding: 'utf8' }).trim();
  for (const f of tracked.split('\n').filter(Boolean)) {
    if (f !== '.env.example') errors.push(`git is tracking ${f}. Only .env.example may be tracked.`);
  }
} catch {
  // Not a git repo — skip rather than fail.
}

if (errors.length) {
  console.error('✗ check:env failed:');
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(`✓ check:env — ${declared.size} declared, ${reads.size} read, all reconciled.`);
