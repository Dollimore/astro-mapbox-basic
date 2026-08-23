#!/usr/bin/env tsx
/**
 * check:toolchain — refuse to trust an environment we cannot verify.
 *
 * This exists because of a real failure: a git 2.23.0 earlier on PATH than a
 * modern one makes lefthook bail with "Git version is too old", fail to find
 * its own config, and silently skip every pre-commit hook. The commit succeeds.
 * Nothing warns you. The entire secrets layer is absent while appearing present.
 *
 * A defence you cannot verify is not a defence.
 */
import { spawnSync } from 'node:child_process';

const MIN_GIT = [2, 31, 0] as const;

function run(cmd: string, args: string[]): { code: number; out: string } {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  return { code: r.status ?? 1, out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}

function parseSemver(s: string): [number, number, number] | null {
  const m = s.match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function gte(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < 3; i++) {
    if ((a[i] ?? 0) > (b[i] ?? 0)) return true;
    if ((a[i] ?? 0) < (b[i] ?? 0)) return false;
  }
  return true;
}

const errors: string[] = [];

// 1 · git must be new enough for lefthook, and it must be the git on PATH.
const git = run('git', ['--version']);
if (git.code !== 0) {
  errors.push('git is not on PATH.');
} else {
  const v = parseSemver(git.out);
  const which = run('bash', ['-c', 'command -v git']).out;
  if (!v) {
    errors.push(`cannot parse git version from "${git.out}".`);
  } else if (!gte(v, MIN_GIT)) {
    errors.push(
      `git ${v.join('.')} at ${which} is older than ${MIN_GIT.join('.')}. ` +
        'lefthook silently skips ALL hooks below this version, which disables the ' +
        'commit-time secrets layer without any warning. Put a newer git first on PATH.'
    );
  } else {
    console.log(`  git ${v.join('.')} at ${which}`);
  }
}

// 2 · gitleaks must exist — check:secrets and the pre-commit hook both need it.
const gl = run('gitleaks', ['version']);
if (gl.code !== 0) {
  errors.push('gitleaks is not on PATH. Install it: brew install gitleaks');
} else {
  console.log(`  gitleaks ${gl.out.split('\n')[0]}`);
}

// 3 · hooks must actually be installed in this clone.
const hookPath = run('git', ['rev-parse', '--git-path', 'hooks/pre-commit']).out;
const hookExists = run('bash', ['-c', `test -x "${hookPath}"`]).code === 0;
if (!hookExists) {
  errors.push(
    `no executable pre-commit hook at ${hookPath}. Run: npx lefthook install`
  );
} else {
  console.log(`  pre-commit hook installed`);
}

if (errors.length) {
  console.error('✗ check:toolchain failed:');
  for (const e of errors) console.error(`  · ${e}`);
  process.exit(1);
}
console.log('✓ check:toolchain — git, gitleaks, and hooks all verified.');
