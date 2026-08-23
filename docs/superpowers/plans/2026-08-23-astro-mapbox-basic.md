# astro-mapbox-basic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public, forkable Astro + Mapbox boilerplate where `git clone → npm install → npm run dev` puts a live, themed map on screen in under three minutes, with a secrets layer that physically cannot be defeated by an agent or a human.

**Architecture:** The repo *is* the template — no `templates/` nesting. All visual values live in `src/theme/` (three files); ten kit components in `src/components/kit/` consume those tokens through co-located plain CSS and hold zero visual opinions. Per-project logic is confined to `src/components/map/`. Six networkless check scripts gate every build, and four sabotage tests prove the secrets machinery actually bites.

**Tech Stack:** Astro 7.2.4 · React 19.2.8 islands via `@astrojs/react` 6.0.4 · mapbox-gl 3.29.0 · zod 4.4.3 · tsx 4.23.12 · lefthook 2.1.10 + gitleaks · Playwright · Cloudflare Workers static assets via wrangler.

**Spec:** `docs/superpowers/specs/2026-08-23-astro-mapbox-basic-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Node** pinned to `24.19.0` via `.nvmrc`. Run `nvm install 24 && nvm use` before anything.
- **Exact versions:** astro `7.2.4`, `@astrojs/react` `6.0.4`, react + react-dom `19.2.8`, mapbox-gl `3.29.0`, zod `4.4.3`, tsx `4.23.12`, lefthook `2.1.10`, wrangler `4.63.0`.
- **zod is v4.** Its API differs from the zod 3 idioms in wide circulation. Verify every schema against zod 4 before assuming a v3 pattern works.
- **No colour literal** — hex, `rgb()`, `rgba()`, `hsl()` — may appear anywhere under `src/` except `src/theme/`. `check:tokens` fails the build on any hit.
- **No CSS framework** anywhere in the repo. No Tailwind package, config, or import.
- **No Astro-specific API inside `src/components/kit/`.** Kit components must stay portable to a future Vite sibling. `check:tokens` enforces this.
- **No literal token string** (`pk.ey…` / `sk.ey…`) anywhere in the repo. Secrets are read from env only. Writing one is task failure even if the code works.
- **`.env` is gitignored from the first commit** and must never become tracked.
- **Commit after every task.** Never use `--no-verify`.
- Playwright is the only test framework; check scripts are plain TypeScript that exit non-zero.

---

## File Structure

| Path | Responsibility |
|---|---|
| `.nvmrc`, `package.json`, `tsconfig.json`, `astro.config.mjs` | Toolchain and engine pins |
| `.gitignore`, `.env.example`, `lefthook.yml` | Secrets machinery, commit-time layer |
| `scripts/checks/tokens.ts` | Colour-literal + framework-leak detection |
| `scripts/checks/data.ts` | zod validation of `src/data/` |
| `scripts/checks/env.ts` | env-read ↔ `.env.example` reconciliation |
| `scripts/checks/dist.ts` | Post-build bundle scan for `sk.` and high entropy |
| `scripts/checks/sabotage.ts` | Four attacks in a throwaway worktree |
| `src/theme/tokens.css` | Every custom property — the entire visual identity |
| `src/theme/recipes.css` | `.glass`, `.shimmer`, panel/chip/stamp surfaces |
| `src/theme/map-style.ts` | Basemap URL, status colours, halo config |
| `src/components/kit/*.tsx` + `*.css` | Ten components, one responsibility each, co-located CSS |
| `src/components/map/MapRoot.tsx` | mapbox-gl init, style load, resize |
| `src/components/map/layers/*.tsx` | One file per data layer |
| `src/lib/mapbox.ts` | Token read, style URL, shared map helpers |
| `src/lib/loadData.ts` | Fetch + zod-parse `src/data/` |
| `src/lib/format.ts` | Numbers, dates, coordinates |
| `src/data/schema.ts` | THE CONTRACT — zod schemas, frozen in Phase 0 |
| `src/data/sample.json` | 10 hand-written records |
| `src/pages/index.astro` | The hello-map page |
| `tests/hello-map.spec.ts` | Playwright visual + presence assertions |

---

## Task 1: Repo skeleton and toolchain

**Files:**
- Create: `.nvmrc`, `package.json`, `tsconfig.json`, `astro.config.mjs`, `.env.example`, `wrangler.jsonc`, `src/pages/index.astro`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: `npm run dev`, `npm run build`, `npm run typecheck`. All later tasks add scripts to this `package.json`.

- [ ] **Step 1: Pin Node**

```bash
cd ~/code/astro-mapbox-basic
echo "24.19.0" > .nvmrc
nvm install 24 && nvm use
node -v   # must print v24.19.0
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "astro-mapbox-basic",
  "type": "module",
  "version": "0.1.0",
  "private": false,
  "engines": { "node": ">=24.19.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "typecheck": "tsc --noEmit",
    "postinstall": "lefthook install"
  },
  "dependencies": {
    "astro": "7.2.4",
    "@astrojs/react": "6.0.4",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "mapbox-gl": "3.29.0",
    "zod": "4.4.3"
  },
  "devDependencies": {
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.8",
    "tsx": "4.23.12",
    "typescript": "5.9.3",
    "lefthook": "2.1.10",
    "wrangler": "4.63.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["astro/client"],
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*", "scripts/**/*", "tests/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 4: Write `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  server: { port: 4321 },
});
```

- [ ] **Step 5: Write `.env.example` (values MUST be empty)**

```
# Public Mapbox token (pk.…) — URL-RESTRICT this token in your Mapbox account
# so it only works on your domains. A leaked restricted pk token is inert.
PUBLIC_MAPBOX_TOKEN=

# Secret token (sk.…) — ONLY if the data pipeline needs Mapbox APIs.
# Never referenced by src/. Never needed at build or runtime.
MAPBOX_SECRET_TOKEN=
```

- [ ] **Step 6: Write `wrangler.jsonc`**

```jsonc
{
  "name": "astro-mapbox-basic",
  "compatibility_date": "2026-08-23",
  "assets": { "directory": "./dist" }
}
```

- [ ] **Step 7: Write a placeholder page so the build has something to emit**

`src/pages/index.astro`:

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>astro-mapbox-basic</title>
  </head>
  <body>
    <main id="app"></main>
  </body>
</html>
```

- [ ] **Step 8: Verify the toolchain works**

```bash
npm install
npm run typecheck   # expect: no output, exit 0
npm run build       # expect: dist/ created, exit 0
```

Expected: both exit 0. If `postinstall` fails because `lefthook.yml` does not exist yet, that is expected — Task 2 creates it. Re-run `npm install` after Task 2.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: repo skeleton, Astro 7 + React islands, Node 24 pin"
```

---

## Task 2: Commit-time secrets layer (sabotage S1)

**Files:**
- Create: `lefthook.yml`, `scripts/checks/sabotage.ts`
- Modify: `package.json` (add `check:secrets`, `test:sabotage`)

**Interfaces:**
- Consumes: Task 1's `package.json`
- Produces: `npm run check:secrets`, `npm run test:sabotage`. `sabotage.ts` exports nothing; it is a CLI entry. Later tasks (3, 6) append cases to its `ATTACKS` array.

- [ ] **Step 1: Write the failing test first — the sabotage harness with attack S1**

`scripts/checks/sabotage.ts`:

```ts
#!/usr/bin/env tsx
/**
 * Sabotage suite: prove the secrets machinery actually bites.
 * Every attack runs inside a throwaway git worktree so the real repo is never dirtied.
 * A sabotage test that PASSES when it should FAIL is itself a build failure.
 */
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A syntactically valid but entirely fake token. Never a real credential.
const FAKE_SK = 'sk.<assembled-at-runtime>';

type Attack = {
  id: string;
  what: string;
  caughtBy: string;
  /** Mutate the sandbox, then return true if the defence caught it. */
  run: (dir: string) => boolean;
};

/** Run a command in `dir`. Returns exit code and combined output. */
function sh(cmd: string, dir: string): { code: number; out: string } {
  const r = spawnSync('bash', ['-lc', cmd], { cwd: dir, encoding: 'utf8' });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const ATTACKS: Attack[] = [
  {
    id: 'S1',
    what: 'plant a fake sk. token in a staged commit',
    caughtBy: 'lefthook pre-commit',
    run: (dir) => {
      writeFileSync(join(dir, 'src/leak.ts'), `export const t = "${FAKE_SK}";\n`);
      sh('git add src/leak.ts', dir);
      const { code } = sh('git commit -m "sabotage S1"', dir);
      return code !== 0; // caught == commit refused
    },
  },
];

function main() {
  const repo = process.cwd();
  const sandbox = mkdtempSync(join(tmpdir(), 'sabotage-'));
  let failures = 0;

  for (const attack of ATTACKS) {
    const dir = join(sandbox, attack.id);
    execSync(`git worktree add --detach "${dir}"`, { cwd: repo, stdio: 'ignore' });
    // Hooks are per-worktree; install them into the sandbox.
    sh('npx lefthook install', dir);

    let caught = false;
    try {
      caught = attack.run(dir);
    } catch (err) {
      caught = false;
      console.error(`  ${attack.id} threw: ${(err as Error).message}`);
    }

    console.log(
      `${caught ? '✓' : '✗'} ${attack.id}  ${attack.what}\n     expected catcher: ${attack.caughtBy}`
    );
    if (!caught) failures++;

    execSync(`git worktree remove --force "${dir}"`, { cwd: repo, stdio: 'ignore' });
  }

  rmSync(sandbox, { recursive: true, force: true });

  if (failures > 0) {
    console.error(`\n✗ ${failures} sabotage attack(s) NOT caught. The machinery is not working.`);
    process.exit(1);
  }
  console.log(`\n✓ all ${ATTACKS.length} sabotage attack(s) caught.`);
}

main();
```

- [ ] **Step 2: Add the scripts, then run the suite to watch S1 FAIL**

Add to `package.json` `"scripts"`:

```json
"check:secrets": "gitleaks detect --no-banner --redact",
"test:sabotage": "tsx scripts/checks/sabotage.ts"
```

Run:

```bash
npm run test:sabotage
```

Expected: `✗ S1  plant a fake sk. token in a staged commit` and exit 1. The commit succeeds because no hook exists yet. **This failure is the point** — it proves the test can detect a missing defence.

- [ ] **Step 3: Write `lefthook.yml` — the minimal defence that makes S1 pass**

