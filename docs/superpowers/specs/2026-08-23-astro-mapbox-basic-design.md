# astro-mapbox-basic — Design

**Date:** 2026-08-23
**Scope:** this repo only. The Singapore data centre map is a separate project with its own design cycle, built from a frozen clone of this one.
**Source documents:** `basic-map-kit-spec.md` (v2) and `assembly-line.md`.

---

## 0 · Decisions to confirm before implementation

1. **Node.** `.nvmrc` pins **24.19.0** (active LTS, "Krypton"). Your machine runs 23.10.0, which is non-LTS and end-of-life, so this needs `nvm install 24` before the first build. Pinning is what makes your runs, agent runs, and forker runs identical.
2. **Repo visibility.** Public from the first commit means the sabotage tests and any fumbling are visible history. Private until `v0.1`, then flip, is safer — but you are filming a build log, so visible history may be the point. Currently local-only with no remote, so this costs nothing to defer.

**Open dependency, not a decision:** a URL-restricted Mapbox `pk.` token. Everything builds and every check passes without it — `npm run ci` is deliberately networkless. Only the live map render is blocked, and that is the one thing that cannot be faked.

---

## 1 · What this is

A public, forkable Astro + Mapbox boilerplate. Clone the repo, `npm install`, `npm run dev`, map on screen.

It exists to kill three recurring failures, and each has a mechanical fix rather than a rule:

| Failure | Fix |
|---|---|
| AI slop UI | Slots, not creativity. Components hold zero visual opinions; agents compose and fill with data. |
| No clean phase breakdown for coordinator + subagents | Seven phases, one worktree each, with a frozen data schema as the seam that makes parallel work safe. |
| Agents committing secrets | Machinery, not vigilance. Hooks fail the commit regardless of author; tokens are inert if leaked. |

"Basic" is the promise, not a description of the engineering. The hard decisions are already made.

### 1.1 The repo family

One repo per combination, each self-contained. The repo *is* the template, so GitHub's "Use this template" works natively and a clone has no nesting to explain.

| Repo | Status |
|---|---|
| `astro-mapbox-basic` | **This one.** Pages: marketing sites, SEO market pages, story maps. |
| `vite-mapbox-basic` | Later. Apps: internal tools, dashboards, full-screen interactives. |
| `astro-maplibre-basic` | Later, if no-token tiles become worth it. |

Engine first in the name because that is the axis someone chooses on — page or app before mapbox or maplibre.

**When component duplication across repos eventually bites, the answer is publishing the kit components as an npm package that every repo depends on — not a sync script.** Recorded here so neither of us reinvents sync machinery in three months.

---

## 2 · Repo layout

The repo root is the template. There is no `templates/` directory.

```
astro-mapbox-basic/
├── src/
│   ├── components/
│   │   ├── kit/              # PRE-BUILT — composed, never restyled
│   │   └── map/              # THE ONLY CUSTOM ZONE — per-project map logic
│   │       ├── MapRoot.tsx
│   │       ├── layers/
│   │       └── interactions/
│   ├── lib/                  # loadData.ts · format.ts · mapbox.ts
│   ├── theme/                # tokens.css · recipes.css · map-style.ts
│   ├── data/                 # schema.ts (FROZEN in Phase 0) · sample.json
│   └── pages/index.astro
├── scripts/checks/           # the six check scripts + sabotage suite
├── docs/
│   ├── PHASES.md · COMPONENTS.md · SECRETS.md · THEME.md
│   └── superpowers/specs/    # design documents (this file)
├── public/og.png             # generated in Phase 5
├── BRIEF.md · PLAN.md · DATA.md · CLAUDE.md
├── .nvmrc · .env.example · .gitignore · lefthook.yml
├── wrangler.jsonc
├── CHANGELOG.md
├── SCOREBOARD.md             # one row per shakedown run
└── README.md
```

