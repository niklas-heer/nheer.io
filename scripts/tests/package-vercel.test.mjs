import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { packageVercel } from '../package-vercel.mjs';

test('Vercel package preserves tested assets, routes, redirects, 404 and static page counters', async t => {
  const root = await mkdtemp(join(tmpdir(), 'nheer-vercel-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'dist/posts/example'), { recursive: true });
  for (const file of ['index.html', '404.html', 'posts/example/index.html', 'cv.pdf']) {
    await writeFile(join(root, 'dist', file), 'unchanged-' + file);
  }
  await writeFile(join(root, 'dist/build-health.json'), JSON.stringify({ source: 'sample' }));
  await packageVercel({ root });
  const output = join(root, '.vercel/output');
  assert.equal(await readFile(join(output, 'static/cv.pdf'), 'utf8'), 'unchanged-cv.pdf');
  const { routes } = JSON.parse(await readFile(join(output, 'config.json'), 'utf8'));
  const route = path => routes.find(route => route.dest && route.src && new RegExp(`^(?:${route.src})$`).test(path));
  assert.equal(route('/').dest, '/index.html');
  assert.equal(route('/posts/example').dest, '/posts/example/index.html');
  assert.equal(route('/posts/example/').dest, '/posts/example/index.html');
  assert.equal(routes.at(-1).status, 404);
  assert.equal(routes.find(route => route.status === 301).headers.Location, 'https://github.com/niklas-heer/speed-comparison');
  assert.equal(routes.find(route => route.src === '^/podcasts/?$').headers.Location, '/listening/');
  await assert.rejects(readFile(join(output, 'functions/api/views.func/index.mjs')), { code: 'ENOENT' });
  // Repackaging removes stale files from previous builds.
  await writeFile(join(output, 'static/stale.txt'), 'stale');
  await packageVercel({ root });
  await assert.rejects(readFile(join(output, 'static/stale.txt')), { code: 'ENOENT' });
});

test('the Vercel publisher refuses sample-data builds before invoking the CLI', async t => {
  const root = await mkdtemp(join(tmpdir(), 'nheer-no-publish-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'dist/build-health.json'), JSON.stringify({ source: 'sample', snapshot: new Date().toISOString() }));
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('../publish-vercel.mjs', import.meta.url))], {
    cwd: root, encoding: 'utf8',
    env: { ...process.env, VERCEL_TOKEN: 'test-secret', VERCEL_ORG_ID: 'team_test', VERCEL_PROJECT_ID: 'prj_test' },
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /requires a live-data build/);
  assert.doesNotMatch(result.stderr, /test-secret/);
  await assert.rejects(readFile(join(root, '.vercel/output/config.json')), { code: 'ENOENT' });
});
