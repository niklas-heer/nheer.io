import { test, expect } from '@playwright/test';

test('the corner mascot mounts once on wide screens and answers clicks', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 844 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let animationRequests = 0;
  page.on('request', request => { if (/octopus\.json/.test(request.url())) animationRequests += 1; });
  await page.goto('/posts/');
  const octopus = page.locator('#inky-lottie svg');
  await expect(octopus).toBeVisible();
  const mascot = page.locator('#inky-mascot');
  await mascot.click();
  const bubble = page.locator('#inky-bubble');
  await expect(bubble).toHaveClass(/visible/);
  const first = (await page.locator('#inky-text').textContent())?.trim();
  expect(first).toBeTruthy();
  await mascot.click();
  const second = (await page.locator('#inky-text').textContent())?.trim();
  expect(second).not.toBe(first);
  // Clicking elsewhere closes the bubble; the octopus stays surfaced.
  await page.locator('h1').first().click();
  await expect(bubble).not.toHaveClass(/visible/);
  await expect(mascot).toHaveClass(/activated/);
  expect(animationRequests).toBe(1);

  // Client navigation replaces the document; the replacement must initialize too.
  await page.locator('main a[href*="saving-a-markdown-file"]').click();
  await expect(page.locator('article')).toBeVisible();
  await expect(page.locator('#inky-lottie svg')).toBeVisible();
  await page.locator('#inky-mascot').click();
  await expect(page.locator('#inky-bubble')).toHaveClass(/visible/);
  expect(animationRequests).toBe(2);
  expect(errors).toEqual([]);
});

test('narrow screens never download the animation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requests: string[] = [];
  page.on('request', request => { if (/octopus\.json|lottie/i.test(request.url())) requests.push(request.url()); });
  await page.goto('/posts/');
  await page.getByRole('heading', { name: 'Blog', exact: true }).waitFor();
  await expect(page.locator('#inky-container')).toBeHidden();
  expect(requests).toEqual([]);
});