`data-pipeline/` is created on demand and only when data must be acquired rather than supplied (Phase 1 Mode B). It does not ship in the template.

`SCOREBOARD.md` lives here for now. It moves to a method repo only if a second boilerplate repo actually appears.

---

## 3 · The design system

### 3.1 The principle

Components hold zero visual opinions. Everything else follows:

- **Anti-slop is structural.** Agents produce slop when they design. A component with no visual decisions left in it gives them nothing to design.
- **Colour discipline.** Chrome is monochrome; hierarchy comes from brightness, not hue. The map is the only thing carrying colour. A project's sole colour decision is the status accents for its own data, declared in PLAN.md.
- **Finish is inherited.** Shimmer over spinners, glide over blink, count-up on changing numbers, every interactive element responding within 140ms. Built into the kit components once; every project gets it without anyone choosing to.
- **Fixed layout grammar.** Five positions, nothing else floats — not because those five are optimal, but because a fixed grammar means "where does this go" is never answered creatively.
- **Enforcement is machinery.** `check:tokens` failing the build on a colour literal is what makes the above real rather than aspirational.

### 3.2 The theme contract — exactly three files

`src/theme/` is the entire visual identity, and nothing outside it holds a visual value.

| File | Contains |
|---|---|
| `tokens.css` | Every custom property: ink, glass, hairline, type, space, radius, motion. Values verbatim from source spec §3.1. |
| `recipes.css` | `.glass`, `.shimmer`, and the panel / chip / stamp surface classes. |
| `map-style.ts` | Basemap style URL, per-status data colours, halo configuration. |

Re-theming a project is replacing these three files. `THEME.md` documents every token and what it controls.

**Default theme:** the Electricity Maps architecture — full-bleed map, floating monochrome "liquid glass" panels — finished to the beautifului.dev micro-interaction standard, over `mapbox://styles/mapbox/outdoors-v12`. Data layers read against terrain: points get 1.5px `--ink-max` halos, fills use bold saturated status colours.

### 3.3 The component contract

Ten components in `src/components/kit/`, composed but never modified or restyled.

**Each component owns a co-located plain-CSS file** using only `var(--token)` references:

```
src/components/kit/
  HeadlineBlock.tsx        import './HeadlineBlock.css'
  HeadlineBlock.css        var(--glass), var(--ink), var(--s4) — no literals, no utilities
```

**Components must contain no Astro-specific API.** Only Astro ships today, but writing them portable costs nothing now and makes `vite-mapbox-basic` a copy-paste rather than a rewrite. It is also what keeps the theme system honestly detachable, which is the anti-slop claim under test. Astro's documentation confirms ESM CSS imports work inside React components, and Astro runs Vite underneath, so co-located CSS behaves the same in any future Vite-based sibling.

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

### 3.4 The custom zone

`src/components/map/` is the only place per-project logic lives: `MapRoot.tsx` (mapbox-gl init, style load, resize), `layers/` (one file per data layer), `interactions/` (the hero mechanic).

---

## 4 · Data

`src/data/schema.ts` holds zod schemas and is **frozen after Phase 0**. `sample.json` holds 5–10 hand-written records conforming to it. The frozen schema is the seam that makes Phase 1 and Phase 2 safe to run in parallel: the shell builds against the sample, so when real data lands it simply works.

Committed data files stay under ~2 MB. Larger means tiling (tippecanoe → PMTiles on R2), which is an explicit PLAN.md decision, never an agent's improvisation.

`DATA.md` documents the bring-your-own path: drop files into `src/data/`, describe them in `schema.ts`, run `npm run check:data` until green.

**Note:** zod is at 4.4.3, whose API differs from the zod 3 idioms in wide circulation. The shipped schema example must be written and verified against zod 4.

---

## 5 · Stack

