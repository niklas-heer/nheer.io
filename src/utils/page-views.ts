import pg from 'pg';

type Snapshot = { source: string; updatedAt: string; totals: Map<string, number> };
let snapshot: Promise<Snapshot | null> | undefined;

export function fetchPageViews() {
  return snapshot ??= load();
}

async function load(): Promise<Snapshot | null> {
  if ((process.env.PUBLIC_PAGE_VIEWS_ENABLED ?? import.meta.env.PUBLIC_PAGE_VIEWS_ENABLED) !== 'true') return null;
  if ((process.env.SITE_TEST_DATA ?? import.meta.env.SITE_TEST_DATA) === 'true') {
    return { source: 'fixture', updatedAt: new Date().toISOString(), totals: new Map([['/', 1234], ['/posts', 1]]) };
  }
  const connectionString = process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL;
  const projectId = process.env.VERCEL_PROJECT_ID ?? import.meta.env.VERCEL_PROJECT_ID;
  if (!connectionString || !projectId) throw new Error('Page views require a database and Vercel project ID');
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000, query_timeout: 10000 });
  try {
    await client.connect();
    const metadata = await client.query('SELECT synced_at FROM site_page_views_sync WHERE project_id = $1', [projectId]);
    const updatedAt = metadata.rows[0]?.synced_at;
    const age = Date.now() - +new Date(updatedAt);
    if (!Number.isFinite(age) || age < -60000 || age > 86400000) throw new Error('Page-view snapshot is missing or stale');
    const result = await client.query('SELECT path, SUM(views)::text AS views FROM site_page_views_daily WHERE project_id = $1 GROUP BY path', [projectId]);
    const totals = new Map<string, number>();
    for (const row of result.rows) {
      const value = Number(row.views);
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid page-view total');
      totals.set(row.path, value);
    }
    return { source: 'live', updatedAt: new Date(updatedAt).toISOString(), totals };
  } catch {
    throw new Error('Cannot build with missing, stale or invalid page-view data');
  } finally {
    await client.end();
  }
}
