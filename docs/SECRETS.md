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
- **URL-restrict that token in the Mapbox dashboard.** Include your dev port:
  restrictions default to ports 80 and 443, and this template's dev server runs on
  4321, so `http://localhost` alone will 403 every tile request.
- A leaked restricted `pk` token is inert. That is the design, not a consolation.
- `sk` tokens live only in pipeline env. They are never referenced by `src/`.
- A literal token string anywhere in the repo is a failed task **even if it works**.

## check:dist — the one everyone misses

Bundlers inline env vars. A carelessly-referenced secret ships to the world inside
your JavaScript. `check:dist` builds and scans `dist/`. A `pk.` token there is
expected and fine. An `sk.` match is instant, loud failure.

## check:toolchain — a defence you cannot verify is not a defence

`lefthook` silently skips **every hook** when git is older than 2.31.0: it bails,
fails to locate its own config, and `git commit` reports success. Nothing warns
you. The entire commit-time layer is absent while appearing present. `check:toolchain`
verifies git's version, that gitleaks is on PATH, and that the pre-commit hook is
actually installed in this clone.

## Never paste a token into a chat

Not into an issue, a PR description, a Slack message, or an AI transcript. The
machinery above guards the *code* path; a human pasting a credential into a chat
window walks around all of it. Put it in `.env` — gitignored from the first
commit — and tell the agent it is there.

## Writing your own checks

Fixtures must be **assembled at runtime**, never written as literals. A static
scanner cannot tell a test payload from a real violation, so a plainly-written
fixture makes the check fail on the very harness that proves it works. The
tempting fix — excluding the file by path — leaves a hole a real secret can hide
in. See `scripts/checks/sabotage.ts` for both patterns.

## Proving it works

`npm run test:sabotage` runs four attacks in a throwaway git worktree and asserts
each is caught:

| # | Attack | Caught by |
|---|---|---|
| S1 | Plant a fake `sk.` token in a staged commit | lefthook pre-commit |
| S2 | Reference that token in code, then build | `check:dist` finding it in the bundle |
| S3 | Read an env var absent from `.env.example` | `check:env` |
| S4 | Put a non-empty value in `.env.example` | `check:env` |

Run it after any change to the secrets layer. A checklist is vigilance; a failing
test is machinery.
