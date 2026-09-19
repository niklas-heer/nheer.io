import { test, expect } from '@playwright/test';

const path = '/drafts/2026/2026-09-19_the-repository-between-my-repositories/';

for (const width of [1280, 390]) {
  test(`hub guide routes examples and keeps copyable instructions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/drafts/');
    await page.getByRole('link', { name: 'The repository between my repositories' }).click();
    await expect(page.locator('.article-step')).toHaveCount(5);
    const map = page.locator('hub-ownership');
    for (const [name, destination, evidence] of [
      ['A personal preference', 'dotfiles', 'follow me between repositories'],
      ['A parser finding', 'project', 'one implementation'],
      ['A shared decision', 'hub', 'across repositories'],
    ]) {
      const button = map.getByRole('button', { name });
      await expect(button).toBeEnabled();
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(map.locator('[data-destination][data-active]')).toHaveCount(1);
      await expect(map.locator(`[data-destination="${destination}"]`)).toContainText('Keep it here');
      await expect(map.getByRole('status')).toContainText(evidence);
    }
    const instructions = page.locator('details').filter({ hasText: 'Copy the starter AGENTS.md' });
    await expect(instructions.locator('pre')).not.toBeVisible();
    await instructions.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(instructions.locator('pre')).toContainText('Keep cross-project research');
    // The diagram and the disclosure must fit on small screens; code may scroll internally.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const id of ['hub-discovery', 'hub-ownership', 'hub-folders']) {
      await page.locator(`figure[aria-labelledby="${id}-title"]`).screenshot({ path: test.info().outputPath(`${id}-${width}.png`) });
    }
    await page.screenshot({ path: test.info().outputPath(`hub-article-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}

test('hub diagrams and copyable guide remain readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseURL}${path}`);
  await expect(page.getByRole('heading', { name: 'Where should this knowledge live?' })).toBeVisible();
  await expect(page.locator('hub-ownership [data-destination]')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'A personal preference' })).toBeDisabled();
  await page.getByText('📋 Copy the starter AGENTS.md', { exact: true }).click();
  await expect(page.locator('details pre').first()).toContainText('Keep cross-project research');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});
