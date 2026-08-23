# basic-map-kit — Design

**Date:** 2026-08-23
**Scope:** the kit itself. The Singapore data centre map is a separate project with its own design cycle.
**Source documents:** `basic-map-kit-spec.md` (v2) and `assembly-line.md`.

---

## 0 · Decisions to confirm before implementation

Two things need a yes or a correction. Everything else in this document is settled.

1. **Vite major.** You said "vite 7"; Vite 8.2.2 is current. This spec pins **Vite 8**, reading "vite 7 / tailwind 4.0" as naming modern majors rather than exact versions — Tailwind 4.0 is now 4.3.3 by the same logic. Building a brand-new public kit on a superseded major imposes an upgrade on every forker. Say the word and it is Vite 7; it is a one-line change in one `package.json`.
2. **Node.** `.nvmrc` pins **24.19.0** (active LTS, "Krypton"). Your machine runs 23.10.0, which is non-LTS and end-of-life, so this requires `nvm install 24` before the first build. Pinning matters here: `.nvmrc` is what makes your runs, agent runs, and forker runs identical.

**Open dependency, not a decision:** a URL-restricted Mapbox `pk.` token. Everything builds and every check passes without it — `npm run ci` is deliberately networkless. Only the live map render is blocked, and that is the one thing that cannot be faked.

---

## 1 · What this is

A public, forkable Mapbox boilerplate. Clone one template, `npm install`, `npm run dev`, map on screen.

It exists to kill three recurring failures, and each has a mechanical fix rather than a rule:

| Failure | Fix |
|---|---|
| AI slop UI | Slots, not creativity. Components hold zero visual opinions; agents compose and fill with data. |
| No clean phase breakdown for coordinator + subagents | Seven phases, one worktree each, with a frozen data schema as the seam that makes parallel work safe. |
| Agents committing secrets | Machinery, not vigilance. Hooks fail the commit regardless of author; tokens are inert if leaked. |

"Basic" is the promise, not a description of the engineering. The hard decisions are already made.

---

## 2 · The product

The entire user-facing story is one table in the README:

| Building | Template |
|---|---|
| A page — marketing site, SEO market page, story map | `page-astro` |
| An app — internal tool, dashboard, full-screen interactive | `app-vite` |

Each template folder is self-contained. A forker clones one and never learns the other exists.

---

## 3 · Repo layout

```
basic-map-kit/
├── templates/
│   ├── page-astro/           # canonical source of the shared subtree
│   └── app-vite/
├── docs/
│   ├── PHASES.md             # the seven-phase build system
│   ├── COMPONENTS.md         # kit component reference
│   ├── SECRETS.md            # the security model, for forkers
│   ├── THEME.md              # the theme contract
│   └── superpowers/specs/    # design documents (this file)
├── scripts/                  # KIT-LEVEL, maintainer-only. Never shipped to forkers.
│   └── sync-templates.sh     # copies the shared subtree page-astro → app-vite
├── .nvmrc
├── CHANGELOG.md
├── SCOREBOARD.md             # one row per shakedown run
└── README.md
```

`SCOREBOARD.md` lives in the kit rather than in any map, so every shakedown run writes back to one place.

### 3.1 The shared subtree

Both templates contain identical copies of:

```
src/components/   src/lib/   src/theme/   src/data/   scripts/checks/
CLAUDE.md   DATA.md   BRIEF.md   PLAN.md   .env.example   .gitignore   lefthook.yml
```

**Two directories are called `scripts/` and they are unrelated.** `basic-map-kit/scripts/`
at the repo root is maintainer tooling and is never shipped. `templates/*/scripts/checks/`
holds the six check scripts and travels with every fork. Nothing moves between them.

Engine-specific, never shared: `package.json`, the entry point (`src/pages/index.astro` vs `src/main.tsx` + `index.html`), and the engine config (`astro.config.mjs` vs `vite.config.ts`). `wrangler.jsonc` is identical in both, since Astro and Vite both emit `./dist`.

**`page-astro` is the canonical source** because it has zero styling dependencies. A component authored there works everywhere by construction; a component authored in the Tailwind template can pick up a utility class that silently dies in Astro. Building in the constrained environment makes contamination structurally impossible rather than something to watch for.

`scripts/sync-templates.sh` copies the subtree from `page-astro` to `app-vite`. It is run by the maintainer when the folders drift. **It is deliberately not a CI gate** — drift is a cheap, maintainer-only, trivially-reversed problem, and gating it would be the gold-plating the source spec's §11 warns against.