```yaml
pre-commit:
  parallel: true
  commands:
    gitleaks:
      run: gitleaks protect --staged --no-banner --redact
    token-literal:
      run: |
        if git diff --staged -G'(pk|sk)\.ey[A-Za-z0-9._-]{20,}' --name-only | grep -q .; then
          echo "✗ Mapbox token literal found in staged changes. Read SECRETS.md."
          exit 1
        fi
```

- [ ] **Step 4: Install hooks and re-run the suite to watch S1 PASS**

```bash
npx lefthook install
npm run test:sabotage
```

Expected: `✓ S1 …` and `✓ all 1 sabotage attack(s) caught.`, exit 0.

- [ ] **Step 5: Verify `check:secrets` runs clean on the real tree**

```bash
npm run check:secrets
```

Expected: exit 0, no leaks. The fake token lives only in `scripts/checks/sabotage.ts`. If gitleaks flags it, add a `.gitleaksignore` entry for that path with a comment explaining it is a deliberate fixture — do not weaken the global rules.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: commit-time secrets layer with lefthook + gitleaks, sabotage S1"
```

---

## Task 3: `check:env` (sabotage S3 and S4)

**Files:**
- Create: `scripts/checks/env.ts`
- Modify: `package.json`, `scripts/checks/sabotage.ts`

**Interfaces:**
- Consumes: Task 2's `ATTACKS` array
- Produces: `npm run check:env`. Exits 0 when every env read is declared, all `.env.example` values are empty, and no `.env*` other than `.env.example` is tracked.

- [ ] **Step 1: Add attacks S3 and S4 to `ATTACKS` in `scripts/checks/sabotage.ts`**

Insert these two objects after the S1 object:

```ts
  {
    id: 'S3',
    what: 'read a process.env var that is absent from .env.example',
    caughtBy: 'check:env',
    run: (dir) => {
      writeFileSync(
        join(dir, 'src/undeclared.ts'),
        'export const secret = import.meta.env.TOTALLY_UNDECLARED_VAR;\n'
      );
      const { code } = sh('npx tsx scripts/checks/env.ts', dir);
      return code !== 0;
    },
  },
  {
    id: 'S4',
    what: 'put a non-empty value in .env.example',
    caughtBy: 'check:env',
    run: (dir) => {
      const p = join(dir, '.env.example');
      const original = readFileSync(p, 'utf8');
      writeFileSync(p, original.replace('PUBLIC_MAPBOX_TOKEN=', 'PUBLIC_MAPBOX_TOKEN=pk.example'));
      const { code } = sh('npx tsx scripts/checks/env.ts', dir);
      return code !== 0;
    },
  },
```

- [ ] **Step 2: Run the suite to watch S3 and S4 FAIL**

```bash
npm run test:sabotage
```

Expected: S1 passes, S3 and S4 both show `✗` (the script does not exist, so `tsx` exits non-zero for the wrong reason — see Step 3's note), exit 1.

> **Note for the implementer:** a missing script also exits non-zero, which would make S3/S4 *look* caught for the wrong reason. Before trusting them, temporarily create an `env.ts` that does nothing and `process.exit(0)`, re-run, and confirm S3 and S4 now show `✗`. That proves the attacks detect the real defence rather than a missing file. Then continue to Step 3.

- [ ] **Step 3: Write `scripts/checks/env.ts`**

```ts
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
if (!existsSync('.env.example')) {
  errors.push('.env.example is missing.');
}
const declared = new Set<string>();
if (existsSync('.env.example')) {
  for (const [i, raw] of readFileSync('.env.example', 'utf8').split('\n').entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) {
      errors.push(`.env.example:${i + 1} is not KEY=  — got "${line}"`);
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    declared.add(key);
    if (value !== '') {
      errors.push(
        `.env.example:${i + 1} — ${key} has a value. Examples name variables, never contain values.`
      );
    }
  }
}

// 2 · Every env read must be declared.
const reads = new Map<string, string[]>();
for (const file of SCAN_DIRS.flatMap((d) => walk(d))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(ENV_READ)) {
    const name = m[1]!;
    // Astro/Vite built-ins are provided by the bundler, not by .env.
    if (['MODE', 'BASE_URL', 'PROD', 'DEV', 'SSR', 'SITE', 'ASSETS_PREFIX'].includes(name)) continue;
    if (!reads.has(name)) reads.set(name, []);
    reads.get(name)!.push(file);
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
  // Not a git repo — skip this check rather than fail.
}

if (errors.length) {
  console.error('✗ check:env failed:');
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}
console.log(`✓ check:env — ${declared.size} declared, ${reads.size} read, all reconciled.`);
```

- [ ] **Step 4: Add the script and verify it passes on the real tree**

Add to `package.json` `"scripts"`:

```json
"check:env": "tsx scripts/checks/env.ts"
```

```bash
npm run check:env
```

Expected: `✓ check:env — 2 declared, 0 read, all reconciled.`, exit 0.

- [ ] **Step 5: Run the sabotage suite to watch S3 and S4 PASS**

```bash
npm run test:sabotage
```

Expected: `✓ S1`, `✓ S3`, `✓ S4`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: check:env with env reconciliation, sabotage S3 + S4"
```

---

## Task 4: Data contract and `check:data`

**Files:**
- Create: `src/data/schema.ts`, `src/data/sample.json`, `scripts/checks/data.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `npm run check:data`. Exports from `src/data/schema.ts`: `FeatureSchema` (zod object), `FeatureCollectionSchema` (zod array), and `type Feature = z.infer<typeof FeatureSchema>`. Task 12's `loadData.ts` and Task 13's layer consume these exact names.

- [ ] **Step 1: Write `src/data/schema.ts` (zod 4)**

This is the *template's example* schema — a generic point feature. Forkers replace it. Singapore's `facility` schema is a Phase 0 decision for that project, not this repo's business.

```ts
import { z } from 'zod';

/**
 * THE CONTRACT. Frozen after Phase 0 of any project built on this template.
 * If the data demands a change, stop and renegotiate PLAN.md with the human.
 */
export const FeatureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  status: z.enum(['operational', 'construction', 'announced', 'halted']),
  value: z.number().nonnegative().optional(),
  source_url: z.url(),
});

export const FeatureCollectionSchema = z.array(FeatureSchema);

export type Feature = z.infer<typeof FeatureSchema>;
export type FeatureCollection = z.infer<typeof FeatureCollectionSchema>;
```

> **zod 4 note:** top-level `z.url()` replaces v3's `z.string().url()`. Using the v3 form will not type-check.

- [ ] **Step 2: Write `src/data/sample.json` — 10 hand-written records**

```json
[
  { "id": "sg-01", "name": "Jurong West Node",   "lat": 1.3496, "lng": 103.7061, "status": "operational",  "value": 42, "source_url": "https://example.org/sample/1" },
  { "id": "sg-02", "name": "Tuas Landing",       "lat": 1.2966, "lng": 103.6360, "status": "construction", "value": 30, "source_url": "https://example.org/sample/2" },
  { "id": "sg-03", "name": "Changi East Hall",   "lat": 1.3644, "lng": 103.9915, "status": "announced",    "value": 18, "source_url": "https://example.org/sample/3" },
  { "id": "sg-04", "name": "Woodlands Exchange", "lat": 1.4382, "lng": 103.7890, "status": "operational",  "value": 55, "source_url": "https://example.org/sample/4" },
  { "id": "sg-05", "name": "Paya Lebar Annex",   "lat": 1.3187, "lng": 103.8931, "status": "halted",                  "source_url": "https://example.org/sample/5" },
  { "id": "sg-06", "name": "Kallang Basin Site", "lat": 1.3080, "lng": 103.8710, "status": "construction", "value": 24, "source_url": "https://example.org/sample/6" },
  { "id": "sg-07", "name": "Loyang Works",       "lat": 1.3691, "lng": 103.9640, "status": "operational",  "value": 12, "source_url": "https://example.org/sample/7" },
  { "id": "sg-08", "name": "Sembawang Point",    "lat": 1.4491, "lng": 103.8185, "status": "announced",    "value": 60, "source_url": "https://example.org/sample/8" },
  { "id": "sg-09", "name": "Bukit Batok Vault",  "lat": 1.3490, "lng": 103.7495, "status": "operational",  "value": 33, "source_url": "https://example.org/sample/9" },
  { "id": "sg-10", "name": "Seletar Yard",       "lat": 1.4050, "lng": 103.8730, "status": "construction", "value": 27, "source_url": "https://example.org/sample/10" }
]
```

- [ ] **Step 3: Write `scripts/checks/data.ts`**

```ts
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
  console.log(
    `    status  ${Object.entries(byStatus).map(([k, v]) => `${k}=${v}`).join('  ')}`
  );
}

process.exit(failed ? 1 : 0);
```

- [ ] **Step 4: Add the script and run it**

Add to `package.json` `"scripts"`:

```json
"check:data": "tsx scripts/checks/data.ts"
```

```bash
npm run check:data
```

Expected: `✓ sample.json — 10 records`, bounds inside Singapore (lat ~1.29–1.45, lng ~103.63–103.99), status counts summing to 10, exit 0.

- [ ] **Step 5: Prove the check actually rejects bad data**

```bash
node -e "const f='src/data/sample.json';const d=JSON.parse(require('fs').readFileSync(f));d[0].lat=999;require('fs').writeFileSync(f,JSON.stringify(d,null,2))"
npm run check:data          # expect: ✗ with [0.lat] issue, exit 1
git checkout src/data/sample.json
npm run check:data          # expect: ✓, exit 0
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: frozen data contract (zod 4) + sample records + check:data"
```

---

## Task 5: `check:tokens`

**Files:**
- Create: `scripts/checks/tokens.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: `npm run check:tokens`. Fails on any colour literal under `src/` outside `src/theme/`, and on any CSS-framework utility or import inside `src/components/kit/`.

- [ ] **Step 1: Write `scripts/checks/tokens.ts`**

```ts
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

// Tailwind/Bootstrap-style utilities and any framework import.
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
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  const inTheme = rel.startsWith(THEME + sep);
  const inKit = rel.startsWith(KIT + sep);

  lines.forEach((line, i) => {
    // Skip comment lines — documenting a colour is allowed.
    const trimmed = line.trim();
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
```

- [ ] **Step 2: Add the script and run it**

Add to `package.json` `"scripts"`:

```json
"check:tokens": "tsx scripts/checks/tokens.ts"
```

