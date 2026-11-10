import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

// The homelab publishing job runs `npm ci` and the browser tests inside the
// Playwright container image, which ships the browsers for exactly one
// Playwright version. A version range here lets an update pick a release whose
// browsers the image does not have, and publishing then stops (see README,
// "Dependency maintenance").
test('Playwright is pinned to one exact version, and the lockfile agrees', () => {
  const read = (path) => JSON.parse(readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8'));
  const pin = read('package.json').devDependencies['@playwright/test'];
  assert.match(pin, /^\d+\.\d+\.\d+$/, 'pin @playwright/test to the version of the cluster image, without a range');
  assert.equal(read('package-lock.json').packages['node_modules/@playwright/test'].version, pin);
});