---

## 4 · The design system

### 4.1 The principle

Components hold zero visual opinions. Everything else follows:

- **Anti-slop is structural.** Agents produce slop when they design. A component with no visual decisions left in it gives them nothing to design.
- **Colour discipline.** Chrome is monochrome; hierarchy comes from brightness, not hue. The map is the only thing carrying colour. A project's sole colour decision is the status accents for its own data, declared in PLAN.md.
- **Finish is inherited.** Shimmer over spinners, glide over blink, count-up on changing numbers, every interactive element responding within 140ms. Built into the kit components once; every project gets it without anyone choosing to.
- **Fixed layout grammar.** Five positions, nothing else floats — not because those five are optimal, but because a fixed grammar means "where does this go" is never answered creatively.
- **Enforcement is machinery.** `check:tokens` failing the build on a colour literal is what makes the above real rather than aspirational.

### 4.2 The theme contract — exactly three files

`src/theme/` is the entire visual identity, and nothing outside it holds a visual value.

| File | Contains |
|---|---|
| `tokens.css` | Every custom property: ink, glass, hairline, type, space, radius, motion. Values verbatim from source spec §3.1. |
| `recipes.css` | `.glass`, `.shimmer`, and the panel / chip / stamp surface classes. |
| `map-style.ts` | Basemap style URL, per-status data colours, halo configuration. |

Re-theming a project is replacing these three files. `THEME.md` documents every token and what it controls.

**Default theme:** the Electricity Maps architecture — full-bleed map, floating monochrome "liquid glass" panels — finished to the beautifului.dev micro-interaction standard, over `mapbox://styles/mapbox/outdoors-v12`. Data layers read against terrain: points get 1.5px `--ink-max` halos, fills use bold saturated status colours.

### 4.3 The component contract

Ten components in `src/components/kit/`, composed but never modified or restyled.

**Each component owns a co-located plain-CSS file** using only `var(--token)` references:

```
src/components/kit/
  HeadlineBlock.tsx        import './HeadlineBlock.css'
  HeadlineBlock.css        var(--glass), var(--ink), var(--s4) — no literals, no utilities
```

Astro's documentation confirms ESM CSS imports work inside React components, and Astro runs Vite underneath, so a co-located import behaves identically in both templates. This is what lets one component set serve both engines with no per-template styling shim.

**Tailwind never appears inside `src/components/kit/` in either template.** In `app-vite` it exists solely for the forker's own application code outside the kit folder. `page-astro` has no Tailwind package, config, or import — that is a fact of the file tree, not a discipline anyone maintains.

Optionally, `app-vite` may point Tailwind's `@theme inline` at the same custom properties so a forker's utilities match the kit palette. Nothing breaks if they skip it.

The ten components, per source spec §3.3:

| Component | Role |
|---|---|
| `HeadlineBlock` | Top-left glass panel: title, subline, optional LIVE pulse + clock. |
| `TimePanel` | Bottom-left scrubber: current value large, play/pause, interval chip, tick-marked track. Hero-mechanic host for temporal maps. |
| `LegendCanvas` | Bottom-right: swatches or labelled gradient ramp. Always visible, never a menu. |
| `CounterStrip` | One primary number, large, mono; optional secondaries; optional "(how we estimate)" link. Docks into HeadlineBlock on mobile. |
| `HintToast` | Single-interaction teacher. Glass chip, fades on first interaction. |
| `StoryPin` | Numbered pin opening a glass mini-card. Max ~4 per map. |
| `StoryCard` | The click-a-feature card: compact, one stat highlighted, paged if multiple. |
| `Chip` | Filter and interval chips with glide hover. |
| `ControlStack` | Top-right vertical stack of glass squares (zoom, layers, settings). |
| `StampMark` | Static coordinates mark, square radius, mono. |

**Layout grammar:** top-left `HeadlineBlock` (+ `CounterStrip`) · top-centre optional status badge · top-right `ControlStack` · bottom-left `TimePanel` · bottom-right `LegendCanvas`. Mobile docks panels to a bottom sheet; the map stays full-bleed.

### 4.4 The custom zone

`src/components/map/` is the only place per-project logic lives: `MapRoot.tsx` (mapbox-gl init, style load, resize), `layers/` (one file per data layer), `interactions/` (the hero mechanic).

---

## 5 · Data

