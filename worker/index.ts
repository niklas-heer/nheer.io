// The nheer.com Worker (wrangler.jsonc, docs/cloudflare.md). Pages, images and feeds are static assets that Cloudflare
// serves without running this code; only /api/* reaches it.
//
// POST /api/view  {"path": "/posts/some-post"}  counts one view of that page and answers {"views": <its total>}.
// src/components/PageViews.astro sends it once per page a reader opens and shows the total under the page.
// It counts page views, not people, and stores nothing about the reader: only the day, the page and the count.

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  /** The canonical origin, https://nheer.com. Only pages opened there count. */
  SITE_ORIGIN: string;
}

const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Crawlers and link previews that run scripts are not readers.
const automated = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor/i;

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...securityHeaders, ...headers },
  });
}

/** The page a view is for, in the form the counts are kept in, or null when it is not a page address. */
export function pagePath(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 300 || !value.startsWith('/') || value.startsWith('//')) return null;
  if (/[?#\\\s]/.test(value) || value.split('/').some((part) => part === '.' || part === '..')) return null;
  const path = value.replace(/\/+$/, '') || '/';
  if (path === '/drafts' || path.startsWith('/drafts/') || path === '/404' || path === '/404.html') return null;
  return path;
}

async function countView(request: Request, env: Env) {
  if (request.method !== 'POST') return json({ error: 'Use POST' }, 405, { Allow: 'POST' });
  // A page on the site sends this from the site itself; anything else is not a reader on nheer.com.
  if (request.headers.get('Origin') !== env.SITE_ORIGIN) return json({ error: 'Forbidden' }, 403);
  if (automated.test(request.headers.get('User-Agent') ?? '')) return new Response(null, { status: 204, headers: securityHeaders });

  const body = await request.text();
  if (body.length > 1024) return json({ error: 'Too large' }, 413);
  let path: string | null = null;
  try {
    path = pagePath((JSON.parse(body) as { path?: unknown })?.path);
  } catch {
    // Falls through to the 400 below.
  }
  if (!path) return json({ error: 'Not a page' }, 400);

  // Count only pages the site has, so made-up addresses cannot fill the database.
  const page = await env.ASSETS.fetch(new Request(new URL(path === '/' ? '/' : `${path}/`, env.SITE_ORIGIN), { method: 'HEAD' }));
  if (page.status !== 200 || !page.headers.get('Content-Type')?.startsWith('text/html')) return json({ error: 'Not a page' }, 404);

  const day = new Date().toISOString().slice(0, 10);
  const [, total] = await env.DB.batch<{ views: number }>([
    env.DB.prepare(`INSERT INTO page_views_daily (day, path, source, views) VALUES (?1, ?2, 'worker', 1)
      ON CONFLICT (day, path, source) DO UPDATE SET views = views + 1`).bind(day, path),
    env.DB.prepare(`INSERT INTO page_view_totals (path, views) VALUES (?1, 1)
      ON CONFLICT (path) DO UPDATE SET views = views + 1 RETURNING views`).bind(path),
  ]);
  return json({ views: total.results[0]?.views ?? 0 });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/view') return countView(request, env);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
