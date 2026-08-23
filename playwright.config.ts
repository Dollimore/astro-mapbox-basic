import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.PORT ?? 4321);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: { baseURL, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    // Pixel 7 is Chromium-based, so a forker downloads one browser, not two.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  // No `webServer`: Astro 7 daemonizes dev/preview, which Playwright reads as
  // "process exited early". global-setup drives Astro's own lifecycle instead.
  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',
});
