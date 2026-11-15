-- Page views, one row per UTC day, page and source. Paths have no trailing slash ('/' for the home page).
--   vercel  Vercel Web Analytics history from before the move, copied from the homelab database by
--           scripts/seed-page-views.mjs (re-running it replaces these rows).
--   worker  counted by worker/index.ts since the move.
CREATE TABLE page_views_daily (
  day TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  path TEXT NOT NULL CHECK (substr(path, 1, 1) = '/'),
  source TEXT NOT NULL CHECK (source IN ('vercel', 'worker')),
  views INTEGER NOT NULL CHECK (views >= 0),
  PRIMARY KEY (day, path, source)
) WITHOUT ROWID;

-- Each page's total, always the sum of its daily rows, so counting a view reads and writes one row here.
CREATE TABLE page_view_totals (
  path TEXT PRIMARY KEY CHECK (substr(path, 1, 1) = '/'),
  views INTEGER NOT NULL CHECK (views >= 0)
) WITHOUT ROWID;
