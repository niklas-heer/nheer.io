import { test, expect } from '@playwright/test';

for (const width of [1280, 390]) {
  test(`all six article visuals work at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/drafts/');
    const links = await page.locator('main li a').evaluateAll(elements => elements.map(el => el.getAttribute('href')!));
    expect(links).toHaveLength(6);
    for (const href of links) {
      await page.locator(`main a[href="${href}"]`).click();
      await expect(page.locator('story-lab')).toBeVisible();
      const buttons = page.locator('story-lab button');
      await expect(buttons).toHaveCount(3);
      for (let step = 0; step < 3; step++) {
        await buttons.nth(step).click();
        await expect(buttons.nth(step)).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator(`story-lab [data-panel="${step}"]`)).toBeVisible();
        await expect(page.locator('story-lab [data-panel]:not([hidden])')).toHaveCount(1);
      }
      // Keyboard activation works too; native buttons own focus behavior.
      await buttons.first().focus();
      await page.keyboard.press('Enter');
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (width === 390) {
        const kind = await page.locator('story-lab').getAttribute('data-kind');
        await page.locator('story-lab').screenshot({ path: test.info().outputPath(`${kind}.png`) });
      }
      await page.getByRole('link', { name: 'All article drafts' }).click();
      await expect(page.getByRole('heading', { name: 'Six projects, six stories' })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}