`src/data/schema.ts` holds zod schemas and is **frozen after Phase 0**. `sample.json` holds 5–10 hand-written records conforming to it. The frozen schema is the seam that makes Phase 1 and Phase 2 safe to run in parallel: the shell builds against the sample, so when real data lands it simply works.

Committed data files stay under ~2 MB. Larger means tiling (tippecanoe → PMTiles on R2), which is an explicit PLAN.md decision, never an agent's improvisation.

`DATA.md` documents the bring-your-own path: drop files into `src/data/`, describe them in `schema.ts`, run `npm run check:data` until green.

**Note:** zod is at 4.4.3, whose API differs from the zod 3 idioms in wide circulation. The kit's shipped schema example must be written and verified against zod 4.

---

## 6 · Stack

| | `page-astro` | `app-vite` |
|---|---|---|
| Engine | Astro 7.2.4 | Vite 8.2.2 |
| UI | React 19.2.8 islands via `@astrojs/react` 6.0.4 | React 19.2.8 |
| Styling | `src/theme/` + co-located component CSS. **Zero Tailwind.** | Same, plus Tailwind 4.3.3 via `@tailwindcss/vite` for app code only |
| Map | `mapbox-gl` 3.29.0 directly, no React wrapper | same |
| Schema | zod 4.4.3 | same |
| Scripts | `tsx` 4.23.12 | same |
| Hooks | `lefthook` 2.1.10 + `gitleaks` | same |

No test framework: the check scripts are plain TypeScript that exit non-zero.

**Deploy target:** Cloudflare Workers with static assets. `wrangler.jsonc` names the project and points `assets.directory` at `./dist`. No Pages.

---

## 7 · The gate

### 7.1 `npm run ci` — six checks, networkless

Runs on a laptop with no accounts, no tokens, and no network beyond npm.

1. **`typecheck`** — `tsc --noEmit`.
2. **`check:tokens`** — greps `src/` for colour literals outside `src/theme/`. Catches hex, `rgb()`, `rgba()`, `hsl()`, **and Tailwind arbitrary-value syntax** (`bg-[#0c0c0c]`, `text-[rgb(...)]`) — without that last pattern, Tailwind would smuggle colour past the anti-slop enforcement. Also fails on any Tailwind utility or import inside `src/components/kit/`.
3. **`check:data`** — every record in `src/data/` zod-validates; prints counts and bounds.
4. **`check:env`** — statically finds every `process.env.X` and `import.meta.env.X` read in `src/`, `scripts/checks/`, and `data-pipeline/` when that folder exists, and fails unless each `X` appears in `.env.example`; fails if any `.env.example` value is non-empty; fails if git tracks any `.env*` other than `.env.example`.
5. **`check:secrets`** — `gitleaks detect` across the working tree.
6. **`check:dist`** — builds, then scans `dist/` for `sk.ey…` patterns and high-entropy strings. Bundlers inline env vars, so a carelessly-referenced secret ships to the world inside the JS. A `pk.` token in the bundle is expected and correct — it is public by design and URL-restricted, therefore inert elsewhere. An `sk.` match is instant failure.

`predeploy` runs `ci`, so `npm run deploy` cannot ship a red build. `ci.yml` is three lines running the same command, so local and remote are one gate with one source of truth; the Action exists only to catch `--no-verify` and forks with hooks disabled.

### 7.2 The three layers

`lefthook` stops secrets at commit · `npm run ci` stops them before deploy · the Action stops them at push. A secret must defeat all three while also being an inert URL-restricted token if it somehow does.

### 7.3 `npm run test:sabotage` — four attacks

The four Definition-of-Done checks are a **script, not a checklist**. A checklist item is vigilance; a failing test is machinery, and it re-proves the secrets layer on every future kit change rather than trusting it still works.

All four run **inside a throwaway git worktree** so the real repo is never dirtied:

| # | Attack | Must be caught by |
|---|---|---|
| S1 | Plant a fake `sk.ey…` in a staged commit | lefthook pre-commit |
| S2 | Reference that token in code, then build | `check:dist` finding it in the bundle |
| S3 | Read a `process.env` var absent from `.env.example` | `check:env` |
| S4 | Put a non-empty value in `.env.example` | `check:env` |

A sabotage test that passes when it should fail is itself a build failure.

---

## 8 · Testing

| Layer | Method |
|---|---|
| Types | `tsc --noEmit` |
| Security machinery | `npm run test:sabotage` — four attacks, automated |
| Data | `check:data` against `sample.json` |
| Visual | **Playwright** drives the hello-map in *both* templates and screenshots each. Byte-identical components rendering identically in a zero-dependency Astro build and a Tailwind Vite build is the portability proof. |
| Cold start | Clone to a temp dir, `npm install`, `npm run dev`, and **measure**. The sub-three-minute claim goes in the README as a measured number, not a boast. |

