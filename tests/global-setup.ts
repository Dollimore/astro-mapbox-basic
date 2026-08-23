import { execSync } from 'node:child_process';

/**
 * Astro 7 daemonizes `astro dev` and `astro preview` when not attached to a TTY:
 * the command spawns a background server and the foreground process exits
 * immediately. Playwright's `webServer` interprets that as "process exited
 * early" and aborts every run. So we drive Astro's own lifecycle instead.
 *
 * We preview the BUILT output rather than the dev server — the visual gate
 * should test the artifact that actually ships.
 */
const PORT = Number(process.env.PORT ?? 4321);

async function waitForServer(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Preview server never became ready at ${url}`);
}

export default async function globalSetup() {
  try {
    execSync('npx astro preview stop', { stdio: 'ignore' });
  } catch {
    // nothing was running
  }
  execSync(`npx astro preview --port ${PORT}`, { stdio: 'ignore' });
  await waitForServer(`http://localhost:${PORT}/`);
}
