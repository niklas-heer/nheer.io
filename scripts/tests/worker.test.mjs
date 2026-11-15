import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { seedSql } from '../seed-page-views.mjs';

// Runs the built site in the real Worker runtime (wrangler dev: workerd with a local D1 database) and checks what the
// deployment must do. Nothing reaches Cloudflare: credentials are removed and Wrangler is told to stay offline.
// Needs dist/ (npm run build or build:check).
const root = resolve(import.meta.dirname, '../..');
const wrangler = join(root, 'node_modules/wrangler/bin/wrangler.js');
const origin = 'https://nheer.com';

test('seed SQL replaces the copied history and recomputes totals', () => {
  const sql = seedSql([{ day: '2026-09-19', path: "/it's", views: '3' }]);
  assert.match(sql, /DELETE FROM page_views_daily WHERE source = 'vercel';/);
  assert.match(sql, /\('2026-09-19', '\/it''s', 'vercel', 3\)/);
  assert.match(sql, /INSERT OR REPLACE INTO page_view_totals/);
  assert.doesNotMatch(seedSql([]), /VALUES/);
  for (const row of [{ day: '2026-9-1', path: '/', views: 1 }, { day: '2026-09-19', path: 'x', views: 1 }, { day: '2026-09-19', path: '/', views: -1 }]) {
    assert.throws(() => seedSql([row]), /Invalid/);
  }
});

const freePort = () => new Promise((done, fail) => {
  const server = createServer().on('error', fail).listen(0, '127.0.0.1', () => {
    const { port } = server.address();
    server.close(() => done(port));
  });
});

test('the Worker serves the site and counts page views', { skip: !existsSync(join(root, 'dist/index.html')) && 'needs dist/', timeout: 120000 }, async t => {
  const work = mkdtempSync(join(tmpdir(), 'nheer-worker-'));
  const state = join(work, 'state');
  const env = { ...process.env, CI: 'true', CLOUDFLARE_CF_FETCH_ENABLED: 'false', WRANGLER_SEND_METRICS: 'false', XDG_CONFIG_HOME: join(work, 'config'), WRANGLER_LOG_PATH: join(work, 'logs') };
  for (const key of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) delete env[key];
  const run = args => {
    const result = spawnSync(process.execPath, [wrangler, ...args, '--local', '--persist-to', state], { cwd: root, env, encoding: 'utf8' });
    assert.equal(result.status, 0, `wrangler ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
  };
  run(['d1', 'migrations', 'apply', 'nheer']);
  const seed = join(work, 'seed.sql');
  writeFileSync(seed, seedSql([{ day: '2026-09-19', path: '/', views: 40 }, { day: '2026-09-20', path: '/', views: 2 }]));
  run(['d1', 'execute', 'nheer', '--file', seed]);

  const port = await freePort();
  let log = '';
  const dev = spawn(process.execPath, [wrangler, 'dev', '--local', '--persist-to', state, '--ip', '127.0.0.1', '--port', String(port), '--show-interactive-dev-session=false'], { cwd: root, env, detached: true });
  dev.stdout.on('data', chunk => { log += chunk; });
  dev.stderr.on('data', chunk => { log += chunk; });
  t.after(() => {
    try { process.kill(-dev.pid, 'SIGTERM'); } catch {}
    rmSync(work, { recursive: true, force: true });
  });
  const base = `http://127.0.0.1:${port}`;
  for (let attempt = 0; ; attempt++) {
    try { await fetch(base); break; } catch {
      if (attempt > 200 || dev.exitCode !== null) assert.fail(`wrangler dev did not start\n${log.slice(-3000)}`);
      await new Promise(done => setTimeout(done, 250));
    }
  }
  const get = path => fetch(base + path, { redirect: 'manual' });
  const view = (body, headers = {}) => fetch(`${base}/api/view`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  await t.test('pages, feeds and headers', async () => {
    for (const path of ['/', '/about/', '/posts/', '/reading/', '/listening/', '/projects/', '/rss.xml', '/sitemap.xml', '/robots.txt']) {
      const response = await get(path);
      assert.equal(response.status, 200, path);
      assert.equal(response.headers.get('x-frame-options'), 'DENY', path);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff', path);
      assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin', path);
    }
    const asset = readdirSync(join(root, 'dist/_astro')).find(file => file.endsWith('.js'));
    assert.equal((await get(`/_astro/${asset}`)).headers.get('cache-control'), 'public, max-age=31536000, immutable');
    assert.notEqual((await get('/')).headers.get('cache-control'), 'public, max-age=31536000, immutable');
    // Cloudflare's rules files are read, not served.
    assert.equal((await get('/_headers')).status, 404);
    assert.equal((await get('/_redirects')).status, 404);
  });

  await t.test('redirects and the 404 page', async () => {
    const expectRedirect = async (path, status, location) => {
      const response = await get(path);
      assert.equal(response.status, status, path);
      assert.equal(new URL(response.headers.get('location'), base).href, new URL(location, base).href, path);
    };
    await expectRedirect('/about', 307, '/about/');
    await expectRedirect('/podcasts', 301, '/listening/');
    await expectRedirect('/podcasts/', 301, '/listening/');
    for (const path of ['/gh/sc', '/gh/sc/', '/gh/speed-comparison']) await expectRedirect(path, 301, 'https://github.com/niklas-heer/speed-comparison');
    const missing = await get('/missing-page-for-worker-test');
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /<html/i);
    assert.equal(missing.headers.get('x-frame-options'), 'DENY');
  });

  await t.test('page views', async () => {
    let response = await view({ path: '/' });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { views: 43 });
    assert.deepEqual(await (await view({ path: '/' })).json(), { views: 44 });
    assert.deepEqual(await (await view({ path: '/about/' })).json(), { views: 1 });
    assert.deepEqual(await (await view({ path: '/about' })).json(), { views: 2 });

    // Not counted: other sites, crawlers, non-pages, drafts, malformed requests.
    assert.equal((await view({ path: '/' }, { Origin: 'https://example.com' })).status, 403);
    assert.equal((await fetch(`${base}/api/view`, { method: 'POST', body: '{"path":"/"}' })).status, 403);
    assert.equal((await view({ path: '/' }, { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' })).status, 204);
    for (const path of ['/missing-page', '/rss.xml', '/drafts/x', '//example.com', '/a/../b', '/?x=1', 'about', 42]) {
      assert.ok([400, 404].includes((await view({ path })).status), String(path));
    }
    assert.equal((await view('not json')).status, 400);
    assert.equal((await view({ path: '/', pad: 'x'.repeat(2000) })).status, 413);
    assert.equal((await get('/api/view')).status, 405);
    assert.equal((await get('/api/other')).status, 404);

    const rows = JSON.parse(run(['d1', 'execute', 'nheer', '--json', '--command',
      "SELECT path, source, SUM(views) AS views FROM page_views_daily GROUP BY path, source ORDER BY path, source"]))[0].results;
    assert.deepEqual(rows, [
      { path: '/', source: 'vercel', views: 42 },
      { path: '/', source: 'worker', views: 2 },
      { path: '/about', source: 'worker', views: 2 },
    ]);

    // Seeding again replaces the copied history and keeps the counted views.
    run(['d1', 'execute', 'nheer', '--file', seed]);
    const totals = JSON.parse(run(['d1', 'execute', 'nheer', '--json', '--command', 'SELECT path, views FROM page_view_totals ORDER BY path']))[0].results;
    assert.deepEqual(totals, [{ path: '/', views: 44 }, { path: '/about', views: 2 }]);
  });
});