---

## 9 · Build order — machinery before features

Gates built after the code get shaped around the code: you discover `check:tokens` is inconvenient and soften it. Gates built against an empty repo are absolute, and everything written afterwards is written to pass them.

1. Repo skeleton, `.nvmrc`, `.gitignore`, `.env.example`, `lefthook.yml`
2. **All six check scripts and the four sabotage tests, passing, before any feature code exists**
3. `src/theme/` — the three files — and `THEME.md`
4. The ten kit components, each appearing in the hello-map as it lands so nothing is written unproven
5. `MapRoot` + hello-map over Outdoors with `sample.json` → **live map**
6. `app-vite`: entry point, Vite config, Tailwind wiring, shared subtree copied; Playwright screenshots both
7. Docs — README, PHASES, COMPONENTS, SECRETS, THEME, DATA, CLAUDE.md, BRIEF/PLAN templates
8. Deploy to workers.dev, tag `v0.1`, freeze

**Step 8 is a hard line.** The Singapore map starts from a clean clone of the frozen kit. Building the kit and the map together would mean every gap gets patched on the spot instead of logged, which makes shakedown run 1 worthless as a validation.

---

## 10 · Definition of Done

- [ ] `git clone` → `npm install` → `npm run dev` → live Mapbox map with sample data, in a measured time under three minutes
- [ ] All **ten** kit components render in the hello-map
- [ ] The hello-map renders identically in `page-astro` and `app-vite`, verified by Playwright screenshots
- [ ] `page-astro` contains no Tailwind package, config, or import
- [ ] All six checks runnable and meaningful; `npm run ci` green end-to-end on a fresh clone with no network beyond npm
- [ ] All four sabotage tests pass — each attack caught by its intended layer
- [ ] `npm run deploy` puts the hello-map live on workers.dev
- [ ] `CLAUDE.md`, `BRIEF.md`, `PLAN.md`, `DATA.md` templates present in both template roots
- [ ] `.nvmrc` pins the LTS
- [ ] Tagged `v0.1`

---

## 11 · Corrections to the source spec

The source spec contradicts itself in three places. All three are resolved here and must be patched back into `basic-map-kit-spec.md` during the build, so run 1 measures friction in the kit rather than in the documentation.

| # | Contradiction | Resolution |
|---|---|---|
| 1 | §2's tree lists six kit components; §11 says "all six"; §3.3 specifies ten with full props | **Ten.** §3.3 is later and more detailed, and Singapore needs `TimePanel` and `StoryCard` by Phase 4 regardless. Patch §2 and §11. |
| 2 | §2's tree puts the visual identity in `src/styles/`; §3, `THEME.md`, and CLAUDE.md law 3 say `src/theme/` | **`src/theme/`.** The agent law references it, and law beats a diagram. Patch §2. |
| 3 | §1 and §2 name the template `story-astro` | **`page-astro`.** The real axis is the artifact — a page or an app — which §1's own prose already states. Parallel, jargon-free, self-answering. `StoryPin` and `StoryCard` keep their names; they are named for what they do and ship in both templates. |

---

## 12 · Out of scope

- The Singapore data centre map — separate project, separate design cycle, starts from a clean clone of `v0.1`.
- PMTiles / tippecanoe tiling — a per-project PLAN.md decision, not kit machinery.
- Server-side secrets and `wrangler secret put` — no v1 project needs them.
- A custom Mapbox Studio basemap — Outdoors ships as-is; a lower-density Studio duplicate is a later nicety.
- Any CI gate on template drift — a plain sync script, run by the maintainer.
- A `new-project.sh` degit wrapper. GitHub's "Use this template" button does the job with
  no script to maintain; the source spec listed it as optional and it is not worth the file.

---

## 13 · Deferred to shakedown run 1

The following are deliberately left for the Singapore build to answer, and are logged in `FRICTION.md` when they bite:

- Whether ten components is the right set, or whether one is unused and one is missing.
- Whether the seven-phase breakdown survives contact with a real dataset.
- Whether Mode B (acquisition pipeline) or Mode A (bring your own data) is the path Singapore takes — a Phase 1 decision for the map, not a kit decision.
- Whether the sub-three-minute cold start holds for someone who is not the author.
