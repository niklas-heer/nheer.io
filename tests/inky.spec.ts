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
  await expect(mascot).toHaveAttribute('aria-expanded', 'false');
  await mascot.click();
  const bubble = page.locator('#inky-bubble');
  await expect(bubble).toHaveClass(/visible/);
  await expect(mascot).toHaveAttribute('aria-expanded', 'true');
  const first = (await page.locator('#inky-text').textContent())?.trim();
  expect(first).toBeTruthy();
  await mascot.click();
  const second = (await page.locator('#inky-text').textContent())?.trim();
  expect(second).not.toBe(first);
  // Clicking elsewhere closes the bubble; the octopus stays surfaced.
  await page.locator('h1').first().click();
  await expect(bubble).not.toHaveClass(/visible/);
  await expect(mascot).toHaveAttribute('aria-expanded', 'false');
  await expect(mascot).toHaveClass(/activated/);
  // Escape closes it too and leaves the keyboard on the mascot.
  await mascot.focus();
  await page.keyboard.press('Enter');
  await expect(bubble).toHaveClass(/visible/);
  await page.keyboard.press('Escape');
  await expect(bubble).not.toHaveClass(/visible/);
  await expect(mascot).toHaveAttribute('aria-expanded', 'false');
  await expect(mascot).toBeFocused();
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

test('the corner mascot is a still picture until the page has loaded', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  // Hold the animation back to observe the state every visitor starts in.
  let release: () => void = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(/octopus\.json/, async route => { await held; await route.continue(); });
  const scripts: string[] = [];
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
  await page.goto('/posts/', { waitUntil: 'domcontentloaded' });
  const poster = page.locator('#inky-mascot img.inky-poster');
  await expect(poster).toBeVisible();
  expect(await poster.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('#inky-container')).not.toHaveClass(/inky-animated/);
  // No script the page asks for up front carries the animation library.
  const html = await (await page.request.get('/posts/')).text();
  const eager = [...html.matchAll(/<script[^>]+src="([^"]+)"/g), ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map(match => match[1]);
  expect(eager.filter(url => /lottie/i.test(url))).toEqual([]);
  // He answers before the animation exists.
  await page.locator('#inky-mascot').click();
  await expect(page.locator('#inky-bubble')).toHaveClass(/visible/);
  release();
  await expect(page.locator('#inky-lottie svg')).toBeVisible();
  await expect(poster).toBeHidden();
  expect(scripts.some(url => /lottie/i.test(url))).toBe(true);
});

test('reduced motion keeps the corner mascot still and downloads no animation', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 844 } });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', request => { if (/octopus\.json|lottie/i.test(request.url())) requests.push(request.url()); });
  await page.goto('/posts/');
  const mascot = page.locator('#inky-mascot');
  await expect(mascot.locator('img.inky-poster')).toBeVisible();
  await mascot.hover();
  await mascot.click();
  await expect(page.locator('#inky-bubble')).toHaveClass(/visible/);
  await expect(page.locator('#inky-text')).not.toBeEmpty();
  await page.waitForTimeout(500);
  await expect(mascot.locator('img.inky-poster')).toBeVisible();
  expect(requests).toEqual([]);
  await context.close();
});

test('the corner mascot can be hidden, stays hidden and comes back', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/posts/');
  const container = page.locator('#inky-container');
  const show = page.getByRole('button', { name: 'Show Inky' });
  await expect(show).toBeHidden();
  // The control is reachable from the keyboard, right after the mascot.
  await page.locator('#inky-mascot').focus();
  await page.keyboard.press('Tab');
  const hide = page.getByRole('button', { name: 'Hide Inky' });
  await expect(hide).toBeFocused();
  await expect(hide).toHaveCSS('opacity', '1');
  await page.keyboard.press('Enter');
  await expect(container).toBeHidden();
  await expect(show).toBeFocused();

  // The choice survives a reload and client navigation, and loads no animation.
  const requests: string[] = [];
  page.on('request', request => { if (/octopus\.json/.test(request.url())) requests.push(request.url()); });
  await page.reload();
  await expect(container).toBeHidden();
  await expect(show).toBeVisible();
  await page.locator('main a[href*="saving-a-markdown-file"]').click();
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('#inky-container')).toBeHidden();
  await page.waitForTimeout(500);
  expect(requests).toEqual([]);

  await page.getByRole('button', { name: 'Show Inky' }).click();
  await expect(page.locator('#inky-container')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show Inky' })).toBeHidden();
  await expect(page.locator('#inky-mascot')).toBeFocused();
  await page.locator('#inky-mascot').click();
  await expect(page.locator('#inky-bubble')).toHaveClass(/visible/);
  await page.reload();
  await expect(page.locator('#inky-container')).toBeVisible();
  expect(errors).toEqual([]);
});

