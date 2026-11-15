import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertLiveSnapshot } from '../src/utils/podcast-health.mjs';

// Publish the tested dist/ to the Cloudflare Worker `nheer` (wrangler.jsonc, docs/cloudflare.md):
// apply new D1 migrations first, then deploy the Worker and its static assets.
const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];
if (required.some(key => !process.env[key])) throw new Error(`Publishing needs ${required.join(', ')}`);
assertLiveSnapshot(JSON.parse(readFileSync('dist/build-health.json', 'utf8')));
if (!readFileSync('dist/index.html', 'utf8').includes('data-page-views')) {
  throw new Error('Rebuild with PUBLIC_PAGE_VIEWS_ENABLED=true before publishing to Cloudflare');
}

// The job's home directory may be read-only; keep Wrangler's config and logs in the ignored .wrangler/.
const state = resolve('.wrangler');
mkdirSync(join(state, 'logs'), { recursive: true });
const env = { ...process.env, CI: 'true', XDG_CONFIG_HOME: state, WRANGLER_LOG_PATH: join(state, 'logs'), WRANGLER_SEND_METRICS: 'false' };
const wrangler = resolve('node_modules/wrangler/bin/wrangler.js');
for (const [label, args] of [
  ['D1 migrations', ['d1', 'migrations', 'apply', 'nheer', '--remote']],
  ['Worker deployment', ['deploy']],
]) {
  const result = spawnSync(process.execPath, [wrangler, ...args], { stdio: 'inherit', env });
  // Wrangler never prints the token; do not print the environment either.
  if (result.error || result.status !== 0) {
    console.error(`Cloudflare ${label} failed`);
    process.exit(1);
  }
}
