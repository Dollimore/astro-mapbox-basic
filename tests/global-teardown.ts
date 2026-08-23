import { execSync } from 'node:child_process';

export default async function globalTeardown() {
  try {
    execSync('npx astro preview stop', { stdio: 'ignore' });
  } catch {
    // already stopped
  }
}
