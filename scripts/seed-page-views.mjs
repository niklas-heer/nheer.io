import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import pg from 'pg';

// Copy the page views Vercel Web Analytics recorded (19 September 2026 until the move to Cloudflare) from the homelab
// database into D1, so each page's total carries on. Writes SQL; apply it with
//   node_modules/.bin/wrangler d1 execute nheer --remote --file <file>
// Running it again replaces the copied rows; views the Worker counted are never touched (docs/cloudflare.md).
//
//   DATABASE_URL=… VERCEL_PROJECT_ID=… node scripts/seed-page-views.mjs <file>

const quote = value => `'${String(value).replaceAll("'", "''")}'`;

export function seedSql(rows) {
  const values = rows.map(({ day, path, views }) => {
    const count = Number(views);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('Invalid day in page-view history');
    if (typeof path !== 'string' || !path.startsWith('/') || path.length > 300) throw new Error('Invalid path in page-view history');
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid count in page-view history');
    return `(${quote(day)}, ${quote(path)}, 'vercel', ${count})`;
  });
  return [
    "DELETE FROM page_views_daily WHERE source = 'vercel';",
    ...(values.length ? [`INSERT INTO page_views_daily (day, path, source, views) VALUES\n${values.join(',\n')};`] : []),
    // One statement, so a view counted meanwhile is either in the sum or added after it.
    'INSERT OR REPLACE INTO page_view_totals (path, views) SELECT path, SUM(views) FROM page_views_daily GROUP BY path;',
    '',
  ].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [file] = process.argv.slice(2);
  if (!file || !process.env.DATABASE_URL || !process.env.VERCEL_PROJECT_ID) {
    throw new Error('Usage: DATABASE_URL=… VERCEL_PROJECT_ID=… node scripts/seed-page-views.mjs <file>');
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000, query_timeout: 15000 });
  try {
    await client.connect();
    const { rows } = await client.query(
      'SELECT day::text AS day, path, views::text AS views FROM site_page_views_daily WHERE project_id = $1 ORDER BY day, path',
      [process.env.VERCEL_PROJECT_ID],
    );
    writeFileSync(file, seedSql(rows), { mode: 0o600 });
    const total = rows.reduce((sum, row) => sum + Number(row.views), 0);
    console.log(`Wrote ${rows.length} daily rows (${total} views) to ${file}`);
  } catch (error) {
    // Never print connection details.
    console.error(error instanceof Error && error.message.startsWith('Invalid') ? error.message : 'Reading the page-view history failed');
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
