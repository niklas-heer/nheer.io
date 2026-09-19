import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { deployTarget } from './deploy-target.mjs';

export const requiredSecrets = [
  'DATABASE_URL', 'POCKETCASTS_EMAIL', 'POCKETCASTS_PASSWORD',
  'OPENROUTER_API_KEY', 'HARDCOVER_API_TOKEN', 'GITHUB_TOKEN',
];

export async function refreshSite({ mode = 'check', env = process.env, run, connect } = {}) {
  if (!['check', 'refresh', 'publish'].includes(mode)) throw new Error('Expected check, refresh, or publish');
  env = { ...env };
  if (!env.DATABASE_URL && env.PGHOST && env.PGDATABASE && env.PGUSER && env.PGPASSWORD) {
    const url = new URL(`postgresql://${env.PGHOST}:${env.PGPORT || '5432'}`);
    url.username = env.PGUSER;
    url.password = env.PGPASSWORD;
    url.pathname = `/${env.PGDATABASE}`;
    url.searchParams.set('sslmode', env.PGSSLMODE || 'verify-full');
    env.DATABASE_URL = url.href;
  }
  const deployment = deployTarget(env);
  const required = mode === 'check' ? [] : [...requiredSecrets,
    ...(mode === 'publish' ? deployment.required : [])];
  const missing = required.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Missing configuration: ${missing.join(', ')}`);

  const commandEnv = { ...env, CI: 'true' };
  if (mode === 'check' || env.SITE_DEPLOY_TARGET === 'vercel') commandEnv.PUBLIC_PAGE_VIEWS_ENABLED = 'true';
  if (mode === 'check') {
    commandEnv.SITE_TEST_DATA = 'true';
    delete commandEnv.REQUIRE_LIVE_DATA;
  } else {
    delete commandEnv.SITE_TEST_DATA;
    delete commandEnv.PREVIEW_DRAFTS;
  }
  const execute = run || ((command, args) => {
    const result = spawnSync(command, args, { env: commandEnv, stdio: 'inherit' });
    if (result.error || result.status !== 0) throw new Error(`${command} ${args[0]} failed`);
  });

  // Install before loading pg. No credentials are passed as command arguments.
  execute('npm', ['ci', '--no-fund']);
  let client;
  try {
    if (mode !== 'check') {
      client = await (connect || (async () => {
        const { default: pg } = await import('pg');
        const connection = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 10000 });
        await connection.connect();
        return connection;
      }))();
      const lock = await client.query("SELECT pg_try_advisory_lock(hashtext('nheer-site-refresh')) AS locked");
      if (!lock.rows[0].locked) throw new Error('Another site refresh is already running');
      commandEnv.REQUIRE_LIVE_DATA = 'true';
      execute('bun', ['run', 'scripts/sync-pocketcasts.ts']);
      execute('bun', ['run', 'scripts/sync-inky.ts']);
    }
    execute('npm', ['run', 'build']);
    execute('npm', ['test']);
    if (mode === 'publish') {
      execute('node', ['scripts/verify-build.mjs']);
      // Both providers receive tested output; neither connects to Postgres.
      execute(deployment.command[0], deployment.command.slice(1));
    }
  } finally {
    if (client) await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  refreshSite({ mode: process.argv[2] }).catch((error) => {
    // Avoid dumping client configuration or connection strings into job logs.
    console.error(error instanceof Error ? error.message : 'Site refresh failed');
    process.exitCode = 1;
  });
}
