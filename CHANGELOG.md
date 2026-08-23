# CHANGELOG

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