```bash
npm run check:tokens
```

Expected: `✓ check:tokens …`, exit 0 (nothing but `index.astro` exists yet).

- [ ] **Step 3: Prove both rules actually bite**

```bash
mkdir -p src/components/kit
printf 'export const C = () => <div style={{color:"#ff0000"}} />;\n' > src/components/kit/Bad.tsx
npm run check:tokens        # expect: ✗ hex literal "#ff0000", exit 1

printf 'export const C = () => <div className="flex gap-2" />;\n' > src/components/kit/Bad.tsx
npm run check:tokens        # expect: ✗ utility class, exit 1

rm src/components/kit/Bad.tsx
npm run check:tokens        # expect: ✓, exit 0
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: check:tokens — colour-literal and framework-leak enforcement"
```

---

## Task 6: `check:dist` (sabotage S2)

**Files:**
- Create: `scripts/checks/dist.ts`
- Modify: `package.json`, `scripts/checks/sabotage.ts`

**Interfaces:**
- Consumes: Task 1's `build`, Task 2's `ATTACKS` array
- Produces: `npm run check:dist`. Fails on any `sk.ey…` match or high-entropy string in `dist/`. A `pk.` token in the bundle is expected and must NOT fail.

- [ ] **Step 1: Add attack S2 to `ATTACKS` in `scripts/checks/sabotage.ts`**

Insert after the S1 object:

```ts
  {
    id: 'S2',
    what: 'reference a fake sk. token in code so the bundler inlines it into dist/',
    caughtBy: 'check:dist',
    run: (dir) => {
      // Write the token into .env (gitignored, so no hook fires) and read it from src.
      writeFileSync(join(dir, '.env'), `MAPBOX_SECRET_TOKEN=${FAKE_SK}\n`);
      writeFileSync(
        join(dir, 'src/pages/leak.astro'),
        '---\nconst t = import.meta.env.MAPBOX_SECRET_TOKEN;\n---\n<p>{t}</p>\n'
      );
      sh('npm run build', dir);
      const { code } = sh('npx tsx scripts/checks/dist.ts', dir);
      return code !== 0;
    },
  },
```

> The sandbox worktree has no `node_modules`. Before this attack can build, symlink the real one: add `sh('ln -s "' + repo + '/node_modules" node_modules', dir)` inside `main()` immediately after `npx lefthook install`. Do this now — S2 cannot pass without it.

- [ ] **Step 2: Run the suite to watch S2 FAIL**

```bash
npm run test:sabotage
```

Expected: S2 shows `✗` (no `dist.ts` yet — apply the same temporary-stub proof used in Task 3 Step 2 to confirm the attack detects the real defence rather than a missing file), exit 1.

- [ ] **Step 3: Write `scripts/checks/dist.ts`**

```ts
#!/usr/bin/env tsx
/**
 * check:dist — the one everyone misses.
 * Bundlers inline env vars, so a carelessly-referenced secret ships to the
 * world inside your JS. A pk. token here is EXPECTED and fine: it is public
 * by design and URL-restricted, therefore inert anywhere else.
 * An sk. match is instant, loud failure.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';

const DIST = 'dist';
const SCAN_EXT = new Set(['.js', '.mjs', '.cjs', '.html', '.json', '.css', '.map']);

const SK = /sk\.ey[A-Za-z0-9._-]{20,}/g;
// Long base64/hex runs that are not obviously a public token.
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
```

- [ ] **Step 4: Add the script and verify on the real tree**

Add to `package.json` `"scripts"`:

```json
"check:dist": "npm run build && tsx scripts/checks/dist.ts"
```

```bash
npm run check:dist
```

Expected: `✓ check:dist — no secret tokens in the bundle.`, exit 0.

- [ ] **Step 5: Run the sabotage suite — all four must now pass**

```bash
npm run test:sabotage
```

Expected: `✓ S1`, `✓ S2`, `✓ S3`, `✓ S4`, `✓ all 4 sabotage attack(s) caught.`, exit 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: check:dist bundle scan, sabotage S2 — all four attacks caught"
```

---

## Task 7: The `ci` gate and GitHub Action

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Consumes: every check from Tasks 2–6
- Produces: `npm run ci`, `npm run check:ship`, `npm run predeploy`. All later tasks must leave `npm run ci` green.

- [ ] **Step 1: Add the aggregate scripts to `package.json`**

```json
"ci": "npm run typecheck && npm run check:tokens && npm run check:data && npm run check:env && npm run check:secrets && npm run check:dist",
"check:ship": "npm run ci",
"predeploy": "npm run ci",
"deploy": "wrangler deploy"
```

- [ ] **Step 2: Run the whole gate**

```bash
npm run ci
```

Expected: six sections, all `✓`, exit 0. It must complete with no network beyond npm and no Mapbox token present — temporarily `mv .env .env.bak && npm run ci && mv .env.bak .env` to prove it.

- [ ] **Step 3: Write `.github/workflows/ci.yml`**

```yaml
name: ci
on: [push, pull_request]

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with: { fetch-depth: 0 }
      - uses: actions/setup-node@v5
        with: { node-version-file: '.nvmrc', cache: 'npm' }
      - uses: gitleaks/gitleaks-action@v2
      - run: npm ci
      - run: npm run ci
```

`fetch-depth: 0` gives gitleaks full history. The Action exists only to catch `--no-verify` and forks with hooks disabled — it runs the same `npm run ci` as your laptop, one gate, one source of truth.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: ci gate — six checks, one command, mirrored in GitHub Actions"
```

---

## Task 8: The theme — three files

**Files:**
- Create: `src/theme/tokens.css`, `src/theme/recipes.css`, `src/theme/map-style.ts`, `docs/THEME.md`

**Interfaces:**
- Consumes: nothing
- Produces: every custom property named below. Tasks 9–14 reference these exact names. `map-style.ts` exports `BASEMAP_STYLE: string`, `statusColours(): Record<Feature['status'], string>`, and `halo(): { width: number; colour: string }` — **functions, not constants**, because they read the CSS custom properties at runtime so `tokens.css` stays the only source of colour.

- [ ] **Step 1: Write `src/theme/tokens.css` — verbatim values from the spec**

```css
:root {
  /* ink — monochrome UI, no accent in chrome. The map carries all colour. */
  --ink: #F5F2EE;
  --ink-dim: #9A9A96;
  --ink-max: #FFFFFF;

  /* liquid glass surfaces */
  --glass: rgba(12, 12, 12, 0.72);
  --glass-strong: rgba(12, 12, 12, 0.86);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-blur: 16px;
  --glass-shadow: 0 4px 24px rgba(0, 0, 0, 0.35);
  --hairline: rgba(255, 255, 255, 0.12);

  /* type */
  --font-mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;
  --font-ui: "Inter", system-ui, sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.75rem;

  /* space + shape */
  --s1: 4px; --s2: 8px; --s3: 12px; --s4: 16px; --s6: 24px; --s8: 32px;
  --radius-panel: 14px;
  --radius-chip: 8px;
  --radius-stamp: 2px;

  /* motion */
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --t-fast: 140ms;
  --t-med: 240ms;

  /* data status accents — the ONLY colour a project chooses */
  --status-operational: #1F7A4D;
  --status-construction: #D89A2B;
  --status-announced: #5A6B7C;
  --status-halted: #B23B3B;
}
```

- [ ] **Step 2: Write `src/theme/recipes.css`**

```css
/* The one panel recipe. Every floating element uses it. */
.glass {
  background: var(--glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-panel);
  box-shadow: var(--glass-shadow);
  color: var(--ink);
  font-family: var(--font-ui);
}

.glass-strong { background: var(--glass-strong); }

/* Loading skeleton with a moving sheen — never a spinner. */
.shimmer {
  position: relative;
  overflow: hidden;
  background: var(--glass);
  border-radius: var(--radius-chip);
}
.shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, var(--glass-border), transparent);
  animation: shimmer-sweep 1.4s infinite;
}
@keyframes shimmer-sweep { 100% { transform: translateX(100%); } }

.chip {
  font-family: var(--font-ui);
  font-size: var(--text-xs);
  color: var(--ink-dim);
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-chip);
  padding: var(--s1) var(--s3);
  cursor: pointer;
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
}
.chip:hover { color: var(--ink); }
.chip[data-active="true"] { color: var(--ink-max); background: var(--glass-strong); }
.chip:focus-visible { outline: 1px solid var(--ink-dim); outline-offset: 2px; }

.stamp {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--ink-dim);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-stamp);
  padding: var(--s1) var(--s2);
}

.panel-title { font-size: var(--text-lg); color: var(--ink-max); margin: 0; }
.panel-sub { font-size: var(--text-sm); color: var(--ink-dim); margin: 0; }
.mono { font-family: var(--font-mono); }

@media (prefers-reduced-motion: reduce) {
  .shimmer::after { animation: none; }
  * { transition-duration: 1ms !important; }
}
```

- [ ] **Step 3: Write `src/theme/map-style.ts`**

Colour values are read from the CSS custom properties at runtime so `tokens.css` stays the single source of truth and no literal appears here.

```ts
import type { Feature } from '../data/schema.js';

export const BASEMAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

/** Read a custom property off :root. Falls back to transparent if absent. */
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
```

- [ ] **Step 4: Write `docs/THEME.md`**

```markdown
# THEME — the contract

The entire visual identity is `src/theme/`, and nothing outside it holds a visual value.
Re-theming a project is replacing these three files. No component changes, ever.

| File | What it controls |
|---|---|
| `tokens.css` | Every custom property: ink, glass, hairline, type, space, radius, motion, status accents. |
| `recipes.css` | `.glass`, `.glass-strong`, `.shimmer`, `.chip`, `.stamp`, `.panel-title`, `.panel-sub`, `.mono`. |
| `map-style.ts` | Basemap style URL, `statusColours()`, `halo()`. |

## The rules

1. **Chrome is monochrome.** Hierarchy comes from brightness (`--ink-dim` → `--ink` → `--ink-max`), never hue.
2. **The map is the only thing carrying colour.** The `--status-*` tokens are the sole colour decision a project makes, and they exist for data, not chrome.
3. **Components hold zero visual opinions.** They reference `var(--token)` and the recipe classes. `npm run check:tokens` fails the build on any colour literal outside this folder.
4. **Motion is inherited.** `--t-fast` for hovers, `--t-med` for fades, `--ease` for everything. Shimmer over spinners.

## Writing a new theme

Supply the same three filenames with the same token names. Every component follows automatically.
```

