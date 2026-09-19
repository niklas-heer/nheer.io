import pg from 'pg';
import { pathToFileURL } from 'node:url';

const DAY = 86400000;
export const trackingStarted = '2026-09-19';
export const normalizePath = path => path.replace(/\/+$/, '') || '/';

// Replace recent daily snapshots, never add overlapping rolling totals.
export async function syncPageViews({ client, projectId, teamId, token, now = new Date(), fetchImpl = fetch }) {
  if (!projectId || !teamId || !token) throw new Error('Missing Vercel analytics configuration');
  const today = new Date(now.toISOString().slice(0, 10));
  const since = new Date(Math.max(+new Date(trackingStarted), +today - 30 * DAY));
  const locked = await client.query("SELECT pg_try_advisory_lock(hashtext('nheer-page-views')) AS locked");
  if (!locked.rows[0].locked) throw new Error('Another page-view sync is running');
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS site_page_views_daily (
      project_id text NOT NULL, day date NOT NULL, path text NOT NULL,
      views bigint NOT NULL CHECK (views >= 0), PRIMARY KEY (project_id, day, path));
      CREATE TABLE IF NOT EXISTS site_page_views_sync (
      project_id text PRIMARY KEY, synced_at timestamptz NOT NULL, through_day date NOT NULL)`);
    const previous = await client.query('SELECT through_day::text FROM site_page_views_sync WHERE project_id = $1', [projectId]);
    const covered = previous.rows[0]?.through_day ?? trackingStarted;
    if (+new Date(covered) < +since) throw new Error('Page-view history has a gap beyond Vercel retention; restore coverage before syncing');
    const days = [];
    for (let time = +since; time <= +today; time += DAY) {
      const start = new Date(time).toISOString();
      const end = new Date(time + DAY).toISOString();
      const url = new URL('https://api.vercel.com/v1/query/web-analytics/visits/aggregate');
      // The API floors since and advances until to the next hour (even at an exact hour).
      // End at 23:59:59.999 so its normalized window is exactly one UTC day.
      url.search = new URLSearchParams({ projectId, teamId, since: start, until: new Date(time + DAY - 1).toISOString(), by: 'requestPath', limit: '100', filter: "environment eq 'production'" }).toString();
      const response = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Vercel analytics returned HTTP ${response.status}`);
      const result = await response.json();
      if (result.query?.since !== start || result.query?.until !== end || !Array.isArray(result.data)) {
        throw new Error('Unexpected analytics window or response');
      }
      const paths = new Map();
      for (const row of result.data) {
        // Vercel collapses excess paths into Others. Never save a truncated total.
        if (typeof row.requestPath !== 'string' || !row.requestPath.startsWith('/') || row.requestPath.startsWith('//') || /[?#]/.test(row.requestPath) || !Number.isSafeInteger(row.pageviews) || row.pageviews < 0) {
          throw new Error('Incomplete or invalid analytics paths (including Others); no counts changed');
        }
        const path = normalizePath(row.requestPath);
        if (path.startsWith('/drafts') || ['/404', '/404.html'].includes(path)) continue;
        const total = (paths.get(path) ?? 0) + row.pageviews;
        if (!Number.isSafeInteger(total)) throw new Error('Page-view total exceeds safe integer range');
        paths.set(path, total);
      }
      days.push({ day: start.slice(0, 10), paths });
    }
    await client.query('BEGIN');
    try {
      for (const { day, paths } of days) {
        await client.query('DELETE FROM site_page_views_daily WHERE project_id = $1 AND day = $2', [projectId, day]);
        for (const [path, views] of paths) {
          await client.query('INSERT INTO site_page_views_daily (project_id, day, path, views) VALUES ($1, $2, $3, $4)', [projectId, day, path, views]);
        }
      }
      await client.query(`INSERT INTO site_page_views_sync (project_id, synced_at, through_day) VALUES ($1, $2, $3)
        ON CONFLICT (project_id) DO UPDATE SET synced_at = EXCLUDED.synced_at, through_day = EXCLUDED.through_day`, [projectId, now, today]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    return { days: days.length };
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('nheer-page-views'))");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, query_timeout: 15000 });
  try {
    await client.connect();
    const result = await syncPageViews({ client, projectId: process.env.VERCEL_PROJECT_ID, teamId: process.env.VERCEL_ORG_ID, token: process.env.VERCEL_TOKEN });
    console.log(`Saved ${result.days} daily page-view snapshots`);
  } catch {
    // Never dump connection details or response bodies containing credentials.
    console.error('Page-view sync failed; previous totals preserved. Check database access, analytics access and retention coverage.');
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
