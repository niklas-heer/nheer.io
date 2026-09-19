import { test, expect, type Locator } from '@playwright/test';
import { existsSync } from 'node:fs';

// The gallery deliberately exists only in sample/draft builds.
test.skip(!existsSync('dist/component-preview/index.html'), 'Component gallery is excluded from live builds');

async function expectWholeDiagram(svg: Locator) {
  const bounds = await svg.evaluate((element: SVGSVGElement) => {
    const content = element.getBBox();
    const view = element.viewBox.baseVal;
    return {
      left: content.x - view.x, top: content.y - view.y,
      right: view.x + view.width - content.x - content.width,
      bottom: view.y + view.height - content.y - content.height,
    };
  });
  for (const margin of Object.values(bounds)) expect(margin).toBeGreaterThanOrEqual(8);
}

for (const width of [1280, 390]) {
  test(`article components render and remain usable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/component-preview/');
    const metrics = page.locator('[aria-labelledby="gallery-metrics-title"]');
    await expect(metrics).toContainText('1,200');
    await expect(metrics).toContainText('Not measured');
    await expect(metrics.locator('dd.value').nth(2)).toHaveText('0');
    const bars = page.locator('[aria-labelledby="gallery-comparison-title"] .track');
    expect(await bars.nth(2).locator('span').evaluate(el => el.getBoundingClientRect().width)).toBe(0);
    expect(await bars.nth(1).locator('span').evaluate(el => el.getBoundingClientRect().width) /
      await bars.nth(0).locator('span').evaluate(el => el.getBoundingClientRect().width)).toBeCloseTo(90 / 240, 2);

    for (const id of ['gallery-mermaid-flow', 'gallery-mermaid-sequence']) {
      const figure = page.locator(`[aria-labelledby="${id}-title"]`).first();
      await figure.scrollIntoViewIfNeeded();
      const svg = figure.locator('svg');
      await expect(svg).toBeVisible();
      await expect(svg).toHaveAttribute('role', 'img');
      await expect(svg).toHaveAttribute('aria-describedby', `${id}-description`);
      await expectWholeDiagram(svg);
      const expand = figure.getByRole('button', { name: /^(Expand|Fit) diagram$/ });
      await expect(expand).toBeEnabled();
      await expand.focus();
      await page.keyboard.press('Enter');
      await expect(expand).toHaveAttribute('aria-pressed', 'true');
      await expect(expand).toHaveText('Fit diagram');
      await expectWholeDiagram(svg);
      if (width === 390) expect(await figure.locator('[data-viewport]').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press('Space');
      await expect(expand).toHaveAttribute('aria-pressed', 'false');
      await expectWholeDiagram(svg);
      await figure.getByText('View Mermaid source', { exact: true }).click();
      await expect(figure.locator('[data-source]')).toBeVisible();
      await figure.screenshot({ path: test.info().outputPath(`${id}-${width}.png`) });
    }
    await page.getByText('Preview a diagram error', { exact: true }).click();
    const failure = page.locator('[aria-labelledby="gallery-mermaid-error-title"]').first();
    await failure.scrollIntoViewIfNeeded();
    await expect(failure.getByRole('status')).toContainText('could not be rendered');
    await expect(failure.locator('[data-source]')).toBeVisible();
    await expect(failure.locator('button')).toBeDisabled();
    expect(errors).toEqual([]);

    // Return through Astro's client navigation: the replacement elements must initialize.
    await page.getByRole('link', { name: 'Read the blog', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
    await page.goBack();
    const returned = page.locator('article-mermaid').first();
    await returned.scrollIntoViewIfNeeded();
    await expect(returned.locator('svg')).toBeVisible();
    await expect(returned.locator('button')).toBeEnabled();
    await expectWholeDiagram(returned.locator('svg'));
    expect(errors).toEqual([]);
  });
}

test('numbers, flows, and diagram descriptions survive without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/component-preview/');
  await expect(page.locator('[aria-labelledby="gallery-flow-title"]')).toContainText('Find the useful detail');
  await expect(page.locator('[aria-labelledby="gallery-metrics-title"]')).toContainText('Not measured');
  const diagram = page.locator('article-mermaid').first();
  await expect(diagram.locator('.description').first()).toContainText('Gather evidence');
  await diagram.getByText('View Mermaid source', { exact: true }).click();
  await expect(diagram.locator('pre')).toBeVisible();
  await expect(diagram.locator('button')).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});

test('articles without a diagram do not request the Mermaid renderer', async ({ page }) => {
  const scripts: string[] = [];
  page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
  await page.goto('/posts/');
  await page.getByRole('heading', { name: 'Blog', exact: true }).waitFor();
  expect(scripts.filter(url => /mermaid/i.test(url))).toEqual([]);
});

test('a renderer download failure preserves the explanation and source', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let blocked = false;
  await page.route('**/mermaid.core.*.js', route => { blocked = true; return route.abort(); });
  await page.goto('/component-preview/');
  const diagram = page.locator('article-mermaid').first();
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram.getByRole('status')).toContainText('could not be rendered');
  await expect(diagram.locator('[data-source]')).toBeVisible();
  await expect(diagram.locator('.description').first()).toContainText('Gather evidence');
  await expect(diagram.locator('button')).toBeDisabled();
  expect(blocked).toBe(true);
  expect(errors).toEqual([]);
});

test('fit includes every node when the renderer returns the clipped Arc viewBox', async ({ page }) => {
  // Recorded in Arc: viewBox [-100.7, -101.2, 452.877, 591.2], while visible
  // geometry ran from [8, 8] to [418, 554.2]. The right and bottom were cut off.
  await page.route('**/mermaid.core.*.js', route => route.fulfill({
    contentType: 'application/javascript',
    body: `export default {
      initialize() {},
      async render() { return { svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100.7 -101.2 452.877 591.2"><rect x="8" y="8" width="160" height="48"/><rect x="258" y="506.2" width="160" height="48"/><path d="M88 56L338 506.2" stroke="white"/></svg>' }; }
    };`,
  }));
  await page.goto('/component-preview/');
  const diagram = page.locator('article-mermaid').first();
  await diagram.scrollIntoViewIfNeeded();
  await expect(diagram.locator('button')).toBeEnabled();
  await expectWholeDiagram(diagram.locator('svg'));
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await diagram.getByRole('button', { name: 'Expand diagram' }).click();
    const viewport = diagram.locator('[data-viewport]');
    await viewport.evaluate(el => { el.scrollLeft = el.scrollWidth; });
    await diagram.getByRole('button', { name: 'Fit diagram' }).click();
    await expectWholeDiagram(diagram.locator('svg'));
    expect(await viewport.evaluate(el => ({ left: el.scrollLeft, overflow: el.scrollWidth > el.clientWidth + 1 }))).toEqual({ left: 0, overflow: false });
    const svgBox = (await diagram.locator('svg').boundingBox())!;
    const viewportBox = (await viewport.boundingBox())!;
    expect(svgBox.x).toBeGreaterThanOrEqual(viewportBox.x);
    expect(svgBox.x + svgBox.width).toBeLessThanOrEqual(viewportBox.x + viewportBox.width);
    expect(svgBox.y + svgBox.height).toBeLessThanOrEqual(viewportBox.y + viewportBox.height);
  }
});

for (const width of [1280, 768, 390, 320]) {
  test(`split layouts preserve their images and reading order at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    const page = await context.newPage();
    await page.goto('/component-preview/');
    for (const side of ['left', 'right']) {
      const split = page.locator(`#gallery-split-${side}`);
      await split.scrollIntoViewIfNeeded();
      const image = split.getByRole('img');
      await expect.poll(() => image.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
      await expect(image).toHaveAttribute('alt', /.+/);
      await expect(split.locator('figcaption')).toBeVisible();
      const copy = (await split.locator('.split-copy').boundingBox())!;
      const media = (await split.locator('.split-media').boundingBox())!;
      if (width <= 720) {
        expect(media.y).toBeGreaterThanOrEqual(copy.y + copy.height);
        expect(Math.abs(media.x - copy.x)).toBeLessThan(1);
      } else if (side === 'left') {
        expect(media.x + media.width).toBeLessThanOrEqual(copy.x);
      } else {
        expect(copy.x + copy.width).toBeLessThanOrEqual(media.x);
      }
      const imageBox = (await image.boundingBox())!;
      const naturalRatio = await image.evaluate((el: HTMLImageElement) => el.naturalWidth / el.naturalHeight);
      // Browsers round density-corrected srcset dimensions; allow a pixel-scale difference.
      expect(Math.abs(imageBox.width / imageBox.height / naturalRatio - 1)).toBeLessThan(0.01);
      const fullSize = split.getByRole('link', { name: /View the full-size/ });
      expect((await page.request.get((await fullSize.getAttribute('href'))!)).status()).toBe(200);
      await fullSize.focus();
      await expect(fullSize).toBeFocused();
      await split.screenshot({ path: test.info().outputPath(`split-${side}-${width}.png`) });
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await context.close();
  });
}
