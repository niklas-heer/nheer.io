// Bundled with an allowlist of public paths by scripts/package-vercel.mjs.
export function createPageViewsHandler({ paths, env = process.env, fetcher = fetch }) {
  const allowed = new Set(paths);
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    const send = (status, body) => { res.statusCode = status; res.end(JSON.stringify(body)); };
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return send(405, { error: 'Method not allowed' });
    }
    const url = new URL(req.url, 'http://localhost');
    const path = url.searchParams.get('path');
    if (!allowed.has(path) || url.searchParams.getAll('path').length !== 1) {
      return send(404, { error: 'Unknown page' });
    }
    if (!env.VERCEL_ANALYTICS_TOKEN || !env.VERCEL_PROJECT_ID) {
      return send(503, { error: 'View counts unavailable' });
    }
    const endpoint = new URL('https://api.vercel.com/v1/query/web-analytics/visits/count');
    endpoint.searchParams.set('projectId', env.VERCEL_PROJECT_ID);
    if (env.VERCEL_TEAM_ID) endpoint.searchParams.set('teamId', env.VERCEL_TEAM_ID);
    endpoint.searchParams.set('filter', `requestPath eq '${path.replaceAll("'", "''")}'`);
    try {
      const response = await fetcher(endpoint, {
        headers: { Authorization: `Bearer ${env.VERCEL_ANALYTICS_TOKEN}` },
        signal: AbortSignal.timeout(4000),
        redirect: 'error',
      });
      if (!response.ok) return send(503, { error: 'View counts unavailable' });
      const views = (await response.json()).data?.pageviews;
      if (!Number.isSafeInteger(views) || views < 0) return send(503, { error: 'View counts unavailable' });
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');
      return send(200, { views });
    } catch {
      return send(503, { error: 'View counts unavailable' });
    }
  };
}
