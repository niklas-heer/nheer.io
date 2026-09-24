import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { initReadingFilters } from '../src/utils/reading-filters';

test('page views are rendered in HTML and follow client navigation', async ({ page, request }) => {
  test.skip(!readFileSync('dist/index.html', 'utf8').includes('data-page-views'), 'View counts disabled');
  const fixture = (await (await request.get('/build-health.json')).json()).pageViews.source === 'fixture';
  await page.goto('/');
  await expect(page.locator('[data-page-views]')).toContainText(fixture ? '1,234 views on this page' : /[0-9,]+ views? on this page/);
  await page.locator('.nav-menu-container').hover();
  await page.locator('header a[href="/posts"]').first().click();
  await expect(page.locator('[data-page-views]')).toContainText(fixture ? '1 view on this page' : /[0-9,]+ views? on this page/);
  await page.locator('.nav-menu-container').hover();
  await page.locator('header a[href="/about"]').first().click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await expect(page.locator('[data-page-views]')).toBeVisible();
  expect(await page.locator('script[src*="insights/script"]').count()).toBe(0);
  await page.goto('/missing-page-counter-test');
  await expect(page.locator('[data-page-views]')).toHaveCount(0);
});

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

test('reading filters combine title, author and year and reset accessibly', async ({ page }) => {
  // A fixed shelf exercises the production filter function without account data.
  const shelf = `<section data-reading-list>
    <div class="reading-filters" hidden>
      <input aria-label="Search books" data-book-search>
      <select aria-label="Year" data-book-year><option value="">All years</option><option>2026</option><option>2025</option></select>
      <button data-clear-filters>Clear filters</button><p role="status" data-reading-results></p>
    </div>
    <div class="year-group" data-reading-year="2026">
      <div class="month-group"><a data-book-search-text="Clean Code Robert Martin">Clean Code</a></div>
      <div class="month-group"><a data-book-search-text="Germinal Émile Zola">Germinal</a></div>
    </div>
    <div class="year-group" data-reading-year="2025">
      <div class="month-group"><a data-book-search-text="Clean Architecture Robert Martin">Clean Architecture</a></div>
    </div>
  </section>`;
  await page.setContent(shelf);
  await page.evaluate(initReadingFilters);
  const search = page.getByRole('textbox', { name: 'Search books' });
  const year = page.getByRole('combobox', { name: 'Year' });
  const visibleBooks = page.locator('[data-book-search-text]:visible');
  await expect(page.getByRole('status')).toHaveText('3 books shown');
  await search.fill('  ROBERT   clean ');
  await expect(visibleBooks).toHaveText(['Clean Code', 'Clean Architecture']);
  await year.selectOption('2025');
  await expect(visibleBooks).toHaveText(['Clean Architecture']);
  await expect(page.locator('[data-reading-year="2026"]')).toBeHidden();
  await expect(page.getByRole('status')).toHaveText('1 book shown');
  await year.selectOption('');
  await search.fill('GERMINAL emile');
  await expect(visibleBooks).toHaveText(['Germinal']);
  await search.fill('no such book');
  await expect(visibleBooks).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('No books match');
  await year.selectOption('2025');
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(search).toHaveValue('');
  await expect(search).toBeFocused();
  await expect(year).toHaveValue('');
  await expect(visibleBooks).toHaveCount(3);
  await search.fill('zola');
  await page.evaluate(initReadingFilters);
  await expect(visibleBooks).toHaveText(['Germinal']);
  await page.evaluate((init) => {
    document.addEventListener('astro:page-load', new Function(`return (${init})()`) as EventListener);
  }, initReadingFilters.toString());
  await page.locator('body').evaluate((body, html) => { body.innerHTML = html; }, shelf);
  await page.evaluate(() => document.dispatchEvent(new Event('astro:page-load')));
  await expect(visibleBooks).toHaveCount(3);
  await search.fill('architecture');
  await expect(visibleBooks).toHaveText(['Clean Architecture']);
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

test('the homepage terminal runs commands, keeps history and navigates', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const input = page.getByRole('textbox', { name: /type a command/i });
  const history = page.locator('[data-terminal-history]');
  await input.fill('help');
  await input.press('Enter');
  await expect(history).toContainText('open a section');
  await input.fill('nonsense');
  await input.press('Enter');
  await expect(history).toContainText('command not found: nonsense');
  await input.press('ArrowUp');
  await expect(input).toHaveValue('nonsense');
  await input.fill('c');
  await input.press('Tab');
  await expect(input).toHaveValue('cd ');
  await input.fill('cd blog');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/posts\/?$/);
  expect(errors).toEqual([]);
});

