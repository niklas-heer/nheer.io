import assert from 'node:assert/strict';
import test from 'node:test';
import pg from 'pg';
import { syncPageViews } from '../sync-page-views.mjs';

// Run against a disposable Postgres, never the production database.
test('persisted totals survive retries, late data, failures and retention', { skip: !process.env.PAGE_VIEWS_TEST_DATABASE_URL }, async t => {
  const client = new pg.Client({ connectionString: process.env.PAGE_VIEWS_TEST_DATABASE_URL });
  await client.connect();
  const schema = `views_test_${process.pid}`;
  await client.query(`CREATE SCHEMA ${schema}`);
  await client.query(`SET search_path TO ${schema}`);
  t.after(async () => { await client.query(`DROP SCHEMA ${schema} CASCADE`); await client.end(); });
  let now = new Date('2026-09-19T12:00:00Z');
  let rows = [{ requestPath: '/', pageviews: 3 }, { requestPath: '/posts/', pageviews: 2 }, { requestPath: '/posts', pageviews: 1 }];
  let fail = false;
  let invalidWindow = false;
  const run = () => syncPageViews({ client, projectId: 'test-project', teamId: 'test-team', token: 'test-secret', now,
    fetchImpl: async (url, options) => {
      assert.equal(url.origin, 'https://api.vercel.com');
      assert.equal(url.searchParams.get('filter'), "environment eq 'production'");
      assert.equal(options.headers.Authorization, 'Bearer test-secret');
      assert.equal(url.searchParams.get('token'), null);
      const query = Object.fromEntries(url.searchParams);
      assert.match(query.until, /T23:59:59.999Z$/);
      query.until = new Date(Date.parse(query.until) + 1).toISOString();
      if (invalidWindow) query.since = '2026-09-18';
      return { ok: !fail, status: fail ? 503 : 200, json: async () => ({ query, data: rows }) };
    } });
  const total = async path => Number((await client.query('SELECT coalesce(sum(views), 0)::text AS total FROM site_page_views_daily WHERE path = $1', [path])).rows[0].total);
  await run();
  await run();
  assert.equal(await total('/'), 3, 'retries must not double count');
  assert.equal(await total('/posts'), 3, 'trailing slash variants combine');
  rows = [{ requestPath: '/', pageviews: 5 }];
  await run();
  assert.equal(await total('/'), 5, 'late arrivals replace daily counts');
  assert.equal(await total('/posts'), 0, 'removed upstream rows disappear');
  fail = true;
  await assert.rejects(run(), /HTTP 503/);
  fail = false;
  rows = [{ requestPath: 'Others', pageviews: 100 }];
  await assert.rejects(run(), /Incomplete/);
  invalidWindow = true;
  await assert.rejects(run(), /window/);
  invalidWindow = false;
  assert.equal(await total('/'), 5, 'upstream failures preserve saved totals');
  await client.query(`CREATE FUNCTION reject_explode() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
    IF NEW.path = '/explode' THEN RAISE EXCEPTION 'injected persistence failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER reject_explode BEFORE INSERT ON site_page_views_daily FOR EACH ROW EXECUTE FUNCTION reject_explode()`);
  rows = [{ requestPath: '/', pageviews: 99 }, { requestPath: '/explode', pageviews: 1 }];
  await assert.rejects(run(), /injected persistence failure/);
  assert.equal(await total('/'), 5, 'partial writes roll back');
  // 45 simulated days cross the retention boundary using the production sync.
  rows = [{ requestPath: '/', pageviews: 5 }];
  for (let day = 1; day <= 45; day++) {
    now = new Date(Date.UTC(2026, 8, 19 + day, 12));
    await run();
    assert.equal(await total('/'), 5 * (day + 1));
  }
  now = new Date(+now + 32 * 86400000);
  await assert.rejects(run(), /gap beyond Vercel retention/);
  assert.equal(await total('/'), 230);
});
