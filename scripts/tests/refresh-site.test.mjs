import assert from 'node:assert/strict';
import test from 'node:test';
import { refreshSite, requiredSecrets } from '../refresh-site.mjs';

const env = Object.fromEntries([...requiredSecrets, 'NETLIFY_AUTH_TOKEN', 'NETLIFY_SITE_ID'].map((key) => [key, 'test']));
function fixture({ locked = true, fail } = {}) {
  const commands = [];
  let closed = false;
  return {
    commands,
    get closed() { return closed; },
    options: {
      mode: 'publish', env,
      connect: async () => ({ query: async () => ({ rows: [{ locked }] }), end: async () => { closed = true; } }),
      run: (command, args) => { commands.push([command, ...args]); if (args.includes(fail)) throw new Error('step failed'); },
    },
  };
}
test('missing credentials prevent any commands from running', async () => {
  const x = fixture();
  await assert.rejects(refreshSite({ ...x.options, env: {} }), /Missing configuration/);
  assert.deepEqual(x.commands, []);
});
test('a failed browser check never publishes and releases the database lock', async () => {
  const x = fixture({ fail: 'test' });
  await assert.rejects(refreshSite(x.options), /step failed/);
  assert.equal(x.commands.some((command) => command.includes('deploy')), false);
  assert.equal(x.closed, true);
});
test('concurrent refresh is rejected before syncing', async () => {
  const x = fixture({ locked: false });
  await assert.rejects(refreshSite(x.options), /already running/);
  assert.equal(x.commands.length, 1);
  assert.equal(x.closed, true);
});
test('publishing follows both syncs, build and browser checks', async () => {
  const x = fixture();
  await refreshSite(x.options);
  assert.deepEqual(x.commands.slice(1, 5), [
    ['bun', 'run', 'scripts/sync-pocketcasts.ts'],
    ['bun', 'run', 'scripts/sync-inky.ts'],
    ['npm', 'run', 'build'], ['npm', 'test'],
  ]);
  assert.ok(x.commands.at(-1).includes('--no-build'));
  assert.ok(x.commands.at(-1).includes('deploy'));
  assert.equal(x.closed, true);
});

test('Vercel publishing preserves checks and uses the guarded prebuilt publisher', async () => {
  const x = fixture();
  await refreshSite({ ...x.options, env: { ...env, SITE_DEPLOY_TARGET: 'vercel', VERCEL_TOKEN: 'test', VERCEL_PROJECT_ID: 'test', VERCEL_ORG_ID: 'test' } });
  assert.deepEqual(x.commands.at(-2), ['node', 'scripts/verify-build.mjs']);
  assert.deepEqual(x.commands.at(-1), ['node', 'scripts/publish-vercel.mjs']);
  assert.equal(x.commands.some(command => command.includes('netlify')), false);
});

test('unknown deployment target and missing Vercel credentials stop before commands', async () => {
  for (const target of ['vercel', 'typo']) {
    const x = fixture();
    await assert.rejects(refreshSite({ ...x.options, env: { ...env, SITE_DEPLOY_TARGET: target } }));
    assert.deepEqual(x.commands, []);
  }
});
