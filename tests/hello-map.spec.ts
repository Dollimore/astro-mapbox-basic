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
    const box = (await page.getByTestId('map-root').boundingBox())!;
    const vp = page.viewportSize()!;
    expect(box.width).toBeGreaterThanOrEqual(vp.width - 1);
    expect(box.height).toBeGreaterThanOrEqual(vp.height - 1);
  });
});

test.describe('kit components', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-map-ready', 'true');
  });

  test('all ten components are present', async ({ page }) => {
    await expect(page.getByTestId('headline-block')).toBeVisible();
    await expect(page.getByTestId('counter-strip')).toBeVisible();
    await expect(page.getByTestId('control-stack')).toBeVisible();
    await expect(page.getByTestId('legend')).toBeVisible();
    await expect(page.getByTestId('time-panel')).toBeVisible();
    await expect(page.getByTestId('hint-toast')).toBeVisible();
    await expect(page.getByTestId('stamp')).toBeVisible();
    await expect(page.getByTestId('chip')).toHaveCount(1);
    const pins = await page.getByTestId('story-pin').count();
    expect(pins).toBeGreaterThan(0);
    expect(pins).toBeLessThanOrEqual(4);
  });

  test('panels sit in their grammar positions', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'mobile docks panels to a bottom sheet');
    const vp = page.viewportSize()!;

    const headline = (await page.getByTestId('headline-block').boundingBox())!;
    expect(headline.x).toBeLessThan(vp.width / 2);
    expect(headline.y).toBeLessThan(vp.height / 2);

    const controls = (await page.getByTestId('control-stack').boundingBox())!;
    expect(controls.x).toBeGreaterThan(vp.width / 2);
    expect(controls.y).toBeLessThan(vp.height / 2);

    const legend = (await page.getByTestId('legend').boundingBox())!;
    expect(legend.x + legend.width).toBeGreaterThan(vp.width / 2);
    expect(legend.y).toBeGreaterThan(vp.height / 2);

    const time = (await page.getByTestId('time-panel').boundingBox())!;
    expect(time.x).toBeLessThan(vp.width / 2);
    expect(time.y).toBeGreaterThan(vp.height / 2);
  });

  test('legend shows four status entries', async ({ page }) => {
    await expect(page.getByTestId('legend-item')).toHaveCount(4);
  });

  test('time panel scrubs and plays', async ({ page }) => {
    await expect(page.getByTestId('time-value')).toHaveText('2014');
    await page.getByTestId('time-slider').fill('2020');
    await expect(page.getByTestId('time-value')).toHaveText('2020');
    await page.getByTestId('time-play').click();
    await expect(page.getByTestId('time-play')).toHaveAttribute('data-playing', 'true');
  });

  test('ten sample features load', async ({ page }) => {
    await expect(page.getByTestId('feature-count')).toHaveText('10');
  });

  test('hint toast dismisses on first interaction', async ({ page }) => {
    await expect(page.getByTestId('hint-toast')).toBeVisible();
    // A keypress, not a click: the chrome layer overlays the canvas, so a
    // positional click asserts geometry rather than the dismiss behaviour.
    await page.keyboard.press('ArrowRight');
    await expect(page.getByTestId('hint-toast')).toHaveCount(0);
  });

  test('story pin opens its card', async ({ page }, testInfo) => {
    // Pins are projected into screen space from map coordinates, so on a 412px
    // viewport a given pin can land outside the visible area. Desktop only.
    test.skip(testInfo.project.name === 'mobile', 'pins may project off a narrow viewport');
    await page.getByTestId('story-pin').first().getByRole('button').click();
    await expect(page.getByTestId('story-pin-card').first()).toBeVisible();
  });

  test('clicking empty map does not open a story card', async ({ page }) => {
    await page.mouse.click(20, 400); // bypasses actionability; the chrome overlays the canvas
    await expect(page.getByTestId('story-card')).toHaveCount(0);
  });
});
