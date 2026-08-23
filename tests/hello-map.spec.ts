import { test, expect } from '@playwright/test';

test.describe('hello-map', () => {
  test('map loads with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');

    await expect(page.getByTestId('map-root')).toBeVisible();
    await expect(page.getByTestId('map-error')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-map-ready', 'true');
    await expect(page.locator('.mapboxgl-canvas')).toBeVisible();

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('map fills the viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-map-ready', 'true');
    const box = await page.getByTestId('map-root').boundingBox();
    const vp = page.viewportSize()!;
    expect(box!.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(box!.height).toBeGreaterThanOrEqual(vp.height - 1);
  });
});
