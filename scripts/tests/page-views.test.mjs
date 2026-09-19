import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from 'node:http';
import test from 'node:test';
import { createPageViewsHandler } from '../../server/page-views.mjs';

async function endpoint(t, options = {}) {
  const server = createServer(createPageViewsHandler({
    paths: ['/', '/about', "/posts/it's-a-test"],
    env: { VERCEL_PROJECT_ID: 'prj_test', VERCEL_TEAM_ID: 'team_test', VERCEL_ANALYTICS_TOKEN: 'test-secret' },
    ...options,
  }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  return `http://127.0.0.1:${server.address().port}/api/views`;
}

test('public HTTP endpoint returns only a cached pageview total for the exact page', async t => {
  const base = await endpoint(t, { fetcher: async (url, options) => {
    assert.equal(url.origin, 'https://api.vercel.com');
    assert.equal(url.searchParams.get('projectId'), 'prj_test');
    assert.equal(url.searchParams.get('teamId'), 'team_test');
    assert.equal(url.searchParams.get('filter'), "requestPath eq '/posts/it''s-a-test'");
    assert.equal(options.headers.Authorization, 'Bearer test-secret');
    return Response.json({ data: { pageviews: 1234, visitors: 999 } });
  }});
  const response = await fetch(base + '?path=' + encodeURIComponent("/posts/it's-a-test"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { views: 1234 });
  assert.match(response.headers.get('Vercel-CDN-Cache-Control'), /s-maxage=300/);
});

test('unknown pages, draft paths and write requests never call upstream', async t => {
  const base = await endpoint(t, { fetcher: () => { throw new Error('Must not query analytics'); } });
  for (const query of ['', '?path=/drafts/test', '?path=/404', '?path=//evil.test', '?path=/about&path=/']) {
    assert.equal((await fetch(base + query)).status, 404);
  }
  assert.equal((await fetch(base + '?path=/', { method: 'POST' })).status, 405);
});

test('missing configuration and upstream failures are unavailable, never zero or secret-bearing errors', async t => {
  const cases = [
    { env: {} },
    { fetcher: async () => new Response('test-secret', { status: 401 }) },
    { fetcher: async () => { throw new Error('test-secret'); } },
    { fetcher: async () => Response.json({ data: { pageviews: -1 } }) },
    { fetcher: async () => Response.json({ data: { pageviews: '123' } }) },
    { fetcher: async () => Response.json({}) },
  ];
  for (const options of cases) {
    const response = await fetch(await endpoint(t, options) + '?path=/');
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'View counts unavailable' });
  }
});

test('a real zero count is returned successfully', async t => {
  const base = await endpoint(t, { fetcher: async () => Response.json({ data: { pageviews: 0 } }) });
  assert.deepEqual(await (await fetch(base + '?path=/')).json(), { views: 0 });
});
