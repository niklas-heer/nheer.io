import { test, expect } from '@playwright/test';

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
      const expand = figure.getByRole('button', { name: /^(Expand|Fit) diagram$/ });
      await expect(expand).toBeEnabled();
      await expand.focus();
      await page.keyboard.press('Enter');
      await expect(expand).toHaveAttribute('aria-pressed', 'true');
      await expect(expand).toHaveText('Fit diagram');
      if (width === 390) expect(await figure.locator('[data-viewport]').evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.keyboard.press('Space');
      await expect(expand).toHaveAttribute('aria-pressed', 'false');
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