test('the homepage social links include Bluesky and each carries an icon', async ({ page }) => {
  await page.goto('/');
  const socials = page.getByRole('list', { name: 'Elsewhere' });
  const bluesky = socials.getByRole('link', { name: 'Bluesky' });
  await expect(bluesky).toHaveAttribute('href', 'https://bsky.app/profile/nheer.bsky.social');
  await expect(bluesky).toHaveAttribute('rel', /noopener/);
  for (const link of await socials.getByRole('link').all()) {
    await expect(link.locator('svg')).toHaveCount(1);
    await expect(link.locator('svg')).toHaveAttribute('aria-hidden', 'true');
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
  // The page moved from /podcasts; the old address still lands on it.
  await page.goto('/podcasts');
  await expect(page).toHaveURL(/\/listening\/?$/);
  await expect(page.getByRole('heading', { name: 'Listening', exact: true })).toBeVisible();
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
    return file.endsWith('.mdx') && /^draft: false$/m.test(content);
  });
  expect(articles.length).toBeGreaterThanOrEqual(6);
  expect((await request.get('/drafts/')).status()).toBe(404);
  const feed = await (await request.get('/rss.xml')).text();
  const index = await (await request.get('/posts/')).text();
  const home = await (await request.get('/')).text();
  const dated = articles.map(file => {
    const content = readFileSync(join(root, file), 'utf8');
    const date = content.match(/^date: "(\d{4})-(\d{2})/m)!;
    const slug = file.replace(/\.mdx$/, '');
    return {
      slug,
      url: `/posts/${date[1]}/${date[2]}/${slug}/`,
      date: new Date(content.match(/^date: "([^"]+)"/m)![1]).getTime(),
    };
  }).sort((a, b) => b.date - a.date);
  for (const { url } of dated) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<article');
    expect(index).toContain(url);
  }
  // rss.xml.ts keeps the 10 newest English posts; older 2026 articles drop off.
  for (const { slug } of dated.slice(0, 10)) {
    expect(feed).toContain(slug);
  }
  for (const { slug } of dated.slice(0, 3)) {
    expect(home).toContain(slug);
  }
});

for (const width of [390, 1280]) {
  test(`homepage and reading list fit at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Featured Projects' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Selected Writing' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`homepage-${width}.png`), fullPage: true });
    await page.getByRole('link', { name: 'See reading list' }).click();
    await expect(page).toHaveURL(/\/reading\/?$/);
    await expect(page.getByRole('heading', { name: 'Reading', exact: true })).toBeVisible();
    const cards = page.locator('[data-book-search-text]');
    if (await cards.count()) {
      await expect(page.getByRole('searchbox', { name: 'Search books' })).toBeVisible();
      await page.getByRole('searchbox', { name: 'Search books' }).fill('no-result-7cc465');
      await expect(page.getByRole('status')).toContainText('No books match');
      await expect(page.locator('[data-book-search-text]:visible')).toHaveCount(0);
      await page.getByRole('button', { name: 'Clear filters' }).click();
      await expect(cards.first()).toBeVisible();
      await expect(page.locator('[data-reading-list] img:not([loading="lazy"])')).toHaveCount(0);
      await page.getByRole('searchbox', { name: 'Search books' }).scrollIntoViewIfNeeded();
      await page.screenshot({ path: test.info().outputPath(`reading-${width}.png`) });
    } else {
      // Both an empty shelf and unavailable account data omit the filters.
      await expect(page.getByRole('searchbox', { name: 'Search books' })).toHaveCount(0);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}
