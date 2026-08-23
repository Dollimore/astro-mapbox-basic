# PHASES — the repeatable build

**The law:** one phase = one worktree = one PR = one checkpoint = one human review.
No merge without a passing checkpoint. No agent works across two phases.

**The only permitted parallelism is Phase 1 ∥ Phase 2.** It is safe because Phase 2
builds against `sample.json`, which conforms to the schema frozen in Phase 0 — so
when Phase 1's real data lands, the shell already works. The schema is the seam.
Phases 3→4→5→6 are strictly sequential; each consumes the previous phase's output.

---

**Phase 0 — Brief + Plan** *(human + AI chat, no agents)*
Two documents, in order. First **BRIEF.md** — the plain-language interview: WHY the
map exists, WHO it's for, WHAT goes on it. Then hand BRIEF.md to the AI to produce
**PLAN.md** — the engineering plan, including the critical act: freezing
`src/data/schema.ts` and `sample.json`. Output: both files approved and committed.
*Nothing else exists until this does.*

**Phase 1 — Data** *(worktree `phase-1-data`; two modes, BYO is the default)*
**Mode A — bring your own data:** drop files into `src/data/`, adjust `schema.ts` to
describe them, run the validate loop until green. See DATA.md. No pipeline folder
needs to exist.
**Mode B — acquisition pipeline:** build `data-pipeline/build-data.ts` — acquire raw
sources → clean → validate against schema → write `src/data/`. Log provenance in
`data-pipeline/README.md`.
**Checkpoint:** `npm run check:data` passes — every record validates, counts within
expected magnitude, bounds sane.

**Phase 2 — Shell** *(worktree `phase-2-shell`; runs PARALLEL with Phase 1)*
Page structure, theme applied, kit components placed with real copy — headline,
subline, legend items, counter labels.
**Checkpoint:** builds clean, `check:tokens` passes, `npm run test:visual` green,
human eyeballs the screenshot.

**Phase 3 — Map layers** *(worktree `phase-3-layers`, after 1+2 merge)*
`MapRoot` plus one file per data layer, legend wired to real layers, status accents
per PLAN.md.
**Checkpoint:** preview shows every feature class; the legend is true; mobile
viewport not broken.

**Phase 4 — Hero mechanic** *(worktree `phase-4-hero`)*
The slider / click-cards / odometer — `src/components/map/interactions/` only.
**Checkpoint:** the ten-second demo is literally recordable — a 10s capture the
human approves.

**Phase 5 — Cold-visitor polish** *(worktree `phase-5-polish`)*
`HintToast` wired, `StoryPin`s placed, OG image and meta, Mapbox attribution, perf
pass (lazy map init, data fetch size).
**Checkpoint:** Cold-Visitor checklist ticked, screenshot test, Lighthouse sanity
(>90 perf on the shell).

**Phase 6 — Ship** *(worktree `phase-6-ship`)*
README with fork instructions and data provenance summary, `npm run check:ship`
clean, `npm run deploy`, custom domain.
**Checkpoint:** `check:ship` output and the live URL.
