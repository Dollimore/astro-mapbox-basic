# PLAN — [project name]

## The artifact
One sentence.

## The hero mechanic
The ten-second demo, described precisely.

## The data contract  ← THE SEAM. FROZEN AFTER APPROVAL.
- `src/data/schema.ts` contents (zod 4)
- One hand-written sample record
- Expected record count ± order of magnitude
- Sources list (with URLs) + verification notes

## The page shell
Which kit components, where. The CounterStrip primary number. Status accent
colours for the map canvas (the ONLY colours this project chooses).

## Phase assignments
Which phases run parallel (1+2 default), any project-specific checkpoints.

## Pre-flight checklist
- [ ] Mapbox pk token created + URL-restricted (include `:4321` for local dev)
- [ ] `wrangler.jsonc` name + compatibility_date set
- [ ] `npm run ci` green on a fresh clone
- [ ] `npm run test:sabotage` green
