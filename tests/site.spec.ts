import { expect, test } from '@playwright/test';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { initReadingFilters } from '../src/utils/reading-filters';
import { privateRepositoryNames } from './private-project-names';

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

test('the about page connect cards include Bluesky with an icon', async ({ page }) => {
  await page.goto('/about');
  const bluesky = page.locator('.connect-card', { hasText: 'Bluesky' });
  await expect(bluesky).toHaveAttribute('href', 'https://bsky.app/profile/nheer.bsky.social');
  await expect(bluesky.locator('svg')).toHaveCount(1);
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

// ---------------------------------------------------------------- projects

const projectFiles = readdirSync('src/content/projects').filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));
const projectMeta = projectFiles.map((file) => {
  const text = readFileSync(join('src/content/projects', file), 'utf8');
  return {
    slug: file.replace(/\.mdx?$/, ''),
    title: text.match(/^title:\s*"?(.*?)"?\s*$/m)![1],
    repo: text.match(/^repo:\s*"?([\w.-]+\/[\w.-]+)"?/m)?.[1],
    category: text.match(/^category:\s*(\w+)/m)![1],
    private: /^visibility:\s*private/m.test(text),
    hideActivity: /^hideActivity:\s*true/m.test(text),
  };
});

test('every project has a page and the index lists it once per category', async ({ page }) => {
  await page.goto('/projects/');
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All projects' })).toBeVisible();
  const cards = page.locator('.project-card');
  await expect(cards).toHaveCount(projectMeta.length);
  for (const project of projectMeta) {
    await expect(page.locator(`.project-card[data-project="${project.slug}"] a`)).toHaveAttribute('href', `/projects/${project.slug}/`);
    const response = await page.request.get(`/projects/${project.slug}/`);
    expect(response.status()).toBe(200);
  }
  await expect(page.locator('.figures')).toContainText(`${projectMeta.length}`);
});

test('category chips filter the list and every group is visible without JavaScript', async ({ page, browser }) => {
  const categories = [...new Set(projectMeta.map((project) => project.category))];
  await page.goto('/projects/');
  const chips = page.getByRole('group', { name: 'Filter by category' });
  await expect(chips).toBeVisible();
  const target = categories[categories.length - 1];
  await chips.locator(`button[data-filter="${target}"]`).click();
  await expect(chips.locator(`button[data-filter="${target}"]`)).toHaveAttribute('aria-pressed', 'true');
  for (const category of categories) {
    await expect(page.locator(`[data-category="${category}"]`)).toBeVisible({ visible: category === target });
  }
  await chips.locator('button[data-filter="all"]').click();
  await expect(page.locator('.project-card:visible')).toHaveCount(projectMeta.length);

  const context = await browser.newContext({ javaScriptEnabled: false });
  const plain = await context.newPage();
  await plain.goto('/projects/');
  await expect(plain.locator('.project-card:visible')).toHaveCount(projectMeta.length);
  await expect(plain.getByRole('group', { name: 'Filter by category' })).toBeHidden();
  await context.close();
});

test('private projects never reveal their repository in the built site', async () => {
  // Private content files name no repository; the schema rejects one.
  for (const project of projectMeta.filter((entry) => entry.private)) expect(project.repo, project.slug).toBeUndefined();
  // The names themselves are known only where .projects-local.json maps the checkouts.
  const names = privateRepositoryNames();
  test.skip(!names.length, 'No private checkouts mapped in .projects-local.json');
  const files = readdirSync('dist', { recursive: true }).map(String).filter((file) => /\.(html|xml|json|txt|js|css|svg)$/.test(file));
  for (const file of files) {
    const text = readFileSync(join('dist', file), 'utf8').toLowerCase();
    for (const name of names) {
      expect(text.includes(name), `dist/${file} mentions a private repository`).toBe(false);
    }
  }
});

test('a project with hideActivity shows no dates of work', async ({ page }) => {
  const hidden = projectMeta.find((entry) => entry.hideActivity);
  test.skip(!hidden, 'No project hides its activity');
  await page.goto(`/projects/${hidden!.slug}/`);
  const facts = page.getByRole('complementary', { name: 'Project facts' });
  await expect(facts).toContainText('Started');
  await expect(facts.locator('dd').nth(1)).toHaveText(/^\s*\d{4}\s*$/);
  await expect(facts).not.toContainText('Last commit');
  await expect(facts).not.toContainText('Commits');
  await expect(page.locator('[data-activity]')).toHaveCount(0);
  await page.goto('/projects/');
  await expect(page.locator(`.project-card[data-project="${hidden!.slug}"] .meta-push`)).toHaveCount(0);
});

for (const width of [390, 1280]) {
  test(`a project page shows its facts and fits at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    for (const project of [projectMeta.find((entry) => !entry.private), projectMeta.find((entry) => entry.private)]) {
      if (!project) continue;
      await page.goto(`/projects/${project.slug}/`);
      await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible();
      const facts = page.getByRole('complementary', { name: 'Project facts' });
      await expect(facts).toContainText('Status');
      await expect(facts).toContainText('Started');
      const source = page.getByRole('link', { name: 'Source on GitHub' });
      if (project.private) {
        await expect(source).toHaveCount(0);
        await expect(page.locator('.eyebrow')).toContainText('private');
      } else {
        await expect(source).toHaveAttribute('href', new RegExp(`github\\.com/${project.repo}$`, 'i'));
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.getByRole('link', { name: 'All projects' }).first().click();
      await expect(page).toHaveURL(/\/projects\/?$/);
    }
  });
}

test('related posts on project pages lead to real posts', async ({ page, request }) => {
  const withPosts = projectFiles.filter((file) => /^posts:\s*\n\s+-/m.test(readFileSync(join('src/content/projects', file), 'utf8')));
  test.skip(!withPosts.length, 'No project lists related posts');
  await page.goto(`/projects/${withPosts[0].replace(/\.mdx?$/, '')}/`);
  const links = page.locator('.related-posts a');
  expect(await links.count()).toBeGreaterThan(0);
  for (const href of await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute('href')!))) {
    expect((await request.get(href)).status()).toBe(200);
  }
});

test('the sitemap lists the projects section and dates posts', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const projects = readdirSync('src/content/projects').filter((file) => /\.mdx?$/.test(file));
  expect(sitemap).toContain('<loc>https://nheer.com/projects/</loc>');
  for (const file of projects) {
    expect(sitemap).toContain(`<loc>https://nheer.com/projects/${file.replace(/\.mdx?$/, '')}/</loc>`);
  }
  expect(sitemap).toMatch(/<loc>https:\/\/nheer\.com\/posts\/\d{4}\/\d{2}\/[^<]+\/<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  expect(sitemap).not.toContain('/404');
});

test.describe('with a light system theme', () => {
  test.use({ colorScheme: 'light' });

  test('a first visit follows the system and a saved choice overrides it', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Switch to dark theme' }).first().click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});
