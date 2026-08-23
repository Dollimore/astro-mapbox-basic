# DATA — bring your own

## Accepted inputs

GeoJSON (preferred), CSV with lat/lng columns, or a JSON array of records. One
entity type per file. Files stay under ~2 MB committed; anything bigger gets tiled
(tippecanoe → PMTiles on R2) as an explicit PLAN.md decision, never an improvisation.

## The three-step loop

1. Drop your file(s) into `src/data/`.
2. Describe them in `src/data/schema.ts` — copy the shipped example and rename the
   fields. **This project uses zod 4**, whose API differs from the zod 3 idioms in
   wide circulation: `z.url()` replaces `z.string().url()`.
3. Run `npm run check:data` and iterate until green. Green means the whole kit —
   layers, legend, counters — can trust every record.

## The sample contract

Keep `sample.json` as 5–10 real records. Phase 2 builds against the sample, which is
what makes Phase 1 and Phase 2 safe to run in parallel.

## Provenance

Write the source — URL, export date, licence — at the top of this file's project
section as you use it. Future-you and your readers' trust depend on it.

## No data yet?

Then and only then, Phase 1 Mode B: build an acquisition pipeline in
`data-pipeline/` (created on demand, `raw/` gitignored).
