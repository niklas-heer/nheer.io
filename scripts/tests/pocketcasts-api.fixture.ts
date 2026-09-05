// Loaded only by the isolated integration test. No requests leave this process.
globalThis.fetch = async (input) => {
  const path = new URL(String(input)).pathname;
  const payloads = {
    '/user/login': { token: 'test-token', email: 'test@example.invalid' },
    '/user/stats/summary': { timeListened: 4800 },
    '/user/podcast/list': { podcasts: [{ uuid: 'p1', title: 'Test podcast', author: 'Test author' }] },
    '/user/history': { episodes: [{ uuid: 'e1', podcastUuid: 'p1', title: 'Test episode', duration: 1800, playedUpTo: 600, published: '2026-01-01', starred: false }] },
  };
  if (path === '/user/history' && process.env.TEST_SCENARIO === 'failure') return new Response('{}', { status: 503 });
  if (!(path in payloads)) throw new Error('Unexpected request in test fixture');
  return Response.json(payloads[path]);
};
