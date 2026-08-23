#!/usr/bin/env tsx
/**
 * smoke:dev — load the DEV server in a real browser and fail on any console
 * error or failed request.
 *
 * This exists because of a real miss: every test ran against `astro preview`
 * (the production build), so a stale Vite dep-optimisation cache broke the dev
 * server with a 504 on mapbox-gl and killed hydration, while the whole suite
 * stayed green. `curl` returning 200 on the HTML proves nothing — the failure
 * was entirely client-side.
 *
 * Adding a dependency mid-session is what invalidates that cache. If this
 * fails with "Outdated Optimize Dep", delete node_modules/.vite and restart.
 */
import { execSync, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4321);
const URL = `http://localhost:${PORT}`;

function sh(cmd: string) {
  return spawnSync('bash', ['-c', cmd], { encoding: 'utf8', env: process.env });
}

async function waitFor(url: string, ms = 45_000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`dev server never became ready at ${url}`);
}

async function main() {
  sh('npx astro dev stop');
  sh(`PORT=${PORT} npx astro dev`);
  await waitFor(`${URL}/`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const problems: string[] = [];

  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text().slice(0, 160)}`); });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message.slice(0, 160)}`));
  page.on('requestfailed', (r) => problems.push(`requestfailed: ${r.url().slice(0, 100)}`));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url().slice(0, 100)}`); });

  await page.goto(URL, { waitUntil: 'networkidle' });

  let ready: string | null = null;
  for (let i = 0; i < 60; i++) {
    ready = await page.locator('html').getAttribute('data-map-ready');
    if (ready === 'true') break;
    await page.waitForTimeout(500);
  }
  await page.waitForTimeout(2000);

  if (ready !== 'true') problems.push('the map never became ready — the island did not hydrate');

  await browser.close();
  try {
    execSync('npx astro dev stop', { stdio: 'ignore' });
  } catch {
    // already stopped
  }

  if (problems.length) {
    console.error(`✗ smoke:dev — ${problems.length} problem(s) on the dev server:`);
    for (const p of problems) console.error(`  · ${p}`);
    process.exit(1);
  }
  console.log('✓ smoke:dev — dev server hydrates clean: no console errors, no failed requests.');
}

main().catch((err) => {
  console.error(`✗ smoke:dev — ${(err as Error).message}`);
  try { execSync('npx astro dev stop', { stdio: 'ignore' }); } catch { /* noop */ }
  process.exit(1);
});
