import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

const hasGallery = existsSync('dist/component-preview/index.html');

test('the corner mascot mounts once on wide screens and answers clicks', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let animationRequests = 0;
  page.on('request', request => { if (/octopus\.json/.test(request.url())) animationRequests += 1; });
  await page.goto('/posts/');
  const octopus = page.locator('#inky-lottie svg');
  await expect(octopus).toBeVisible();
  const mascot = page.locator('#inky-mascot');
  await mascot.click();
  const bubble = page.locator('#inky-bubble');
  await expect(bubble).toHaveClass(/visible/);
  const first = (await page.locator('#inky-text').textContent())?.trim();
  expect(first).toBeTruthy();
  await mascot.click();
  const second = (await page.locator('#inky-text').textContent())?.trim();
  expect(second).not.toBe(first);
  // Clicking elsewhere closes the bubble; the octopus stays surfaced.
  await page.locator('h1').first().click();
  await expect(bubble).not.toHaveClass(/visible/);
  await expect(mascot).toHaveClass(/activated/);
  expect(animationRequests).toBe(1);

  // Client navigation replaces the document; the replacement must initialize too.
  await page.locator('main a[href*="saving-a-markdown-file"]').click();
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('#inky-lottie svg')).toBeVisible();
  await page.locator('#inky-mascot').click();
  await expect(page.locator('#inky-bubble')).toHaveClass(/visible/);
  expect(animationRequests).toBe(2);
  expect(errors).toEqual([]);
});

test('narrow screens never download the animation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', request => { if (/octopus\.json|lottie/i.test(request.url())) requests.push(request.url()); });
  await page.goto('/posts/');
  await page.getByRole('heading', { name: 'Blog', exact: true }).waitFor();
  await expect(page.locator('#inky-container')).toBeHidden();
  expect(requests).toEqual([]);
});

for (const width of [1280, 390]) {
  test(`the inline demo works with the keyboard at ${width}px`, async ({ page }) => {
    test.skip(!hasGallery, 'Component gallery is excluded from live builds');
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/component-preview/');
    const demo = page.locator('inky-demo');
    await demo.scrollIntoViewIfNeeded();
    const mascot = demo.getByRole('button', { name: 'Ask Inky for the next comment' });
    await expect(mascot).toBeEnabled();
    await expect(demo.locator('[data-inky-lottie] svg')).toBeVisible();
    const speech = demo.locator('[data-inky-speech]');
    const first = (await speech.textContent())?.trim();
    expect(first).toBeTruthy();

    await mascot.focus();
    await page.keyboard.press('Enter');
    await expect(demo).toHaveClass(/is-active/);
    const seen = new Set([first, (await speech.textContent())?.trim()]);
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Space');
      seen.add((await speech.textContent())?.trim());
    }
    // Five fallback jokes, each once, then an exhausted line.
    expect(seen.size).toBe(5);
    await expect(demo.locator('[data-inky-status]')).toContainText('Comment 5 of 5');
    await page.keyboard.press('Enter');
    await expect(demo.locator('[data-inky-status]')).toContainText('All 5 comments used');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('the inline demo keeps its first line and poster without JavaScript', async ({ browser }) => {
  test.skip(!hasGallery, 'Component gallery is excluded from live builds');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/component-preview/');
  const demo = page.locator('inky-demo');
  await expect(demo.locator('[data-inky-speech]')).not.toBeEmpty();
  await expect(demo.locator('img.poster')).toBeVisible();
  await expect(demo.getByRole('button', { name: 'Ask Inky for the next comment' })).toBeDisabled();
  await context.close();
});

test('reduced motion keeps the poster and skips the animation download', async ({ browser }) => {
  test.skip(!hasGallery, 'Component gallery is excluded from live builds');
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1000, height: 844 } });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', request => { if (/octopus\.json/.test(request.url())) requests.push(request.url()); });
  await page.goto('/component-preview/');
  const demo = page.locator('inky-demo');
  await demo.scrollIntoViewIfNeeded();
  const mascot = demo.getByRole('button', { name: 'Ask Inky for the next comment' });
  await expect(mascot).toBeEnabled();
  await mascot.click();
  await expect(demo).toHaveClass(/is-active/);
  await expect(demo.locator('img.poster')).toBeVisible();
  expect(requests).toEqual([]);
  await context.close();
});
