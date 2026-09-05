import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

for (const viewport of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`theme works and survives navigation at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to light theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('[data-theme-toggle]')).toHaveCount(2);
    for (const toggle of await page.locator('[data-theme-toggle]').all()) {
      await expect(toggle).toHaveAttribute('aria-label', 'Switch to dark theme');
    }
    // A document marker distinguishes client navigation from a full reload.
    await page.evaluate(() => { (window as any).__navigationMarker = true; });
    for (const href of ['/about', '/posts', '/']) {
      await page.locator('main').evaluate((main, href) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = 'Test navigation';
        main.append(link);
      }, href);
      await page.getByRole('link', { name: 'Test navigation' }).click();
      await expect(page).toHaveURL(new RegExp(`${href}/?$`));
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
      await expect(page.locator('#nav-loading-bar')).not.toHaveClass(/(?:^|\s)(?:loading|complete)(?:\s|$)/);
    }
    expect(await page.evaluate(() => (window as any).__navigationMarker)).toBe(true);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });
}

test('theme remains usable when storage is blocked', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() { throw new DOMException('Storage blocked', 'SecurityError'); },
    });
  });
  await page.goto('/posts');
  await page.getByRole('button', { name: 'Switch to light theme' }).click();
  await page.locator('header a[href="/"]').first().click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(errors).toEqual([]);
});

test('scroll controls work after revisiting a post', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/posts');
  const post = page.locator('main a[href^="/posts/"]').first();
  const href = await post.getAttribute('href');
  expect(href).toBeTruthy();
  for (let visit = 0; visit < 2; visit++) {
    await page.locator(`main a[href="${href}"]`).first().click();
    await expect(page.locator('#reading-progress-bar')).toBeAttached();
    await expect(page.locator('#nav-loading-bar')).toHaveClass('nav-loading-bar');
    // Lazy images can change the page height after navigation.
    await expect.poll(async () => {
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      return page.locator('#reading-progress-bar').evaluate((bar) => parseFloat((bar as HTMLElement).style.width));
    }).toBeCloseTo(100, 0);
    await expect(page.locator('#back-to-top')).toBeVisible();
    await expect(page.locator('#reading-progress-bar')).toHaveAttribute('style', /width: 100%/);
    await page.getByRole('button', { name: 'Back to top' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('#reading-progress-bar')).toHaveAttribute('style', /width: 0%/);
    await page.getByRole('link', { name: 'Back to all posts' }).click();
    await expect(page).toHaveURL(/\/posts\/?$/);
  }
});

test('draft reviews are absent from the production build', async ({ request }) => {
  const root = 'src/content/reviews';
  const drafts = readdirSync(root, { recursive: true })
    .map(String)
    .filter((file) => file.endsWith('.md') && /^draft: true$/m.test(readFileSync(join(root, file), 'utf8')));
  expect(drafts.length).toBeGreaterThan(0);
  for (const file of drafts) {
    const slug = file.replace(/\.md$/, '');
    expect(existsSync(join('dist/reviews', slug, 'index.html'))).toBe(false);
    const response = await request.get(`/reviews/${slug}/`);
    expect(response.status()).toBe(404);
  }
});

test('podcast snapshots are labeled and populated data has working categories', async ({ page, request }) => {
  const report = await (await request.get('/build-health.json')).json();
  await page.goto('/podcasts');
  await expect(page.getByRole('heading', { name: 'Podcasts', exact: true })).toBeVisible();
  expect(['fixture', 'live']).toContain(report.source);
  await expect(page.locator('[data-podcast-freshness]')).toContainText('Last data update:');
  if (report.source === 'fixture') {
    await expect(page.getByText('Preview: sample data for automated tests.', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Currently Listening' })).toBeVisible();
  } else {
    const { assertLiveSnapshot } = await import('../src/utils/podcast-health.mjs');
    assertLiveSnapshot(report);
  }
  const category = page.locator('details.category-group').first();
  await expect(category).toHaveAttribute('open', '');
  await category.locator('summary').click();
  await expect(category).not.toHaveAttribute('open');
  await category.locator('summary').click();
  await expect(category).toHaveAttribute('open', '');
  await expect(category.locator('a').first()).toBeVisible();
});

test('published interactive articles appear in the blog, feed, and homepage', async ({ request }) => {
  const root = 'src/content/posts/2026';
  const articles = readdirSync(root).filter(file => {
    const content = readFileSync(join(root, file), 'utf8');
    return content.includes('import StoryLab') && /^draft: false$/m.test(content);
  });
  expect(articles.length).toBeGreaterThanOrEqual(6);
  expect((await request.get('/drafts/')).status()).toBe(404);
  const feed = await (await request.get('/rss.xml')).text();
  const index = await (await request.get('/posts/')).text();
  const home = await (await request.get('/')).text();
  for (const file of articles) {
    const content = readFileSync(join(root, file), 'utf8');
    const date = content.match(/^date: "(\d{4})-(\d{2})/m)!;
    const slug = file.replace(/\.mdx$/, '');
    const url = `/posts/${date[1]}/${date[2]}/${slug}/`;
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<story-lab');
    expect(index).toContain(url);
    expect(feed).toContain(slug);
  }
  for (const slug of ['2026-09-04_projector-racing', '2026-08-23_shell-two-pipelines', '2026-08-06_small-python-cli']) {
    expect(home).toContain(slug);
  }
});
