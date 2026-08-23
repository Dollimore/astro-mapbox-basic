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
10. Fixtures for static-analysis checks must be ASSEMBLED AT RUNTIME, never written
    as literals. A plainly-written test payload is indistinguishable from a real
    violation, so the harness that proves a check works becomes the first thing
    that check fails on. Excluding the file by path leaves a hole a real violation
    can hide in. See scripts/checks/sabotage.ts for the pattern.
