import { test, expect } from '@playwright/test';

const articles = {
  diagram: 'diagrams-that-explain-themselves',
  saving: 'saving-a-markdown-file',
  benchmark: 'what-a-benchmark-measures',
  packing: 'small-python-cli',
  racing: 'projector-racing',
  shell: 'shell-two-pipelines',
};

for (const width of [1280, 390]) {
  for (const [kind, slug] of Object.entries(articles)) {
    test(`${kind} explainer works at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('/posts/');
      // Enter through Astro client navigation, where listeners used to get lost.
      await page.locator(`main a[href*="${slug}"]`).click();
      await expect(page.locator('article')).toBeVisible();
      if (kind === 'benchmark') {
        const buttons = page.locator('pipeline-history button');
        await expect(buttons).toHaveCount(3);
        for (let era = 0; era < 3; era++) {
          await buttons.nth(era).click();
          await expect(buttons.nth(era)).toHaveAttribute('aria-pressed', 'true');
          await expect(page.locator(`pipeline-history [data-era-panel="${era}"]`)).toBeVisible();
          await expect(page.locator('pipeline-history [data-era-panel]:not([hidden])')).toHaveCount(1);
        }
        await buttons.first().focus();
        await page.keyboard.press('Enter');
        await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
      } else if (kind === 'saving') {
        await page.getByRole('button', { name: 'Add a note elsewhere' }).click();
        await page.getByRole('button', { name: 'Try saving' }).click();
        await expect(page.locator('[data-result]')).toContainText('Save paused');
        await expect(page.locator('[data-disk]')).toHaveText('[ ] Ship the thing\nNote: Review it first');
        await expect(page.locator('[data-snapshot]')).toContainText('No write yet');
        await page.getByRole('button', { name: 'Keep both edits' }).focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('[data-disk]')).toHaveText('[x] Ship the thing\nNote: Review it first');
        await expect(page.locator('[data-snapshot]')).toHaveText('[ ] Ship the thing\nNote: Review it first');
        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.getByRole('button', { name: 'Try saving' }).click();
        await expect(page.locator('[data-disk]')).toHaveText('[x] Ship the thing');
        await expect(page.locator('[data-snapshot]')).toHaveText('[ ] Ship the thing');
        await page.getByRole('button', { name: 'Reset', exact: true }).click();
        await page.getByRole('button', { name: 'Add a note elsewhere' }).click();
        await page.getByRole('button', { name: 'Try saving' }).click();
      } else if (kind === 'diagram') {
        const buttons = page.locator('story-lab button[data-step]');
        await expect(buttons).toHaveCount(3);
        for (let step = 0; step < 3; step++) {
          await buttons.nth(step).click();
          await expect(buttons.nth(step)).toHaveAttribute('aria-pressed', 'true');
          await expect(page.locator(`story-lab [data-panel="${step}"]`)).toBeVisible();
          await expect(page.locator('story-lab [data-panel]:not([hidden])')).toHaveCount(1);
        }
        await buttons.first().focus();
        await page.keyboard.press('Enter');
        await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
      }
      if (['saving', 'packing', 'shell'].includes(kind)) {
        const video = page.locator('video');
        await expect(video).toBeVisible();
        await expect(video).toHaveAttribute('controls', '');
        expect(await video.evaluate((el: HTMLVideoElement) => el.autoplay)).toBe(false);
        const poster = await video.getAttribute('poster');
        expect((await page.request.get(poster!)).status()).toBe(200);
        await video.evaluate((el: HTMLVideoElement) => { el.muted = true; return el.play(); });
        await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(0.2);
        expect(await video.evaluate((el: HTMLVideoElement) => el.videoWidth)).toBeGreaterThan(0);
        await video.evaluate((el: HTMLVideoElement) => el.pause());
      }
      if (kind === 'racing' || kind === 'diagram') {
        const pictures = page.locator('article img[src^="/assets/articles/"]');
        await expect(pictures).toHaveCount(kind === 'racing' ? 2 : 1);
        for (const picture of await pictures.all()) {
          await picture.scrollIntoViewIfNeeded();
          await expect.poll(() => picture.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0);
        }
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.locator(kind === 'benchmark' ? 'pipeline-history' : kind === 'packing' ? '.binary-size' : kind === 'shell' ? '[data-application-demo]' : kind === 'racing' ? 'article img[src$="projector-courtyard.png"]' : 'story-lab').screenshot({ path: test.info().outputPath(`${kind}.png`) });
      await page.getByRole('link', { name: 'Back to all posts' }).click();
      await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}

test('cold-load controls wait for their handlers without losing the first click', async ({ page }) => {
  let release = () => {};
  let scriptsReady = Promise.resolve();
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'script') await scriptsReady;
    await route.continue();
  });
  for (const [slug, buttonName, expectedText] of [
    ['2026-07-19_diagrams-that-explain-themselves', 'Inspect', 'Validation and layout advice'],
    ['2026-02-10_what-a-benchmark-measures', 'Nix + Dagger', 'LANGUAGES dictionary'],
    ['2026-07-17_saving-a-markdown-file', 'Add a note elsewhere', 'The other editor added a note'],
  ]) {
    scriptsReady = new Promise<void>(resolve => { release = resolve; });
    try {
      await page.goto(`/posts/2026/${slug.slice(5, 7)}/${slug}/`, { waitUntil: 'commit' });
      const button = page.getByRole('button', { name: buttonName });
      await expect(button).toBeVisible();
      await expect(button).toBeDisabled();
      release();
      await button.click();
      await expect(page.locator('article')).toContainText(expectedText);
      if (buttonName !== 'Add a note elsewhere') await expect(button).toHaveAttribute('aria-pressed', 'true');
    } finally {
      release();
    }
  }
});