test('hiding the corner mascot works when storage is blocked', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage blocked', 'SecurityError'); },
    });
  });
  await page.goto('/posts/');
  await page.locator('#inky-mascot').hover();
  await page.getByRole('button', { name: 'Hide Inky' }).click();
  await expect(page.locator('#inky-container')).toBeHidden();
  // Without storage the choice still follows client navigation.
  await page.locator('main a[href*="saving-a-markdown-file"]').click();
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('#inky-container')).toBeHidden();
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

    const next = demo.getByRole('button', { name: 'Next →' });
    const prev = demo.getByRole('button', { name: '← Previous' });
    await expect(next).toBeEnabled();
    await expect(prev).toBeDisabled();

    await mascot.focus();
    await page.keyboard.press('Enter');
    await expect(demo).toHaveClass(/is-active/);
    const second = (await speech.textContent())?.trim();
    const seen = new Set([first, second]);
    await next.focus();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Enter');
      seen.add((await speech.textContent())?.trim());
    }
    // Five fallback jokes, each once, then an exhausted line.
    expect(seen.size).toBe(5);
    await expect(demo.locator('[data-inky-status]')).toContainText('Comment 5 of 5');
    await next.click();
    await expect(demo.locator('[data-inky-status]')).toContainText('All 5 comments used');
    // Previous walks back through what he already said.
    await prev.click();
    await expect(demo.locator('[data-inky-status]')).toContainText('Comment 5 of 5');
    for (let i = 0; i < 4; i++) await prev.click();
    await expect(speech).toHaveText(first!);
    await expect(prev).toBeDisabled();
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

test('on a heckled post the mascot follows the cursor and heckles the section under it', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/posts/2026/07/2026-07-17_saving-a-markdown-file/');
  const heckles: { section: string; comment: string }[] = await page
    .locator('#inky-heckles')
    .evaluate(el => JSON.parse(el.textContent ?? '[]'));
  expect(heckles.length).toBeGreaterThan(1);
  await expect(page.locator('#inky-lottie svg')).toBeVisible();
  const container = page.locator('#inky-container');
  await expect(container).toHaveClass(/inky-roaming/);

  const target = heckles.find(h => h.section !== 'intro')!;
  const heading = page.locator(`#${target.section}`);
  await heading.scrollIntoViewIfNeeded();
  await heading.hover();
  const bubble = page.locator('#inky-bubble');
  await expect(bubble).toHaveClass(/visible/);
  await expect(page.locator('#inky-text')).toHaveText(target.comment);
  await expect(page.locator('#inky-source')).toBeHidden();
  const top = await container.evaluate(el => parseFloat(getComputedStyle(el).top));
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThanOrEqual(844 - 200);

  // Entering the intro speaks its line; returning to the first section does not repeat it.
  const intro = heckles.find(h => h.section === 'intro')!;
  await page.locator('article h1').first().hover();
  await expect(page.locator('#inky-text')).toHaveText(intro.comment);
  await heading.hover();
  await page.waitForTimeout(300);
  await expect(page.locator('#inky-text')).toHaveText(intro.comment);
  // Clicking him still gives a news line, not a heckle.
  await page.locator('#inky-mascot').click();
  const spoken = (await page.locator('#inky-text').textContent())?.trim();
  expect(heckles.map(h => h.comment)).not.toContain(spoken);
  expect(errors).toEqual([]);
});