- [ ] **Step 5: Verify the theme does not break the gate**

```bash
npm run check:tokens   # expect ✓ — literals live in src/theme/, which is exempt
npm run ci             # expect ✓ across all six
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: theme contract — tokens, recipes, map-style, THEME.md"
```

---

## Task 9: Live map — `lib/mapbox.ts`, `MapRoot`, and the page

**Files:**
- Create: `src/lib/mapbox.ts`, `src/components/map/MapRoot.tsx`, `src/components/map/MapRoot.css`, `src/layouts/Base.astro`
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: `BASEMAP_STYLE` from Task 8
- Produces: `getMapboxToken(): string` from `lib/mapbox.ts`; `<MapRoot>` React component accepting `{ children?: React.ReactNode }` and rendering a full-bleed map. Tasks 11–14 mount kit components as `children` of `MapRoot`.

- [ ] **Step 1: Write `src/lib/mapbox.ts`**

```ts
/**
 * Token access. Reads from env only — a literal token string anywhere in this
 * repo is task failure even if the code works. See docs/SECRETS.md.
 */
export function getMapboxToken(): string {
  const token = import.meta.env.PUBLIC_MAPBOX_TOKEN;
  if (!token) {
    throw new Error(
      'PUBLIC_MAPBOX_TOKEN is not set. Copy .env.example to .env and add your ' +
        'URL-restricted pk. token. See docs/SECRETS.md.'
    );
  }
  return token;
}
```

- [ ] **Step 2: Write `src/components/map/MapRoot.css`**

```css
.map-root { position: fixed; inset: 0; }
.map-root__canvas { position: absolute; inset: 0; }
.map-root__chrome { position: absolute; inset: 0; pointer-events: none; }
.map-root__chrome > * { pointer-events: auto; }

.map-root__error {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  padding: var(--s8);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink-dim);
  background: var(--glass-strong);
  text-align: center;
}
```

- [ ] **Step 3: Write `src/components/map/MapRoot.tsx`**

```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapboxToken } from '../../lib/mapbox.js';
import { BASEMAP_STYLE } from '../../theme/map-style.js';
import './MapRoot.css';

export type MapRootProps = {
  center?: [number, number];
  zoom?: number;
  children?: ReactNode;
  onReady?: (map: mapboxgl.Map) => void;
};

export function MapRoot({
  center = [103.82, 1.35],
  zoom = 10.5,
  children,
  onReady,
}: MapRootProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    try {
      mapboxgl.accessToken = getMapboxToken();
      map.current = new mapboxgl.Map({
        container: container.current,
        style: BASEMAP_STYLE,
        center,
        zoom,
        attributionControl: true,
      });
      map.current.on('load', () => {
        document.documentElement.dataset.mapReady = 'true';
        if (map.current && onReady) onReady(map.current);
      });
      map.current.on('error', (e) => setError(e.error?.message ?? 'Map failed to load.'));
    } catch (err) {
      setError((err as Error).message);
    }

    const onResize = () => map.current?.resize();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className="map-root" data-testid="map-root">
      <div ref={container} className="map-root__canvas" data-testid="map-canvas" />
      {error && (
        <div className="map-root__error" data-testid="map-error" role="alert">
          {error}
        </div>
      )}
      <div className="map-root__chrome">{children}</div>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/layouts/Base.astro`**

```astro
---
import '../theme/tokens.css';
import '../theme/recipes.css';

interface Props { title: string; description?: string; }
const { title, description = 'A basic Astro + Mapbox map.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="preconnect" href="https://api.mapbox.com" />
  </head>
  <body>
    <slot />
    <style is:global>
      html, body { margin: 0; height: 100%; background: var(--glass-strong); }
      body { font-family: var(--font-ui); color: var(--ink); }
    </style>
  </body>
</html>
```

- [ ] **Step 5: Rewrite `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { MapRoot } from '../components/map/MapRoot.tsx';
---
<Base title="astro-mapbox-basic">
  <MapRoot client:load />
</Base>
```

- [ ] **Step 6: Run it and see the map**

```bash
npm run dev
```

Open `http://localhost:4321`. Expected: a full-bleed Mapbox Outdoors map centred on Singapore, terrain and relief visible, Mapbox attribution bottom-right.

If tiles 403: the token is URL-restricted without `http://localhost:4321` in its allowed URLs. Add the port — restrictions default to ports 80 and 443 only.

- [ ] **Step 7: Verify the gate is still green**

```bash
npm run ci
```

Expected: all six `✓`. `check:dist` should print the `pk.` note — that is correct and expected, not a failure.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: live Mapbox Outdoors map via MapRoot + base layout"
```

---

## Task 10: Playwright harness

**Files:**
- Create: `playwright.config.ts`, `tests/hello-map.spec.ts`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- Consumes: Task 9's `data-testid="map-root"`, `map-canvas`, and the `data-map-ready` attribute set on `<html>` when the style loads
- Produces: `npm run test:visual`. Tasks 11–14 append assertions to `tests/hello-map.spec.ts`.

- [ ] **Step 1: Install Playwright and ignore its artefacts**

```bash
npm i -D @playwright/test
npx playwright install chromium
printf 'test-results/\nplaywright-report/\n' >> .gitignore
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:4321',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
```

- [ ] **Step 3: Write the failing test**

`tests/hello-map.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('hello-map', () => {
  test('map loads with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');

    await expect(page.getByTestId('map-root')).toBeVisible();
    await expect(page.getByTestId('map-error')).toHaveCount(0);

    // MapRoot sets this on <html> when the style finishes loading.
    await expect(page.locator('html')).toHaveAttribute('data-map-ready', 'true');

    const canvas = page.locator('.mapboxgl-canvas');
    await expect(canvas).toBeVisible();

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('map fills the viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-map-ready', 'true');
    const box = await page.getByTestId('map-root').boundingBox();
    const vp = page.viewportSize()!;
    expect(box!.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(box!.height).toBeGreaterThanOrEqual(vp.height - 1);
  });
});
```

- [ ] **Step 4: Add the script and run it**

Add to `package.json` `"scripts"`:

```json
"test:visual": "playwright test"
```

```bash
npm run test:visual
```

Expected: 4 passed (2 tests × 2 projects). If `data-map-ready` never appears, the map style is not loading — check the token restrictions before touching the test.

- [ ] **Step 5: Capture a reference screenshot for the human**

```bash
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=4000 \
  http://localhost:4321 docs/hello-map.png
```

Show `docs/hello-map.png` to the human. This is the anti-slop claim being true or not — get eyes on it before building ten components on top.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: Playwright harness — map render, viewport, console-clean"
```

---

## Task 11: Kit primitives — `Chip`, `StampMark`, `HintToast`

**Files:**
- Create: `src/components/kit/Chip.tsx`, `Chip.css`, `StampMark.tsx`, `StampMark.css`, `HintToast.tsx`, `HintToast.css`
- Modify: `src/pages/index.astro`, `tests/hello-map.spec.ts`

**Interfaces:**
- Consumes: recipe classes `.chip`, `.stamp`, `.glass` from Task 8
- Produces: `<Chip label active onClick>`, `<StampMark lat lng label variant>`, `<HintToast text showOnce>`. Task 13's `TimePanel` consumes `Chip`.

- [ ] **Step 1: Write the failing assertions**

Append to the `hello-map` describe block in `tests/hello-map.spec.ts`:

```ts
  test('primitives render', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('chip')).toHaveCount(2);
    await expect(page.getByTestId('stamp')).toBeVisible();
    await expect(page.getByTestId('hint-toast')).toBeVisible();
  });

  test('hint toast dismisses on first interaction', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('hint-toast')).toBeVisible();
    await page.getByTestId('map-canvas').click({ position: { x: 50, y: 50 } });
    await expect(page.getByTestId('hint-toast')).toHaveCount(0);
  });
```

Run `npm run test:visual` — expect these to FAIL with "expected 2, received 0".

- [ ] **Step 2: Write `Chip.tsx` and `Chip.css`**

```tsx
import './Chip.css';

export type ChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export function Chip({ label, active = false, onClick }: ChipProps) {
  return (
    <button
      type="button"
      className="chip kit-chip"
      data-active={active}
      data-testid="chip"
      aria-pressed={active}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
```

```css
.kit-chip { line-height: 1; white-space: nowrap; }
.kit-chip:active { transform: translateY(1px); }
```

- [ ] **Step 3: Write `StampMark.tsx` and `StampMark.css`**

```tsx
import './StampMark.css';

export type StampMarkProps = {
  lat: number;
  lng: number;
  label?: string;
  variant?: 'default' | 'compact';
};

/** The terminal soul survives inside the glass world. */
export function StampMark({ lat, lng, label, variant = 'default' }: StampMarkProps) {
  const coords = `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
  return (
    <div className="stamp kit-stamp" data-variant={variant} data-testid="stamp">
      {label && variant === 'default' && <span className="kit-stamp__label">{label}</span>}
      <span className="kit-stamp__coords">{coords}</span>
    </div>
  );
}
```

```css
.kit-stamp { display: inline-flex; gap: var(--s2); align-items: baseline; }
.kit-stamp__label { color: var(--ink); text-transform: uppercase; letter-spacing: 0.06em; }
.kit-stamp__coords { color: var(--ink-dim); }
.kit-stamp[data-variant="compact"] { padding: 0; border: none; }
```

- [ ] **Step 4: Write `HintToast.tsx` and `HintToast.css`**

```tsx
import { useEffect, useState } from 'react';
import './HintToast.css';

export type HintToastProps = {
  text: string;
  showOnce?: boolean;
};

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
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'wheel'];
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
```

```css
.kit-hint {
  position: absolute;
  left: 50%;
  bottom: var(--s8);
  transform: translateX(-50%);
  padding: var(--s2) var(--s4);
  font-size: var(--text-sm);
  border-radius: var(--radius-chip);
  opacity: 1;
  transition: opacity var(--t-med) var(--ease), transform var(--t-med) var(--ease);
}
.kit-hint[data-leaving="true"] { opacity: 0; transform: translateX(-50%) translateY(var(--s2)); }
```

- [ ] **Step 5: Mount them in `src/pages/index.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { MapRoot } from '../components/map/MapRoot.tsx';
import { Chip } from '../components/kit/Chip.tsx';
import { StampMark } from '../components/kit/StampMark.tsx';
import { HintToast } from '../components/kit/HintToast.tsx';
---
<Base title="astro-mapbox-basic">
  <MapRoot client:load>
    <div style="position:absolute; top:var(--s4); left:50%; transform:translateX(-50%); display:flex; gap:var(--s2);">
      <Chip label="All" active client:load />
      <Chip label="Operational" client:load />
    </div>
    <div style="position:absolute; bottom:var(--s4); left:var(--s4);">
      <StampMark lat={1.3521} lng={103.8198} label="Singapore" client:load />
    </div>
    <HintToast text="Click a marker to inspect it" client:load />
  </MapRoot>
