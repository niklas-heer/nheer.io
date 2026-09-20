# Vercel hosting and public page views

## Decision — 2026-09-19

Niklas requested visible view totals on each page, chose Vercel and authorized the
migration fixes. Keep the existing private homelab database and build pipeline.
Persist daily Vercel analytics snapshots in PostgreSQL and render their cumulative
sum in each page's HTML. This replaces the initial runtime Analytics API function,
whose undated response was only today's count on the current Hobby plan.

Tracking starts September 19, 2026; no historical Netlify visits are invented.
Totals count recorded page views, not unique people. They refresh with the existing
three-hourly pipeline. Only the canonical production hostname records visits;
preview/local hosts, drafts and 404 pages do not. Query strings and fragments
are stripped. Ad blockers and Vercel collection limits can cause undercounting.

## Verified API contract

Live authenticated requests on September 19 established:

- Hobby permits only the latest 31 days, despite the documentation's lifetime
  wording. Both since and until are required for explicit windows.
- Aggregate grouping by requestPath permits limit <= 100. Extra groups become
  Others; the sync fails rather than silently save incomplete per-page counts.
- The API floors since and advances until to the next hour, including when until
  already falls on an exact hour. Request 23:59:59.999 for an exact UTC day and
  validate the returned window before saving. Adjacent days must never overlap.
- Web Analytics is enabled. A real zero-data response was saved successfully into
  the private database and consumed by a live Astro build.