| | Version |
|---|---|
| Astro | 7.2.4 |
| React islands | 19.2.8 via `@astrojs/react` 6.0.4 |
| Map | `mapbox-gl` 3.29.0 directly, no React wrapper |
| Styling | `src/theme/` + co-located component CSS. **Zero Tailwind, zero CSS framework.** |
| Schema | zod 4.4.3 |
| Scripts | `tsx` 4.23.12 |
| Hooks | `lefthook` 2.1.10 + `gitleaks` |

No test framework: the check scripts are plain TypeScript that exit non-zero.

**Deploy target:** Cloudflare Workers with static assets. `wrangler.jsonc` names the project and points `assets.directory` at `./dist`. No Pages.

---

## 6 · The gate

### 6.1 `npm run ci` — six checks, networkless

Runs on a laptop with no accounts, no tokens, and no network beyond npm.

1. **`typecheck`** — `tsc --noEmit`.
2. **`check:tokens`** — greps `src/` for colour literals outside `src/theme/`: hex, `rgb()`, `rgba()`, `hsl()`. Also fails on any CSS-framework utility class or import inside `src/components/kit/`, which is what keeps components portable to a future Vite sibling.
3. **`check:data`** — every record in `src/data/` zod-validates; prints counts and bounds.
4. **`check:env`** — statically finds every `process.env.X` and `import.meta.env.X` read in `src/`, `scripts/checks/`, and `data-pipeline/` when it exists, and fails unless each `X` appears in `.env.example`; fails if any `.env.example` value is non-empty; fails if git tracks any `.env*` other than `.env.example`.
5. **`check:secrets`** — `gitleaks detect` across the working tree.
6. **`check:dist`** — builds, then scans `dist/` for `sk.ey…` patterns and high-entropy strings. Bundlers inline env vars, so a carelessly-referenced secret ships to the world inside the JS. A `pk.` token in the bundle is expected and correct — it is public by design and URL-restricted, therefore inert elsewhere. An `sk.` match is instant failure.

`predeploy` runs `ci`, so `npm run deploy` cannot ship a red build. `ci.yml` is three lines running the same command, so local and remote are one gate with one source of truth; the Action exists only to catch `--no-verify` and forks with hooks disabled.

### 6.2 The three layers

`lefthook` stops secrets at commit · `npm run ci` stops them before deploy · the Action stops them at push. A secret must defeat all three while also being an inert URL-restricted token if it somehow does.

### 6.3 `npm run test:sabotage` — four attacks

The four Definition-of-Done checks are a **script, not a checklist**. A checklist item is vigilance; a failing test is machinery, and it re-proves the secrets layer on every future change rather than trusting it still works.

All four run **inside a throwaway git worktree** so the real repo is never dirtied:

| # | Attack | Must be caught by |
|---|---|---|
| S1 | Plant a fake `sk.ey…` in a staged commit | lefthook pre-commit |
| S2 | Reference that token in code, then build | `check:dist` finding it in the bundle |
| S3 | Read a `process.env` var absent from `.env.example` | `check:env` |
| S4 | Put a non-empty value in `.env.example` | `check:env` |

A sabotage test that passes when it should fail is itself a build failure.

---

## 7 · Testing

| Layer | Method |
|---|---|
| Types | `tsc --noEmit` |
| Security machinery | `npm run test:sabotage` — four attacks, automated |
| Data | `check:data` against `sample.json` |
| Visual | **Playwright** drives the hello-map: all ten components present, panels in their grammar positions, map tiles rendered, no console errors. Screenshots reviewed by the human. |
| Cold start | Clone to a temp dir, `npm install`, `npm run dev`, and **measure**. The sub-three-minute claim goes in the README as a measured number, not a boast. |

---

## 8 · Build order — machinery before features

Gates built after the code get shaped around the code: you discover `check:tokens` is inconvenient and soften it. Gates built against an empty repo are absolute, and everything written afterwards is written to pass them.