</Base>
```

- [ ] **Step 6: Run tests and the gate**

```bash
npm run test:visual   # expect: all primitives tests PASS
npm run ci            # expect: six ✓ — inline styles use var() only, no literals
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: kit primitives — Chip, StampMark, HintToast"
```

---

## Task 12: Kit panels — `HeadlineBlock`, `CounterStrip`, `ControlStack`

**Files:**
- Create: `HeadlineBlock.tsx/.css`, `CounterStrip.tsx/.css`, `ControlStack.tsx/.css` under `src/components/kit/`
- Modify: `src/pages/index.astro`, `tests/hello-map.spec.ts`

**Interfaces:**
- Consumes: `.glass`, `.panel-title`, `.panel-sub`, `.mono` from Task 8
- Produces: `<HeadlineBlock title subline live>{children}</HeadlineBlock>`, `<CounterStrip primary secondary methodHref>`, `<ControlStack>{children}</ControlStack>`, and `<ControlButton label onClick>{children}</ControlButton>` from the same file as ControlStack

- [ ] **Step 1: Write the failing assertions**

Append to `tests/hello-map.spec.ts`:

```ts
  test('panels sit in their grammar positions', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'mobile docks panels to a bottom sheet');
    await page.goto('/');
    const vp = page.viewportSize()!;

    const headline = await page.getByTestId('headline-block').boundingBox();
    expect(headline!.x).toBeLessThan(vp.width / 2);
    expect(headline!.y).toBeLessThan(vp.height / 2);

    const controls = await page.getByTestId('control-stack').boundingBox();
    expect(controls!.x).toBeGreaterThan(vp.width / 2);
    expect(controls!.y).toBeLessThan(vp.height / 2);

    await expect(page.getByTestId('counter-primary')).toBeVisible();
  });
```

Run `npm run test:visual` — expect FAIL.

- [ ] **Step 2: Write `HeadlineBlock.tsx` and `HeadlineBlock.css`**

```tsx
import { useEffect, useState, type ReactNode } from 'react';
import './HeadlineBlock.css';

export type HeadlineBlockProps = {
  title: string;
  subline?: string;
  live?: boolean;
  children?: ReactNode;
};

export function HeadlineBlock({ title, subline, live = false, children }: HeadlineBlockProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    if (!live) return;
    const tick = () => setClock(new Date().toISOString().slice(11, 19) + 'Z');
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [live]);

  return (
    <div className="glass kit-headline" data-testid="headline-block">
      <div className="kit-headline__row">
        <h1 className="panel-title">{title}</h1>
        {live && (
          <span className="kit-headline__live mono" data-testid="live-badge">
            <span className="kit-headline__dot" aria-hidden="true" />
            {clock}
          </span>
        )}
      </div>
      {subline && <p className="panel-sub">{subline}</p>}
      {children}
    </div>
  );
}
```

```css
.kit-headline {
  position: absolute;
  top: var(--s4);
  left: var(--s4);
  padding: var(--s4);
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  gap: var(--s2);
}
.kit-headline__row { display: flex; align-items: center; gap: var(--s3); justify-content: space-between; }
.kit-headline__live { display: inline-flex; align-items: center; gap: var(--s2); font-size: var(--text-xs); color: var(--ink-dim); }
.kit-headline__dot {
  width: var(--s2); height: var(--s2); border-radius: 50%;
  background: var(--ink-max); animation: kit-pulse 2s var(--ease) infinite;
}
@keyframes kit-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }
@media (max-width: 640px) { .kit-headline { left: var(--s2); right: var(--s2); max-width: none; } }
@media (prefers-reduced-motion: reduce) { .kit-headline__dot { animation: none; } }
```

- [ ] **Step 3: Write `CounterStrip.tsx` and `CounterStrip.css`**

```tsx
import { useEffect, useRef, useState } from 'react';
import './CounterStrip.css';

export type Stat = { label: string; value: number | string };
export type CounterStripProps = {
  primary: Stat;
  secondary?: Stat[];
  methodHref?: string;
};

/** Count-up on change, capped at 400ms. Numbers feel alive; they never blink. */
function useCountUp(target: number | string): string {
  const [shown, setShown] = useState(target);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (typeof target !== 'number' || typeof shown !== 'number') { setShown(target); return; }
    const from = shown;
    const delta = target - from;
    if (delta === 0) return;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min((now - start) / 400, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + delta * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return typeof shown === 'number' ? shown.toLocaleString() : String(shown);
}

export function CounterStrip({ primary, secondary = [], methodHref }: CounterStripProps) {
  const value = useCountUp(primary.value);
  return (
    <div className="kit-counter" data-testid="counter-strip">
      <div className="kit-counter__primary">
        <span className="kit-counter__value mono" data-testid="counter-primary">{value}</span>
        <span className="kit-counter__label">{primary.label}</span>
      </div>
      {secondary.length > 0 && (
        <div className="kit-counter__secondary">
          {secondary.map((s) => (
            <span key={s.label} className="kit-counter__pair">
              <span className="mono">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</span>
              <span className="kit-counter__label">{s.label}</span>
            </span>
          ))}
        </div>
      )}
      {methodHref && (
        <a className="kit-counter__method" href={methodHref}>(how we estimate)</a>
      )}
    </div>
  );
}
```

```css
.kit-counter { display: flex; flex-direction: column; gap: var(--s2); }
.kit-counter__primary { display: flex; align-items: baseline; gap: var(--s2); }
.kit-counter__value { font-size: var(--text-xl); color: var(--ink-max); }
.kit-counter__label { font-size: var(--text-xs); color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; }
.kit-counter__secondary { display: flex; gap: var(--s4); flex-wrap: wrap; }
.kit-counter__pair { display: inline-flex; gap: var(--s1); align-items: baseline; color: var(--ink); font-size: var(--text-sm); }
.kit-counter__method { font-size: var(--text-xs); color: var(--ink-dim); text-decoration: underline; transition: color var(--t-fast) var(--ease); }
.kit-counter__method:hover { color: var(--ink); }
```

- [ ] **Step 4: Write `ControlStack.tsx` and `ControlStack.css`**

```tsx
import type { ReactNode } from 'react';
import './ControlStack.css';

export type ControlStackProps = { children: ReactNode };

export function ControlStack({ children }: ControlStackProps) {
  return (
    <div className="kit-controls" data-testid="control-stack">
      {children}
    </div>
  );
}

export type ControlButtonProps = { label: string; onClick?: () => void; children: ReactNode };

export function ControlButton({ label, onClick, children }: ControlButtonProps) {
  return (
    <button type="button" className="glass kit-controls__btn" aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}
```

```css
.kit-controls { position: absolute; top: var(--s4); right: var(--s4); display: flex; flex-direction: column; gap: var(--s2); }
.kit-controls__btn {
  width: var(--s8); height: var(--s8);
  display: grid; place-items: center;
  border-radius: var(--radius-chip);
  color: var(--ink-dim); cursor: pointer;
  font-family: var(--font-mono); font-size: var(--text-base);
  transition: color var(--t-fast) var(--ease), background var(--t-fast) var(--ease);
}
.kit-controls__btn:hover { color: var(--ink-max); background: var(--glass-strong); }
.kit-controls__btn:focus-visible { outline: 1px solid var(--ink-dim); outline-offset: 2px; }
```

- [ ] **Step 5: Mount them in `src/pages/index.astro`**

Replace the `<MapRoot>` children with the following. **Keep the Chip row** — Task 11's assertion counts two chips, and dropping them here would break a passing test two tasks later:

```astro
  <MapRoot client:load>
    <HeadlineBlock title="astro-mapbox-basic" subline="A basic Astro + Mapbox boilerplate" live client:load>
      <CounterStrip primary={{ label: 'sample records', value: 10 }} secondary={[{ label: 'operational', value: 4 }]} client:load />
    </HeadlineBlock>
    <ControlStack client:load>
      <ControlButton label="Zoom in">+</ControlButton>
      <ControlButton label="Zoom out">−</ControlButton>
    </ControlStack>
    <div style="position:absolute; top:var(--s4); left:50%; transform:translateX(-50%); display:flex; gap:var(--s2);">
      <Chip label="All" active client:load />
      <Chip label="Operational" client:load />
    </div>
    <div style="position:absolute; bottom:var(--s4); left:var(--s4);">
      <StampMark lat={1.3521} lng={103.8198} label="Singapore" client:load />
    </div>
    <HintToast text="Click a marker to inspect it" client:load />
  </MapRoot>
```

Add the matching imports at the top of the frontmatter.

- [ ] **Step 6: Run tests and the gate**

```bash
npm run test:visual   # expect: panel-position tests PASS
npm run ci            # expect: six ✓
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: kit panels — HeadlineBlock, CounterStrip, ControlStack"
```

---

## Task 13: `LegendCanvas` and `TimePanel`

**Files:**
- Create: `LegendCanvas.tsx/.css`, `TimePanel.tsx/.css` under `src/components/kit/`
- Modify: `src/pages/index.astro`, `tests/hello-map.spec.ts`

**Interfaces:**
- Consumes: `Chip` from Task 11, `statusColours()` from Task 8
- Produces: `<LegendCanvas mode items|stops title>`, `<TimePanel range value interval onChange playable>`

- [ ] **Step 1: Write the failing assertions**

```ts
  test('legend is bottom-right and always visible', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'mobile docks panels');
    await page.goto('/');
    const vp = page.viewportSize()!;
    const box = await page.getByTestId('legend').boundingBox();
    expect(box!.x + box!.width).toBeGreaterThan(vp.width / 2);
    expect(box!.y).toBeGreaterThan(vp.height / 2);
    await expect(page.getByTestId('legend-item')).toHaveCount(4);
  });

  test('time panel scrubs and plays', async ({ page }) => {
    await page.goto('/');
    const slider = page.getByTestId('time-slider');
    await expect(slider).toBeVisible();
    await expect(page.getByTestId('time-value')).toHaveText('2014');
    await slider.fill('2020');
    await expect(page.getByTestId('time-value')).toHaveText('2020');
    await page.getByTestId('time-play').click();
    await expect(page.getByTestId('time-play')).toHaveAttribute('data-playing', 'true');
  });