Recheck on a plan/API change. Sources: [Analytics API](https://vercel.com/docs/analytics/web-analytics-api),
[limits](https://vercel.com/docs/analytics/limits-and-pricing),
[privacy](https://vercel.com/docs/analytics/privacy-policy).

## Architecture and recovery

`scripts/sync-page-views.mjs` uses a database advisory lock and replaces recent daily
rows atomically. It refreshes up to 30 previous days plus today for late arrivals;
older days remain. `site_page_views_daily` owns project/day/path totals and
`site_page_views_sync` owns freshness metadata. Existing CNPG backups cover both.
Network/format errors do not change counts, failed writes roll back, and retries
do not add the same views twice. More than 30 days without a successful sync fails
explicitly because missing history can no longer be recovered from the Hobby API.
Investigate/restore coverage before resuming; never silently label partial history
as a continuous total. More than 100 distinct paths/day requires extending the
query strategy before publishing resumes.

The build reads one shared totals snapshot, renders each page's count, and rejects
missing or stale (>24-hour) data. The publisher also checks live podcast data and
view-count freshness and rejects sample/draft builds. No database or analytics
credentials are sent to Vercel. `package-vercel.mjs` packages the tested static
output using the [Build Output API](https://vercel.com/docs/build-output-api),
preserving routes, security headers, redirects, assets and custom 404 status.

## Deployment and credentials

- CLI 59.23.2 is pinned in mise and logged in as nheer.
- Project: `niklas-heers-projects/nheer-io`.
- Project ID: `prj_blqrNqJWMaL1edc0X83uojSOGkrP`.
- Team ID: `team_NN7LiyAr73wBUMYtlr3m84em`.
- nheer.com and www.nheer.com are attached and ownership verified. www redirects
  to nheer.com with HTTP 308. DNS is delegated to INWX and points at Vercel
  since 2026-09-20 (see "Cutover" below).
- Production deployment dpl_FGEdb5ZRmqfW6Bt22sJVGZejz5QX is READY, with aliases
  nheer.com, www.nheer.com and nheer-io.vercel.app. Homelab workflow
  nheer-manual-jk9vf succeeded. /build-health.json confirms fresh live podcast
  and page-view snapshots, with draftPreview=false.
- Niklas saved the durable automation token in 1Password. CLI OAuth cannot create
  one directly (HTTP 403: Cannot create tokens for this app).

The token is stored as VERCEL_TOKEN in the existing 1Password homelab/nheer Site Jobs
item and synchronized into nheer-site-jobs. Project and analytics access returned
HTTP 200. The first workflow retries preceded the operator's five-minute poll;
synchronizing that saved field allowed the next attempt to complete. The original
separate token item is preserved. Rotation uses [Vercel account tokens](https://vercel.com/account/tokens).
The homelab workflow and three-hour schedule now select Vercel.

```sh
# From the homelab repository:
rtk mise exec -- uv run invoke nheer.run --mode publish --target vercel
```

The site scripts also default to Vercel; use SITE_DEPLOY_TARGET=netlify or
--target netlify explicitly for rollback. Keep automatic Vercel Git builds
disconnected: they cannot access private data. Retain Netlify credentials and
prior deployment for rollback.

## Exact DNS changes

Vercel domains verify returned these recommended records on September 19:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 216.198.79.1 |
| A | @ | 64.29.17.1 |
| CNAME | www | d6d10a4ee034c711.vercel-dns-017.com |

Those records live in the hosting-infra catalog for `nheer.com` and at INWX. Namecheap Custom DNS was pointed at `ns.inwx.de`, `ns2.inwx.de`, and `ns3.inwx.eu` on 2026-09-20. Do not freeze Netlify load-balancer IPs into DNS.

## Cutover — 2026-09-20

Verified on 2026-09-20, the same day as the delegation change:

- The `.com` servers, Google (8.8.8.8) and Cloudflare (1.1.1.1) return the INWX
  nameservers and the Vercel apex addresses. Resolvers still holding the old NS1
  delegation lag for at most its 48-hour TTL, so until 2026-09-22 some visitors
  may still reach Netlify.
- Over the Vercel addresses: `nheer.com` serves 200 with a Let's Encrypt
  certificate issued by Vercel on 2026-09-19; `www` redirects with 308; `/gh/sc`
  redirects 301 to GitHub; an unknown path returns the custom 404; the analytics
  script is served; `/build-health.json` reports a live page-view snapshot; the
  footer renders the counter.
- `vercel domains verify` passes for `nheer.com` and `www.nheer.com`.

```sh
rtk mise exec -- vercel domains verify nheer.com --scope niklas-heers-projects
rtk mise exec -- vercel domains verify www.nheer.com --scope niklas-heers-projects
```

Counts start from zero on Vercel: no visits were recorded there before the
delegation, so the first non-zero totals appear in the build after real traffic
reaches Vercel. The three-hourly pipeline refreshes them. A preview visit must
not contribute.

Rollback until 2026-09-22: restore the Netlify records at INWX (the catalog in
hosting-infra) and use deploy-target=netlify in the homelab. The database keeps
the accumulated view history independently.

Remaining cleanup after 2026-09-22: delete the Netlify DNS zone and site for
`nheer.com`, then remove `netlify.toml`, the `netlify` deploy target in
`scripts/deploy-target.mjs`, the `NETLIFY_*` variables in `.env.example` and in
the homelab `nheer Site Jobs` item.

## Verification

The isolated sample build passed 15 pipeline/integration tests, 30 unit tests,
36 browser tests and npm audit (zero vulnerabilities). The cluster production
build passed its pipeline/unit checks, 27 production browser tests and npm audit.
The gallery-only browser tests are skipped in live builds because that route is
intentionally excluded; they passed in the sample build. Homelab Dagger CI also
passed Python checks and strict workflow validation.

The real PostgreSQL integration test exercises retries, late data, rollback,
invalid/overflow responses and 45 simulated days crossing retention. To repeat,
use a disposable PostgreSQL database (the test creates and removes its own schema):

```sh
rtk env PAGE_VIEWS_TEST_DATABASE_URL=postgres://user:password@localhost/test mise exec -- npm run test:pipeline
```

The component gallery exists only in sample/draft builds; test it with build:check.
Live builds intentionally omit it. A lodash-es override to patched 4.18.1 fixes
the diagram renderer's vulnerable transitive dependency; remove the override when
upstream permits the patched version naturally.