1. Repo skeleton, `.nvmrc`, `.gitignore`, `.env.example`, `lefthook.yml`
2. **All six check scripts and the four sabotage tests, passing, before any feature code exists**
3. `src/theme/` — the three files — and `THEME.md`
4. The ten kit components, each appearing in the hello-map as it lands so nothing is written unproven
5. `MapRoot` + hello-map over Outdoors with `sample.json` → **live map**, verified with Playwright
6. Docs — README, PHASES, COMPONENTS, SECRETS, THEME, DATA, CLAUDE.md, BRIEF/PLAN templates
7. Deploy to workers.dev, tag `v0.1`, freeze

**Step 7 is a hard line.** The Singapore map starts from a clean clone of the frozen repo. Building the boilerplate and the map together would mean every gap gets patched on the spot instead of logged, which makes shakedown run 1 worthless as a validation.

---

## 9 · Definition of Done

- [ ] `git clone` → `npm install` → `npm run dev` → live Mapbox map with sample data, in a measured time under three minutes
- [ ] All **ten** kit components render in the hello-map, in their grammar positions
- [ ] No CSS framework package, config, or import anywhere in the repo
- [ ] No Astro-specific API inside `src/components/kit/`
- [ ] All six checks runnable and meaningful; `npm run ci` green end-to-end on a fresh clone with no network beyond npm
- [ ] All four sabotage tests pass — each attack caught by its intended layer
- [ ] Playwright run green: components present, tiles rendered, console clean
- [ ] `npm run deploy` puts the hello-map live on workers.dev
- [ ] `CLAUDE.md`, `BRIEF.md`, `PLAN.md`, `DATA.md` present at the repo root
- [ ] `.nvmrc` pins the LTS
- [ ] Tagged `v0.1`

---

## 10 · Corrections to the source spec

The source spec contradicts itself in three places. All three are resolved here and must be patched back into `basic-map-kit-spec.md` during the build, so run 1 measures friction in the boilerplate rather than in the documentation.

| # | Contradiction | Resolution |
|---|---|---|
| 1 | §2's tree lists six kit components; §11 says "all six"; §3.3 specifies ten with full props | **Ten.** §3.3 is later and more detailed, and Singapore needs `TimePanel` and `StoryCard` by Phase 4 regardless. Patch §2 and §11. |
| 2 | §2's tree puts the visual identity in `src/styles/`; §3, `THEME.md`, and CLAUDE.md law 3 say `src/theme/` | **`src/theme/`.** The agent law references it, and law beats a diagram. Patch §2. |
| 3 | §1 and §2 describe one repo containing `story-astro` and `app-vite` templates | **One repo per combination**, named engine-first: `astro-mapbox-basic` today, `vite-mapbox-basic` and `astro-maplibre-basic` later. The repo *is* the template. Patch §1, §2, and §11's two-evening scope. |

---

## 11 · Out of scope

- The Singapore data centre map — separate project, separate design cycle, starts from a clean clone of `v0.1`.
- `vite-mapbox-basic` and `astro-maplibre-basic` — later repos, not today.
- Any shared-component package or sync machinery. Revisit only when duplication actually hurts, and then as an npm package.
- PMTiles / tippecanoe tiling — a per-project PLAN.md decision, not boilerplate machinery.
- Server-side secrets and `wrangler secret put` — no v1 project needs them.
- A custom Mapbox Studio basemap — Outdoors ships as-is; a lower-density Studio duplicate is a later nicety.
- A `new-project.sh` degit wrapper. GitHub's "Use this template" button does the job with no file to maintain.

---

## 12 · Deferred to shakedown run 1

Deliberately left for the Singapore build to answer, and logged in `FRICTION.md` when they bite:

- Whether ten components is the right set, or whether one is unused and one is missing.
- Whether the seven-phase breakdown survives contact with a real dataset.
- Whether Mode B (acquisition pipeline) or Mode A (bring your own data) is the path Singapore takes — a Phase 1 decision for the map, not a boilerplate decision.
- Whether the sub-three-minute cold start holds for someone who is not the author.
