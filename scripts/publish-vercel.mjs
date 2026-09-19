import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { assertLiveSnapshot } from '../src/utils/podcast-health.mjs';
import { packageVercel } from './package-vercel.mjs';

const required = ['VERCEL_TOKEN', 'VERCEL_PROJECT_ID', 'VERCEL_ORG_ID'];
if (required.some(key => !process.env[key])) throw new Error(`Publishing needs ${required.join(', ')}`);
assertLiveSnapshot(JSON.parse(readFileSync('dist/build-health.json', 'utf8')));
if (!readFileSync('dist/index.html', 'utf8').includes('data-page-views')) {
  throw new Error('Rebuild with PUBLIC_PAGE_VIEWS_ENABLED=true before publishing to Vercel');
}
await packageVercel();
const args = ['exec', '--yes', '--package=vercel@59.23.2', '--', 'vercel', 'deploy',
  '--prebuilt', '--archive=tgz', '--yes', '--prod', '--token', process.env.VERCEL_TOKEN];
// Stage the production deployment without changing domain assignments during cutover.
if (process.env.VERCEL_SKIP_DOMAIN === 'true') args.push('--skip-domain');
const result = spawnSync('npm', args, { stdio: 'inherit', env: process.env });
// Do not print spawn errors or arguments: they can contain the deployment token.
if (result.error || result.status !== 0) {
  console.error('Vercel deployment failed');
  process.exitCode = 1;
}
