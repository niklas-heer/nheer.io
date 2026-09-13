import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { assertLiveSnapshot } from '../src/utils/podcast-health.mjs';

const stage = process.argv[2];
const env = { ...process.env, CI: 'true' };
if (!env.DATABASE_URL && env.PGHOST && env.PGDATABASE && env.PGUSER && env.PGPASSWORD) {
  const url = new URL(`postgresql://${env.PGHOST}:${env.PGPORT || '5432'}`);
  url.username = env.PGUSER;
  url.password = env.PGPASSWORD;
  url.pathname = `/${env.PGDATABASE}`;
  url.searchParams.set('sslmode', env.PGSSLMODE || 'verify-full');
  env.DATABASE_URL = url.href;
}
const stages = {
  install: { required: [], command: ['npm', 'ci', '--no-fund'] },
  'sync-pocketcasts': { required: ['DATABASE_URL', 'POCKETCASTS_EMAIL', 'POCKETCASTS_PASSWORD', 'OPENROUTER_API_KEY'], command: ['bun', 'run', 'scripts/sync-pocketcasts.ts'] },
  'sync-inky': { required: ['DATABASE_URL', 'OPENROUTER_API_KEY'], command: ['bun', 'run', 'scripts/sync-inky.ts'] },
  build: { required: ['DATABASE_URL', 'HARDCOVER_API_TOKEN', 'GITHUB_TOKEN'], command: ['npm', 'run', 'build'] },
  'build-check': { required: [], command: ['npm', 'run', 'build'] },
  test: { required: [], command: ['npm', 'test'] },
  publish: { required: ['NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'], command: ['npm', 'exec', '--yes', '--package=netlify-cli@27.5.2', '--', 'netlify', 'deploy', '--prod', '--no-build', '--dir=dist', '--message=Homelab Argo workflow'] },
};
const config = stages[stage];
if (!config) throw new Error('Unknown site pipeline stage');
const missing = config.required.filter((name) => !env[name]);
if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`);
if (stage === 'build') {
  env.REQUIRE_LIVE_DATA = 'true';
  delete env.SITE_TEST_DATA;
  delete env.PREVIEW_DRAFTS;
}
if (stage === 'build-check') {
  env.SITE_TEST_DATA = 'true';
  delete env.REQUIRE_LIVE_DATA;
}
if (stage === 'publish') assertLiveSnapshot(JSON.parse(readFileSync('dist/build-health.json', 'utf8')));
const [command, ...args] = config.command;
const result = spawnSync(command, args, { env, stdio: 'inherit' });
if (result.error || result.status !== 0) process.exitCode = 1;