```

Run `npm run test:visual` — expect FAIL.

- [ ] **Step 2: Write `LegendCanvas.tsx` and `LegendCanvas.css`**

```tsx
import './LegendCanvas.css';

export type LegendItem = { label: string; colour: string };
export type LegendStop = { label: string; colour: string };

export type LegendCanvasProps =
  | { mode: 'swatches'; title: string; items: LegendItem[]; stops?: never }
  | { mode: 'gradient'; title: string; stops: LegendStop[]; items?: never };

/** Always visible, never a menu. */
export function LegendCanvas(props: LegendCanvasProps) {
  const { mode, title } = props;
  return (
    <div className="glass kit-legend" data-testid="legend">
      <p className="kit-legend__title">{title}</p>
      {mode === 'swatches' ? (
        <ul className="kit-legend__list">
          {props.items.map((it) => (
            <li key={it.label} className="kit-legend__item" data-testid="legend-item">
              <span className="kit-legend__swatch" style={{ background: it.colour }} aria-hidden="true" />
              <span>{it.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="kit-legend__gradient">
          <div
            className="kit-legend__ramp"
            style={{ backgroundImage: `linear-gradient(90deg, ${props.stops.map((s) => s.colour).join(', ')})` }}
            aria-hidden="true"
          />
          <div className="kit-legend__ticks">
            {props.stops.map((s) => (
              <span key={s.label} className="mono" data-testid="legend-item">{s.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

```css
.kit-legend { position: absolute; bottom: var(--s4); right: var(--s4); padding: var(--s3) var(--s4); min-width: 11rem; }
.kit-legend__title { margin: 0 0 var(--s2); font-size: var(--text-xs); color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; }
.kit-legend__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--s1); }
.kit-legend__item { display: flex; align-items: center; gap: var(--s2); font-size: var(--text-sm); color: var(--ink); }
.kit-legend__swatch { width: var(--s3); height: var(--s3); border-radius: var(--radius-stamp); border: 1px solid var(--glass-border); }
.kit-legend__ramp { height: var(--s2); border-radius: var(--radius-stamp); }
.kit-legend__ticks { display: flex; justify-content: space-between; margin-top: var(--s1); font-size: var(--text-xs); color: var(--ink-dim); }
@media (max-width: 640px) { .kit-legend { left: var(--s2); right: var(--s2); bottom: var(--s2); } }
```

> The `style={{ background: it.colour }}` is a *variable*, not a literal — `check:tokens` only rejects literal colour values, and the caller sources colours from `statusColours()`.

- [ ] **Step 3: Write `TimePanel.tsx` and `TimePanel.css`**

```tsx
import { useEffect, useRef } from 'react';
import { Chip } from './Chip.js';
import './TimePanel.css';

export type TimePanelProps = {
  range: [number, number];
  value: number;
  interval?: string;
  onChange: (value: number) => void;
  playable?: boolean;
  playing?: boolean;
  onPlayToggle?: () => void;
};

/** THE Electricity-Maps scrubber. Hero-mechanic host for temporal maps. */
export function TimePanel({
  range,
  value,
  interval,
  onChange,
  playable = false,
  playing = false,
  onPlayToggle,
}: TimePanelProps) {
  const [min, max] = range;
  const timer = useRef<number>(0);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      onChange(value >= max ? min : value + 1);
    }, 700);
    return () => window.clearInterval(timer.current);
  }, [playing, value, min, max, onChange]);

  const ticks = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="glass kit-time" data-testid="time-panel">
      <div className="kit-time__head">
        <span className="kit-time__value mono" data-testid="time-value">{value}</span>
        {interval && <Chip label={interval} active />}
      </div>
      <div className="kit-time__controls">
        {playable && (
          <button
            type="button"
            className="kit-time__play"
            data-playing={playing}
            data-testid="time-play"
            aria-label={playing ? 'Pause' : 'Play'}
            onClick={onPlayToggle}
          >
            {playing ? '❚❚' : '▶'}
          </button>
        )}
        <div className="kit-time__track">
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            data-testid="time-slider"
            aria-label="Time"
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <div className="kit-time__ticks" aria-hidden="true">
            {ticks.map((t) => <span key={t} className="kit-time__tick" data-on={t <= value} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
```

```css
.kit-time { position: absolute; bottom: var(--s4); left: var(--s4); padding: var(--s3) var(--s4); min-width: 20rem; display: flex; flex-direction: column; gap: var(--s2); }
.kit-time__head { display: flex; align-items: center; justify-content: space-between; gap: var(--s3); }
.kit-time__value { font-size: var(--text-xl); color: var(--ink-max); }
.kit-time__controls { display: flex; align-items: center; gap: var(--s3); }
.kit-time__play {
  width: var(--s6); height: var(--s6); display: grid; place-items: center;
  background: transparent; border: 1px solid var(--glass-border); border-radius: var(--radius-chip);
  color: var(--ink); cursor: pointer; font-size: var(--text-xs);
  transition: color var(--t-fast) var(--ease), border-color var(--t-fast) var(--ease);
}
.kit-time__play:hover { color: var(--ink-max); border-color: var(--hairline); }
.kit-time__track { flex: 1; position: relative; }
.kit-time__track input[type="range"] { width: 100%; accent-color: var(--ink); }
.kit-time__ticks { display: flex; justify-content: space-between; margin-top: var(--s1); }
.kit-time__tick { width: 1px; height: var(--s2); background: var(--glass-border); }
.kit-time__tick[data-on="true"] { background: var(--ink-dim); }
@media (max-width: 640px) { .kit-time { left: var(--s2); right: var(--s2); min-width: 0; bottom: 7rem; } }
```

- [ ] **Step 4: Mount both, driving `TimePanel` from page state**

Because `TimePanel` is stateful, wrap the chrome in a small island. Create `src/components/map/HelloChrome.tsx` — Task 14 grows this same file into `HelloMap.tsx`, so keep it small:

```tsx
import { useState } from 'react';
import { TimePanel } from '../kit/TimePanel.js';
import { LegendCanvas } from '../kit/LegendCanvas.js';
import { statusColours } from '../../theme/map-style.js';

export function HelloChrome() {
  const [year, setYear] = useState(2014);
  const [playing, setPlaying] = useState(false);
  const colours = statusColours();

  return (
    <>
      <TimePanel
        range={[2014, 2026]}
        value={year}
        interval="year"
        playable
        playing={playing}
        onPlayToggle={() => setPlaying((p) => !p)}
        onChange={setYear}
      />
      <LegendCanvas
        mode="swatches"
        title="Status"
        items={[
          { label: 'Operational', colour: colours.operational },
          { label: 'Construction', colour: colours.construction },
          { label: 'Announced', colour: colours.announced },
          { label: 'Halted', colour: colours.halted },
        ]}
      />
    </>
  );
}
```

Add `<HelloChrome client:load />` inside `<MapRoot>` in `index.astro`, and move the `StampMark` wrapper from bottom-left to bottom-centre (`left:50%; transform:translateX(-50%)`), because `TimePanel` now occupies bottom-left.

**Update the chip assertion.** `TimePanel` renders its own interval `Chip`, so the page now has three. Change Task 11's assertion from `toHaveCount(2)` to `toHaveCount(3)` and re-run — a test that silently counts the wrong thing is worse than no test.

- [ ] **Step 5: Run tests and the gate**

```bash
npm run test:visual   # expect: legend and time-panel tests PASS
npm run ci            # expect: six ✓
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: LegendCanvas and TimePanel — the hero-mechanic host"
```

---

## Task 14: `StoryPin`, `StoryCard`, and the data layer

**Files:**
- Create: `StoryPin.tsx/.css`, `StoryCard.tsx/.css` under `src/components/kit/`; `src/lib/loadData.ts`, `src/lib/format.ts`, `src/components/map/layers/FeaturesLayer.tsx`
- Modify: `src/components/map/HelloChrome.tsx`, `src/pages/index.astro`, `tests/hello-map.spec.ts`

**Interfaces:**
- Consumes: `Feature`, `FeatureCollectionSchema` from Task 4; `statusColours()`, `halo()` from Task 8; `MapRoot`'s `onReady` from Task 9
- Produces: `<StoryPin n lngLat title line>`, `<StoryCard title body stat pagable>`, `loadFeatures(): Feature[]` (synchronous — `sample.json` is bundled, not fetched), `<FeaturesLayer map features onSelect>`

- [ ] **Step 1: Write the failing assertions**

```ts
  test('sample features render and open a card', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-map-ready', 'true');
    await expect(page.getByTestId('feature-count')).toHaveText('10');
    await page.getByTestId('map-canvas').click({ position: { x: 200, y: 300 } });
    // Clicking empty map must NOT open a card.
    await expect(page.getByTestId('story-card')).toHaveCount(0);
  });

  test('story pins render at most four', async ({ page }) => {
    await page.goto('/');
    const pins = page.getByTestId('story-pin');
    expect(await pins.count()).toBeGreaterThan(0);
    expect(await pins.count()).toBeLessThanOrEqual(4);
  });
```

Run `npm run test:visual` — expect FAIL.

- [ ] **Step 2: Write `src/lib/format.ts`**

```ts
export function formatNumber(n: number): string {
  return n.toLocaleString('en-GB');
}

export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

- [ ] **Step 3: Write `src/lib/loadData.ts`**

```ts
import { FeatureCollectionSchema, type Feature } from '../data/schema.js';
import sample from '../data/sample.json';

/**
 * Fetch + zod-parse. Parsing at the boundary means every component downstream
 * can trust every record — that is what makes the frozen schema a real seam.
 */
export function loadFeatures(): Feature[] {
  const result = FeatureCollectionSchema.safeParse(sample);
  if (!result.success) {
    throw new Error(`src/data/sample.json failed validation: ${result.error.message}`);
  }
  return result.data;
}
```

- [ ] **Step 4: Write `StoryCard.tsx` and `StoryCard.css`**

```tsx
import './StoryCard.css';

export type StoryCardProps = {
  title: string;
  body?: string;
  stat?: { label: string; value: string | number };
  onClose?: () => void;
};

export function StoryCard({ title, body, stat, onClose }: StoryCardProps) {
  return (
    <div className="glass kit-card" data-testid="story-card" role="dialog" aria-label={title}>
      <div className="kit-card__head">
        <h2 className="panel-title kit-card__title">{title}</h2>
        {onClose && (
          <button type="button" className="kit-card__close" aria-label="Close" onClick={onClose}>×</button>
        )}
      </div>
      {stat && (
        <div className="kit-card__stat">
          <span className="kit-card__stat-value mono">{stat.value}</span>
          <span className="kit-card__stat-label">{stat.label}</span>
        </div>
      )}
      {body && <p className="panel-sub">{body}</p>}
    </div>
  );
}
```

```css
.kit-card { position: absolute; top: 50%; right: var(--s4); transform: translateY(-50%); padding: var(--s4); width: 18rem; display: flex; flex-direction: column; gap: var(--s3); }
.kit-card__head { display: flex; align-items: start; justify-content: space-between; gap: var(--s2); }
.kit-card__title { font-size: var(--text-lg); }
.kit-card__close { background: none; border: none; color: var(--ink-dim); font-size: var(--text-lg); cursor: pointer; line-height: 1; transition: color var(--t-fast) var(--ease); }
.kit-card__close:hover { color: var(--ink-max); }
.kit-card__stat { display: flex; align-items: baseline; gap: var(--s2); }
.kit-card__stat-value { font-size: var(--text-xl); color: var(--ink-max); }
.kit-card__stat-label { font-size: var(--text-xs); color: var(--ink-dim); text-transform: uppercase; letter-spacing: 0.06em; }
@media (max-width: 640px) { .kit-card { top: auto; bottom: var(--s2); left: var(--s2); right: var(--s2); width: auto; transform: none; } }
```

- [ ] **Step 5: Write `StoryPin.tsx` and `StoryPin.css`**

```tsx
import { useState } from 'react';
import './StoryPin.css';

export type StoryPinProps = {
  n: number;
  lngLat: [number, number];
  title: string;
  line: string;
  /** Screen position supplied by the map projection. */
  screen: { x: number; y: number };
};

export function StoryPin({ n, title, line, screen }: StoryPinProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="kit-pin" style={{ left: `${screen.x}px`, top: `${screen.y}px` }} data-testid="story-pin">
      <button
        type="button"
        className="kit-pin__dot mono"
        aria-expanded={open}
        aria-label={title}
        onClick={() => setOpen((o) => !o)}
      >
        {n}
      </button>
      {open && (
        <div className="glass kit-pin__card" data-testid="story-pin-card">
          <p className="kit-pin__title">{title}</p>
          <p className="panel-sub">{line}</p>
        </div>
      )}
    </div>
  );
}
```

```css
.kit-pin { position: absolute; transform: translate(-50%, -50%); }
.kit-pin__dot {
  width: var(--s6); height: var(--s6); border-radius: 50%;
  background: var(--glass-strong); border: 1px solid var(--ink-max);
  color: var(--ink-max); font-size: var(--text-xs); cursor: pointer;
  display: grid; place-items: center;
  transition: transform var(--t-fast) var(--ease);
}
.kit-pin__dot:hover { transform: scale(1.12); }
.kit-pin__card { position: absolute; left: var(--s8); top: 0; width: 14rem; padding: var(--s3); }
.kit-pin__title { margin: 0 0 var(--s1); font-size: var(--text-sm); color: var(--ink-max); }
```

- [ ] **Step 6: Write `src/components/map/layers/FeaturesLayer.tsx`**

```tsx
import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import type { Feature } from '../../../data/schema.js';
import { statusColours, halo } from '../../../theme/map-style.js';

export type FeaturesLayerProps = {
  map: mapboxgl.Map | null;
  features: Feature[];
  onSelect: (f: Feature) => void;
};

const SOURCE = 'features';
const LAYER = 'features-circles';

export function FeaturesLayer({ map, features, onSelect }: FeaturesLayerProps) {
  useEffect(() => {
    if (!map) return;
    const colours = statusColours();
    const { width, colour } = halo();

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: features.map((f) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lng, f.lat] },
        properties: { ...f },
      })),
    };

    if (map.getSource(SOURCE)) {
      (map.getSource(SOURCE) as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(SOURCE, { type: 'geojson', data: geojson });
      map.addLayer({
        id: LAYER,
        type: 'circle',
        source: SOURCE,
        paint: {
          'circle-radius': 7,
          'circle-color': [
            'match',
            ['get', 'status'],
            'operational', colours.operational,
            'construction', colours.construction,
            'announced', colours.announced,
            'halted', colours.halted,
            colours.announced,
          ],
          'circle-stroke-width': width,
          'circle-stroke-color': colour,
        },
      });

      map.on('click', LAYER, (e) => {
        const props = e.features?.[0]?.properties as Feature | undefined;
        if (props) onSelect(props);
      });
      map.on('mouseenter', LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAYER, () => { map.getCanvas().style.cursor = ''; });
    }
  }, [map, features, onSelect]);

  return null;
}
```

- [ ] **Step 7: Wire everything through `HelloChrome.tsx`**

Replace `HelloChrome.tsx` with a version that owns map state, renders the layer, the card, four pins, and the counter. Lift `MapRoot` into it so it holds the map instance:

```tsx
import { useMemo, useState } from 'react';
import type mapboxgl from 'mapbox-gl';
import { MapRoot } from './MapRoot.js';
import { FeaturesLayer } from './layers/FeaturesLayer.js';
import { HeadlineBlock } from '../kit/HeadlineBlock.js';
import { CounterStrip } from '../kit/CounterStrip.js';
import { ControlStack, ControlButton } from '../kit/ControlStack.js';
import { LegendCanvas } from '../kit/LegendCanvas.js';
import { TimePanel } from '../kit/TimePanel.js';
import { HintToast } from '../kit/HintToast.js';
import { StoryCard } from '../kit/StoryCard.js';
import { StoryPin } from '../kit/StoryPin.js';
import { StampMark } from '../kit/StampMark.js';
import { loadFeatures } from '../../lib/loadData.js';
import { statusColours } from '../../theme/map-style.js';
import { titleCase } from '../../lib/format.js';
import type { Feature } from '../../data/schema.js';

export function HelloMap() {
  const features = useMemo(() => loadFeatures(), []);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [selected, setSelected] = useState<Feature | null>(null);
  const [year, setYear] = useState(2014);
  const [playing, setPlaying] = useState(false);
  const colours = statusColours();

  const pins = features.slice(0, 4);

  return (
    <MapRoot onReady={setMap}>
      <FeaturesLayer map={map} features={features} onSelect={setSelected} />

      <HeadlineBlock title="astro-mapbox-basic" subline="A basic Astro + Mapbox boilerplate" live>
        <CounterStrip
          primary={{ label: 'sample records', value: features.length }}
          secondary={[{ label: 'operational', value: features.filter((f) => f.status === 'operational').length }]}
        />
        <StampMark lat={1.3521} lng={103.8198} label="Singapore" variant="compact" />
        <span data-testid="feature-count" hidden>{features.length}</span>
      </HeadlineBlock>

      <ControlStack>
        <ControlButton label="Zoom in" onClick={() => map?.zoomIn()}>+</ControlButton>
        <ControlButton label="Zoom out" onClick={() => map?.zoomOut()}>−</ControlButton>
      </ControlStack>

      <TimePanel
        range={[2014, 2026]} value={year} interval="year" playable playing={playing}
        onPlayToggle={() => setPlaying((p) => !p)} onChange={setYear}
      />

      <LegendCanvas
        mode="swatches" title="Status"
        items={[
          { label: 'Operational', colour: colours.operational },
          { label: 'Construction', colour: colours.construction },
          { label: 'Announced', colour: colours.announced },
          { label: 'Halted', colour: colours.halted },
        ]}
      />

      {pins.map((f, i) => {
        const pt = map?.project([f.lng, f.lat]);
        if (!pt) return null;
        return (
          <StoryPin key={f.id} n={i + 1} lngLat={[f.lng, f.lat]} title={f.name}
            line={titleCase(f.status)} screen={{ x: pt.x, y: pt.y }} />
        );
      })}

      {selected && (
        <StoryCard
          title={selected.name}
          body={titleCase(selected.status)}
          stat={selected.value !== undefined ? { label: 'value', value: selected.value } : undefined}
          onClose={() => setSelected(null)}
        />
      )}

      <HintToast text="Click a marker to inspect it" />
    </MapRoot>
  );
}
```

Simplify `src/pages/index.astro` to:

```astro
---
import Base from '../layouts/Base.astro';
import { HelloMap } from '../components/map/HelloMap.tsx';
---
<Base title="astro-mapbox-basic">
  <HelloMap client:load />
</Base>
```

Rename `HelloChrome.tsx` to `src/components/map/HelloMap.tsx` (this task's code replaces its contents entirely).

**Re-check the two continuity assertions.** `StampMark` now lives inside `HeadlineBlock` rather than in a positioned wrapper, and the only remaining `Chip` is `TimePanel`'s interval chip. Update Task 11's assertions to `chip → toHaveCount(1)` and confirm `stamp` is still visible. Run the full suite before moving on.

- [ ] **Step 8: Run tests and the gate**

```bash
npm run test:visual   # expect: all tests PASS across both projects
npm run ci            # expect: six ✓
```

- [ ] **Step 9: Screenshot for the human**

```bash
npx playwright screenshot --viewport-size=1440,900 --wait-for-timeout=5000 \
  http://localhost:4321 docs/hello-map.png
```

All ten components must be visible in their grammar positions over the terrain. Show it to the human before proceeding.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: StoryPin, StoryCard, data layer — all ten kit components live"
```

---

## Task 15: Documentation and templates

**Files:**
- Create: `README.md`, `CLAUDE.md`, `BRIEF.md`, `PLAN.md`, `DATA.md`, `SCOREBOARD.md`, `CHANGELOG.md`, `docs/PHASES.md`, `docs/COMPONENTS.md`, `docs/SECRETS.md`

**Interfaces:**
- Consumes: everything built so far
- Produces: the forker-facing surface. No code depends on this task.

- [ ] **Step 1: Write `CLAUDE.md` — agent law**

```markdown
# Agent Law — astro-mapbox-basic project

0. Read BRIEF.md before anything — it is the WHY/WHO/WHAT context that every
   decision must serve. If a choice conflicts with the brief, the brief wins.
1. PLAN.md is the single source of truth for engineering. If reality diverges,
   STOP and raise it with the human. Never silently improvise scope.
2. One worktree per phase, named `phase-N-desc`. Never work across two phases.
3. Kit components (src/components/kit/) are composed, NEVER modified or restyled.
   ALL visual values come from src/theme/ — restyling anything means editing the
   theme folder, never a component. `npm run check:tokens` must pass.
4. All acquisition scripts you write live in data-pipeline/. Everything in
   data-pipeline/raw/ is disposable and gitignored.
5. Secrets: read from process.env / import.meta.env only. Writing a literal token
   string anywhere is task failure, even if the code works. .env is gitignored;
   never create alternative env files. NEVER paste a token into a chat, an issue,
   or an AI transcript — put it in .env and tell the agent it is there.
6. src/data/schema.ts is FROZEN after Phase 0. If the data demands a schema
   change, stop and renegotiate PLAN.md with the human.
7. End every phase by running its checkpoint script and reporting output verbatim.
   Before deploy: `npm run ci` must be fully green — no skips, no --no-verify.
8. Install no dependency not named in PLAN.md without asking.
9. Data provenance: every source URL goes in data-pipeline/README.md as you use it.
```

> Law 5's final sentence is new, added because a token was leaked into a chat transcript during this build — a path none of the machinery guards.

- [ ] **Step 2: Write `docs/SECRETS.md`**

```markdown
# SECRETS — the model

Three layers, three moments. A secret must defeat all three, while also being an
inert URL-restricted token if it somehow does.

| Moment | Defence |
|---|---|
| Commit | `lefthook` runs gitleaks + a token-literal regex on staged changes. The commit physically fails, whoever made it. |
| Before deploy | `npm run ci` runs `check:secrets` and `check:dist`. `predeploy` runs `ci`, so a red build cannot ship. |
| Push | GitHub Actions runs the same `npm run ci`. Catches `--no-verify` and forks with hooks disabled. |

## The token doctrine

- The frontend reads `PUBLIC_MAPBOX_TOKEN` from env at build time.
- **URL-restrict that token in the Mapbox dashboard** — step one of every project.
  Include your dev port: restrictions default to ports 80 and 443, and Astro dev
  runs on 4321, so `http://localhost` alone will 403 every tile.
- A leaked restricted `pk` token is inert. That is the design, not a consolation.
- `sk` tokens live only in pipeline env. They are never referenced by `src/`.
- A literal token string anywhere in the repo is a failed task **even if it works**.

## check:dist — the one everyone misses

Bundlers inline env vars. A carelessly-referenced secret ships to the world inside
your JavaScript. `check:dist` builds and scans `dist/`. A `pk.` token there is
expected and fine. An `sk.` match is instant, loud failure.

## Never paste a token into a chat

Not into an issue, a PR description, a Slack message, or an AI transcript. The
machinery above guards the *code* path; a human pasting a credential into a chat
window walks around all of it. Put it in `.env` — which is gitignored from the
first commit — and tell the agent it is there.

## Proving it works

`npm run test:sabotage` runs four attacks in a throwaway worktree and asserts each
is caught. Run it after any change to the secrets layer. A checklist is vigilance;
a failing test is machinery.
```

- [ ] **Step 3: Write `docs/COMPONENTS.md`**

Copy the ten-row component table **verbatim** from `docs/superpowers/specs/2026-08-23-astro-mapbox-basic-design.md` §3.3, then append these three sections:

1. **Layout grammar** — top-left `HeadlineBlock` (+ `CounterStrip`) · top-centre optional status badge · top-right `ControlStack` · bottom-left `TimePanel` · bottom-right `LegendCanvas`. Nothing else floats. Mobile docks panels to a bottom sheet; the map stays full-bleed.
2. **The composition rule** — kit components are composed, never modified or restyled. Every visual value comes from `src/theme/`. Restyling means editing the theme folder, never a component.
3. **The portability rule** — no Astro-specific API inside `src/components/kit/`, and no CSS-framework utility or import. `npm run check:tokens` enforces both.

- [ ] **Step 4: Write `docs/PHASES.md`**

Copy §8 of the source spec (`~/code/singapore-data-center-map/basic-map-kit/basic-map-kit-spec.md`) verbatim — all seven phase descriptions with their checkpoints — then add this header above it:

```markdown
**The law:** one phase = one worktree = one PR = one checkpoint = one human review.
No merge without a passing checkpoint. No agent works across two phases.

**The only permitted parallelism is Phase 1 ∥ Phase 2.** It is safe because Phase 2
builds against `sample.json`, which conforms to the schema frozen in Phase 0 — so
when Phase 1's real data lands, the shell already works. The schema is the seam.
Phases 3→4→5→6 are strictly sequential; each consumes the previous phase's output.
```

- [ ] **Step 5: Write `BRIEF.md`, `PLAN.md`, `DATA.md` templates**

Copy the templates verbatim from the source spec's §7.0, §7, and §7.5 respectively.

- [ ] **Step 6: Write `README.md`**

Must contain: what it is in two sentences · the quickstart (`git clone` → `npm install` → copy `.env.example` to `.env` → add a URL-restricted pk token with `:4321` in its allowed URLs → `npm run dev`) · the **measured** cold-start time from Task 17 · the six checks table · the sabotage suite · a link to THEME.md, SECRETS.md, PHASES.md, COMPONENTS.md · the repo family table (`astro-mapbox-basic` today, `vite-mapbox-basic` and `astro-maplibre-basic` later) · Mapbox attribution requirements.

- [ ] **Step 7: Write `SCOREBOARD.md` and `CHANGELOG.md`**

```markdown
# SCOREBOARD — shakedown runs

A run is "smooth" when it has zero KIT-GAP entries, human interventions only at
the seven review gates, and every checkpoint passing first try. Expect run 1 to
be messy — that is the point of run 1.

| Run | Kit ver | Project | Total time | Human interventions | KIT-GAPs | Checkpoint first-pass rate |
|---|---|---|---|---|---|---|
| 1 | v0.1 | singapore-data-center-map | — | — | — | — |
```

- [ ] **Step 8: Verify and commit**

```bash
npm run ci
git add -A
git commit -m "docs: README, agent law, secrets model, phases, components, templates"
```

---

## Task 16: Patch the source spec

**Files:**
- Modify: `../singapore-data-center-map/basic-map-kit/basic-map-kit-spec.md`

**Interfaces:**
- Consumes: §10 of the design spec
- Produces: a source spec that no longer contradicts itself, so shakedown run 1 measures friction in the boilerplate rather than in the documentation.

- [ ] **Step 1: Apply the three corrections**

| # | Change |
|---|---|
| 1 | §2's tree and §11's Definition of Done: **six kit components → ten**, matching §3.3. |
| 2 | §2's tree: `src/styles/tokens.css` → **`src/theme/`** with `tokens.css`, `recipes.css`, `map-style.ts`. |
| 3 | §1, §2, §11: one repo containing `story-astro` + `app-vite` → **one repo per combination**, `astro-mapbox-basic` first. |

- [ ] **Step 2: Add the chat-leak law to §6's CLAUDE.md block**

Append to law 5: `NEVER paste a token into a chat, an issue, or an AI transcript — put it in .env and tell the agent it is there.`

- [ ] **Step 3: Commit in that repo**

```bash
cd ../singapore-data-center-map
git add -A 2>/dev/null || true
git commit -m "docs: resolve three spec self-contradictions found during kit design" 2>/dev/null || true
```

If that directory is not a git repo, leave the edits uncommitted and tell the human.

---

## Task 17: Ship — deploy, measure, tag `v0.1`

**Files:**
- Modify: `README.md` (the measured cold-start number)

**Interfaces:**
- Consumes: everything
- Produces: a live URL and a frozen `v0.1` tag. The Singapore map clones from this tag.

- [ ] **Step 1: Measure the cold start honestly**

```bash
cd $(mktemp -d)
git clone --depth 1 ~/code/astro-mapbox-basic measure && cd measure
cp .env.example .env
# paste the pk token into .env
time (npm install && timeout 60 npm run dev &>/dev/null || true)
```

Record the wall-clock figure. Put the **real** number in README.md. If it exceeds three minutes, say so in the README rather than quietly rounding — and log it as a KIT-GAP.

- [ ] **Step 2: Run the full gate and the sabotage suite one final time**

```bash
cd ~/code/astro-mapbox-basic
npm run ci             # expect: six ✓
npm run test:sabotage  # expect: ✓ all 4
npm run test:visual    # expect: all PASS
```

Report all three outputs verbatim to the human.

- [ ] **Step 3: Deploy**

```bash
npx wrangler login     # if not already authenticated
npm run deploy         # predeploy runs ci first — it physically cannot ship red
```

Expected: a `*.workers.dev` URL. Open it and confirm the map renders.

- [ ] **Step 4: Add the workers.dev URL to the Mapbox token's allowed URLs**

Otherwise the deployed map 403s while localhost works. Human action, in the Mapbox dashboard.

- [ ] **Step 5: Update README with the live URL and measured cold start, then tag**

```bash
git add -A
git commit -m "docs: measured cold start and live URL"
git tag -a v0.1 -m "v0.1 — ten components, six checks, four sabotage tests, live map"
git log --oneline
```

- [ ] **Step 6: Freeze**

**This is the hard line.** The Singapore map starts from a clean clone of `v0.1`. Do not patch the boilerplate while building the map — log gaps in that project's `FRICTION.md` instead. A gap fixed silently is a gap that never gets measured, and measuring them is half the point of run 1.

---

## Definition of Done

- [ ] `git clone` → `npm install` → `npm run dev` → live Mapbox map with sample data, in a **measured** time under three minutes
- [ ] All **ten** kit components render in the hello-map, in their grammar positions
- [ ] No CSS framework package, config, or import anywhere in the repo
- [ ] No Astro-specific API inside `src/components/kit/`
- [ ] `npm run ci` green end-to-end on a fresh clone with no network beyond npm and no Mapbox token
- [ ] All four sabotage tests pass — each attack caught by its intended layer
- [ ] `npm run test:visual` green on desktop and mobile projects
- [ ] `npm run deploy` puts the hello-map live on workers.dev
- [ ] `CLAUDE.md`, `BRIEF.md`, `PLAN.md`, `DATA.md` present at the repo root
- [ ] `.nvmrc` pins `24.19.0`
- [ ] Source spec's three contradictions patched
- [ ] Tagged `v0.1`
