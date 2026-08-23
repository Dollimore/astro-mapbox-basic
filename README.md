# astro-mapbox-basic

A forkable Astro + Mapbox boilerplate. Clone it, `npm install`, `npm run dev`, and
you have a live, themed map on screen — **measured at 33 seconds from a fresh clone
on a cold npm cache** (29s install, 4s build and serve).

"Basic" is the promise, not a description of the engineering. The hard decisions
are already made.

**Live demo:** https://astro-mapbox-basic.cold-resonance-79f9.workers.dev

---

## Quickstart

```bash
git clone https://github.com/mickydollimore/astro-mapbox-basic my-map
cd my-map
npm install
cp .env.example .env      # then add your Mapbox pk. token
npm run dev               # http://localhost:4321
```

Your token needs `http://localhost:4321` in its allowed URLs — **with the port**.
Mapbox URL restrictions default to ports 80 and 443 only, so `http://localhost`
alone will 403 every tile request and look exactly like a broken map.

## The repo family

One repo per combination. The repo *is* the template, so GitHub's "Use this
template" works natively and a clone has no nesting to explain.

| Repo | For |
|---|---|
| **`astro-mapbox-basic`** | A page — marketing site, SEO market page, story map |
| `vite-mapbox-basic` | An app — internal tool, dashboard, full-screen interactive *(later)* |
| `astro-maplibre-basic` | No-token tiles *(later)* |

## What you get

**Ten kit components** over a full-bleed Mapbox Outdoors map, in a fixed layout
grammar: `HeadlineBlock`, `CounterStrip`, `ControlStack`, `TimePanel`,
`LegendCanvas`, `HintToast`, `StoryPin`, `StoryCard`, `Chip`, `StampMark`. See
[docs/COMPONENTS.md](docs/COMPONENTS.md).

**A three-file theme.** Every visual value in the project lives in `src/theme/`.
Re-theming is replacing three files, with zero component changes. See
[docs/THEME.md](docs/THEME.md).

**A frozen data contract.** `src/data/schema.ts` (zod 4) is the seam that lets data
work and shell work proceed in parallel. See [DATA.md](DATA.md).

**A seven-phase build system** for running the work with AI agents. See
[docs/PHASES.md](docs/PHASES.md) and [CLAUDE.md](CLAUDE.md).

## The gate

`npm run ci` — seven checks, no accounts, no tokens, no network beyond npm.

| Check | What it refuses to let through |
|---|---|
| `typecheck` | `tsc --noEmit` |
| `check:toolchain` | git too old for lefthook, missing gitleaks, uninstalled hooks |
| `check:tokens` | colour literals outside `src/theme/`, CSS-framework leaks in `kit/` |
| `check:data` | records that fail the frozen schema |
| `check:env` | env reads missing from `.env.example`, values in `.env.example`, tracked `.env` |
| `check:secrets` | gitleaks across the working tree |
| `check:dist` | secret tokens inlined into the shipped bundle |

`predeploy` runs `ci`, so `npm run deploy` physically cannot ship a red build.
GitHub Actions runs the identical command — one gate, one source of truth.

**`npm run test:sabotage`** runs four attacks in a throwaway git worktree and
asserts each is caught. A checklist is vigilance; a failing test is machinery. See
[docs/SECRETS.md](docs/SECRETS.md).

**`npm run test:visual`** builds and drives the result with Playwright — 20
assertions across desktop and mobile.

## Stack

Astro 7 · React 19 islands · mapbox-gl 3 (no wrapper) · zod 4 · plain CSS custom
properties (no framework) · lefthook + gitleaks · Playwright · Cloudflare Workers
static assets via wrangler. Node pinned to 24.19.0 in `.nvmrc`.

## Attribution

Mapbox requires visible attribution on every map. `MapRoot` enables Mapbox's
`attributionControl` by default — leave it on, and check Mapbox's current terms
before changing anything about it.

## Licence

MIT.
