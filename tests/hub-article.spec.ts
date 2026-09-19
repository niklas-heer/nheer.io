import { test, expect } from '@playwright/test';

const path = '/posts/2026/09/2026-09-19_the-repository-between-my-repositories/';

for (const width of [1280, 390]) {
  test(`hub guide routes examples and keeps copyable instructions at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/posts/');
    await page.getByRole('link', { name: 'The repository between my repositories' }).click();
    await expect(page.locator('.article-step')).toHaveCount(5);
    const map = page.locator('hub-launchpad');
    for (const [name, destination, evidence] of [
      ['Find the next step', 'overview', 'An evidence-backed shortlist'],
      ['Explore a question', 'research', 'A research note'],
      ['Start a project', 'create', 'A project with its own README'],
    ]) {
      const button = map.getByRole('button', { name });
      await expect(button).toBeEnabled();
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(button).toHaveAttribute('aria-pressed', 'true');
      await expect(map.locator('[data-panel]:not([hidden])')).toHaveCount(1);
      await expect(map.locator(`[data-panel="${destination}"]`)).toBeVisible();
      await expect(map.getByRole('status')).toContainText(evidence);
    }
    const instructions = page.locator('details').filter({ hasText: 'Copy the starter AGENTS.md' });
    await expect(instructions.locator('pre')).not.toBeVisible();
    await instructions.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(instructions.locator('pre')).toContainText('Keep cross-project research');
    // The diagram and the disclosure must fit on small screens; code may scroll internally.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    for (const id of ['hub-launchpad', 'hub-folders']) {
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
  await expect(page.getByRole('heading', { name: 'One starting point. Several directions.' })).toBeVisible();
  await expect(page.locator('hub-launchpad [data-panel="create"]')).toContainText('Create a separate checkout');
  await expect(page.getByRole('button', { name: 'Start a project' })).toBeDisabled();
  await page.getByText('📋 Copy the starter AGENTS.md', { exact: true }).click();
  await expect(page.locator('details pre').first()).toContainText('Keep cross-project research');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});
