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
