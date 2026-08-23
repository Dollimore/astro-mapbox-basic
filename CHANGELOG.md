# CHANGELOG

## v0.2 — 2026-08-24

Second theme, proving the theme system: a full semantic light/dark re-skin with
**zero changes to any existing kit component**. Everything visual lives in
`src/theme/`, and re-pointing that folder re-skinned the product.

- Semantic token layer: canvas/raised/sunken/stroke/primary/strong/subtle plus
  info/success/alert/danger triads, flipped by `[data-mode]`. Status colours ride
  it, so they re-tune between the 700-step in light and the 300-step in dark.
- New components: `DetailSidebar` (floating left panel, 1rem inset, 1rem radius),
  `StatTile`, `Gauge`. Thirteen components total.
- Mode toggle by composition through `ControlStack`; the basemap follows the mode.

Bugs found by looking at pixels rather than trusting green tests:

- **mapbox-gl parses CSS Color Level 3 only.** The oklch palette rendered
  correctly in the DOM — the legend was right — while the map refused it and
  dropped every circle. Colours are rasterised through a canvas pixel; reading
  back `ctx.fillStyle` is not enough, Chrome re-serialises oklch as oklch.
- **`setStyle` broke dark mode invisibly.** The layer was present, on top,
  correctly coloured, ten features rendered — and nothing painted. The map is now
  rebuilt for the new mode, preserving the viewport.
- **60% panel fill is unreadable over live tiles.** The source theme's value is
  kept verbatim as `--panel-fill`; map chrome uses `--panel-fill-map` at 92%.
- **Mobile legend covered the time panel's play button.**
- **`smoke:dev` added.** Every test ran against `astro preview`, so a stale Vite
  dep cache 504'd mapbox-gl on the dev server and killed hydration while the suite
  stayed green. `curl` returning 200 on the HTML proves nothing about the client.

## v0.1 — 2026-08-23

First release. Ten kit components over a live Mapbox Outdoors map, a three-file
theme, seven networkless checks, and four sabotage tests that prove the secrets
machinery bites.

Notable things found while building it, all now guarded:

- **`check:toolchain` added (a seventh check).** lefthook silently skips *every*
  hook when git is older than 2.31.0 — the commit-time secrets layer is absent
  while appearing present, and `git commit` reports success.
- **gitleaks ships no Mapbox rule.** Without `.gitleaks.toml`, the pre-commit regex
  was the sole defence while looking like one of two layers.
- **Fixtures must be assembled at runtime.** A plainly-written test payload is
  indistinguishable from a real violation, so the sabotage harness became the first
  thing its own checks failed on.
- **Astro 7 daemonizes `dev` and `preview`** when not attached to a TTY, which
  Playwright reads as "webServer exited early". The visual gate drives Astro's own
  lifecycle from `globalSetup`/`globalTeardown` and tests the built output.
- **`strictPort` is on.** Astro silently moving to the next free port meant
  Playwright once ran an entire suite against an unrelated project's website.
- **Theme colours read in a render body resolve to `transparent`.** CSS custom
  properties are not available until the stylesheet applies; `useStatusColours()`
  resolves after mount.
