#!/usr/bin/env tsx
/**
 * check:data — every record in src/data/ must satisfy the frozen schema.
 * Prints counts and geographic bounds so a human can eyeball plausibility.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { FeatureCollectionSchema } from '../../src/data/schema.js';

const DIR = 'src/data';
if (!existsSync(DIR)) {
  console.error(`✗ check:data — ${DIR} does not exist.`);
  process.exit(1);
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
if (files.length === 0) {
  console.error(`✗ check:data — no .json files in ${DIR}.`);
  process.exit(1);
}

let failed = false;

for (const file of files) {
  const path = join(DIR, file);
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`✗ ${file} — invalid JSON: ${(err as Error).message}`);
    failed = true;
    continue;
  }

  const result = FeatureCollectionSchema.safeParse(parsed);
  if (!result.success) {
    console.error(`✗ ${file} — ${result.error.issues.length} validation issue(s):`);
    for (const issue of result.error.issues.slice(0, 10)) {
      console.error(`    [${issue.path.join('.')}] ${issue.message}`);
    }
    failed = true;
    continue;
  }

  const rows = result.data;
  const lats = rows.map((r) => r.lat);
  const lngs = rows.map((r) => r.lng);
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`✓ ${file} — ${rows.length} records`);
  console.log(
    `    bounds  lat ${Math.min(...lats).toFixed(4)} … ${Math.max(...lats).toFixed(4)}` +
      `  lng ${Math.min(...lngs).toFixed(4)} … ${Math.max(...lngs).toFixed(4)}`
  );
  console.log(`    status  ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join('  ')}`);
}

process.exit(failed ? 1 : 0);
