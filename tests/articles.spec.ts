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
      await page.goto('/drafts/');
      // Enter through Astro client navigation, where listeners used to get lost.
      await page.locator(`main a[href*="${slug}"]`).click();
      await expect(page.locator('story-lab')).toBeVisible();
      if (kind === 'benchmark') {
        const slider = page.getByRole('slider', { name: 'Units of work' });
        await expect(page.locator('[data-result]')).toContainText('A finishes 57 ms sooner');
        await page.getByRole('button', { name: 'Find the crossover' }).click();
        await expect(page.locator('[data-result]')).toContainText('A tie at 120 ms');
        await expect(page.locator('[data-total-a]')).toHaveText('120 ms');
        await expect(page.locator('[data-total-b]')).toHaveText('120 ms');
        await slider.focus();
        await page.keyboard.press('ArrowRight');
        await expect(slider).toHaveValue('21');
        await expect(page.locator('[data-result]')).toContainText('B finishes 3 ms sooner');
        await expect(page.locator('[data-chart]')).toHaveAttribute('aria-label', 'At 21 units: A takes 125 milliseconds. B takes 122 milliseconds.');
        await page.getByRole('button', { name: 'Long calculation' }).click();
        await expect(page.locator('[data-total-a]')).toHaveText('1,020 ms');
        await expect(page.locator('[data-total-b]')).toHaveText('480 ms');
        // Both stacked bars must share one scale, not independently fill the chart.
        // Wait on geometry explicitly because the visual intentionally interpolates.
        await expect.poll(async () => page.locator('[data-b-start]').evaluate(el =>
          (el.getBoundingClientRect().width + el.nextElementSibling!.getBoundingClientRect().width) / el.parentElement!.getBoundingClientRect().width
        )).toBeCloseTo(480 / 1020, 2);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(page.locator('[data-a-start]')).toHaveCSS('transition-duration', '0s');
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
      } else {
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
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.locator('story-lab').screenshot({ path: test.info().outputPath(`${kind}.png`) });
      await page.getByRole('link', { name: 'All article drafts' }).click();
      await expect(page.getByRole('heading', { name: 'Six projects, six stories' })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
}
