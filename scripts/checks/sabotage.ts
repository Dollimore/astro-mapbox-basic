#!/usr/bin/env tsx
/**
 * Sabotage suite: prove the secrets machinery actually bites.
 * Every attack runs inside a throwaway git worktree so the real repo is never dirtied.
 * A sabotage test that PASSES when it should FAIL is itself a build failure.
 */
import { execSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, copyFileSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * A syntactically valid but entirely fake token, ASSEMBLED AT RUNTIME.
 *
 * It is built from fragments deliberately: the pre-commit `token-literal` rule
 * greps staged changes for a contiguous token-shaped string, so storing this as
 * a literal would make the sabotage suite unable to commit itself. Exempting the
 * file by path would have punched a hole a real token could hide in. Splitting
 * the string means no scanner — and no careless human — ever sees a token here.
 *
 * Payload decodes to {"u":"fakeuser"}. Never a real credential.
 */
const FAKE_SK = ['sk', 'ey', 'J1IjoiZmFrZXVzZXIiLCJhIjoiY2xmYWtlMDAwMDAwMDAwMDAwMDAwMDAwMCJ9', 'AAAAAAAAAAAAAAAAAAAAAA']
  .reduce((acc, part, i) => (i === 0 ? part : i === 1 ? `${acc}.${part}` : `${acc}${i === 2 ? '' : '.'}${part}`), '');

type Attack = {
  id: string;
  what: string;
  caughtBy: string;
  /** Mutate the sandbox, then return true if the defence caught it. */
  run: (dir: string) => boolean;
};

/**
 * Run a command in `dir`, inheriting the caller's environment.
 * NOT a login shell: `bash -lc` re-sources the user's profile and can put a
 * different (older) git on PATH than the one the developer actually uses,
 * which silently disables lefthook and makes every attack look uncaught.
 */
function sh(cmd: string, dir: string): { code: number; out: string } {
  const r = spawnSync('bash', ['-c', cmd], { cwd: dir, encoding: 'utf8', env: process.env });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const ATTACKS: Attack[] = [
  {
    id: 'S1',
    what: 'plant a fake sk. token in a staged commit',
    caughtBy: 'lefthook pre-commit',
    run: (dir) => {
      writeFileSync(join(dir, 'src/leak.ts'), `export const t = "${FAKE_SK}";\n`);
      sh('git add src/leak.ts', dir);
      const { code, out } = sh('git commit -m "sabotage S1"', dir);
      if (code === 0) console.error(`     commit SUCCEEDED. output:\n${out}`);
      return code !== 0; // caught == commit refused
    },
  },
];

function main() {
  const repo = process.cwd();
  const sandbox = mkdtempSync(join(tmpdir(), 'sabotage-'));
  let failures = 0;

  for (const attack of ATTACKS) {
    const dir = join(sandbox, attack.id);
    execSync(`git worktree add --detach "${dir}"`, { cwd: repo, stdio: 'ignore' });

    // The sandbox needs the CURRENT working-tree config, not whatever HEAD holds,
    // so an uncommitted defence can still be tested.
    for (const f of ['lefthook.yml', '.env.example', 'package.json']) {
      if (existsSync(join(repo, f))) copyFileSync(join(repo, f), join(dir, f));
    }
    if (!existsSync(join(dir, 'node_modules'))) {
      symlinkSync(join(repo, 'node_modules'), join(dir, 'node_modules'), 'dir');
    }
    // Hooks are per-worktree in modern git; install them into the sandbox.
    sh('npx lefthook install', dir);

    let caught = false;
    try {
      caught = attack.run(dir);
    } catch (err) {
      caught = false;
      console.error(`  ${attack.id} threw: ${(err as Error).message}`);
    }

    console.log(
      `${caught ? '✓' : '✗'} ${attack.id}  ${attack.what}\n     expected catcher: ${attack.caughtBy}`
    );
    if (!caught) failures++;

    execSync(`git worktree remove --force "${dir}"`, { cwd: repo, stdio: 'ignore' });
  }

  rmSync(sandbox, { recursive: true, force: true });

  if (failures > 0) {
    console.error(`\n✗ ${failures} sabotage attack(s) NOT caught. The machinery is not working.`);
    process.exit(1);
  }
  console.log(`\n✓ all ${ATTACKS.length} sabotage attack(s) caught.`);
}

main();
