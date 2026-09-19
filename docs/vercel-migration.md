# Vercel hosting and public page views

## Direction and status — 2026-09-19

Niklas explicitly requested a view count for each page, visible on that page.
After considering self-hosted analytics, he favored Vercel because he already
hosts other projects there. This change prepares that migration; it does not
establish that the production site has moved. Netlify remains the default
publishing target until analytics setup, the deployment and domain cutover are
verified. Vercel CLI 59.23.2 is pinned in `mise.toml`; installation and login as
`nheer` were verified on 2026-09-19. The checkout is linked to
`niklas-heers-projects/nheer-io` (`prj_blqrNqJWMaL1edc0X83uojSOGkrP`).

Web Analytics is now enabled: an authenticated count request returned HTTP 200
on 2026-09-19. No deployment or production environment variables exist yet.
CLI authentication does not provision the durable deployment and analytics
tokens required by the pipeline/runtime.

### Live API limitation — verified 2026-09-19

The earlier lifetime-count assumption is not supported by the live Hobby API.
An undated `/v1/query/web-analytics/visits/count` request returned a query window
from `2026-09-19T00:00:00.000Z` to `2026-09-20T00:00:00.000Z`. Supplying `since`
alone returned HTTP 400 requiring `until`. An explicit range from 1970-01-01
to 2026-09-19 returned HTTP 400: "the hobby plan only grants access to the latest
31 days of data." These are observations for this project's current plan,
despite the documentation describing lifetime counts.

The current endpoint must not ship labeled as a lifetime counter. Resolve this
with durable totals (carefully accumulating non-overlapping periods) or a
separate persistent counter backend, then verify it against live behavior.
Neither alternative has been selected or implemented. Recheck the API contract
if Vercel changes the plan or count endpoint.

The counter lives in the shared footer. Its intended total is page views since
tracking was enabled, not unique people; lifetime aggregation is unresolved as
described above. Drafts, the 404 page and local or
preview traffic are not tracked. An unavailable count stays hidden; a genuine
zero remains zero. Counts can lag by several minutes because the endpoint is
cached. Analytics collection limits and blockers can cause undercounting.

## Architecture

The site remains a static Astro build. Argo keeps its existing private-data
sync → build → tests → publish workflow. `scripts/package-vercel.mjs` packages
the tested `dist/` files into Vercel's Build Output API format with the existing
redirects, security headers, page routes and custom 404. It includes one small
Node.js function at `/api/views`, with an allowlist of the public pages in that
build. No database credentials or analytics token enter the static output.

`@vercel/analytics` records one page view on each Astro page-load event, only
on the canonical production hostname. Query strings and fragments are removed.
The server function queries the fixed project's `visits/count` endpoint by
exact path and exposes only `pageviews`. Successful responses are cached at
Vercel for five minutes; failures return an uncacheable 503.

Official documentation checked on 2026-09-19:

- [Count API](https://vercel.com/docs/analytics/web-analytics-api): describes
  lifetime totals, but the live Hobby behavior above contradicts that assumption.
- [Limits and pricing](https://vercel.com/docs/analytics/limits-and-pricing):
  Hobby includes 50,000 events per month; collection pauses at the limit.
- [Build Output API](https://vercel.com/docs/build-output-api) and
  [prebuilt deployment](https://vercel.com/docs/cli/deploy).
- [Analytics privacy](https://vercel.com/docs/analytics/privacy-policy).

Recheck these provider contracts and account entitlements before cutover.
Counter behavior and deployment packaging have been verified locally with
fixtures. A live count response succeeded, but lifetime counts and deployment
remain unverified.

Local verification on 2026-09-19: the static build, 18 pipeline/API tests,
30 unit tests and 27 browser tests passed. The final dependency audit could
not complete: npm returned HTTP 503 with a maintenance notice on both attempts.
Run the full check again before deployment; this is not a green release gate.

## Cutover

1. The Vercel project `niklas-heers-projects/nheer-io` has been created and
   linked, and Web Analytics is enabled. Resolve the lifetime-count limitation
   above before shipping the public counter. Leave
   automatic Git deployments off: the homelab is the source of tested builds
   with live private data.
2. Store `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` and `VERCEL_ORG_ID` in the existing
   1Password `homelab/nheer Site Jobs` item. Keep the old Netlify credentials
   available for rollback. The deployment CLI is pinned to 59.23.2.
3. Configure Vercel runtime variables: `VERCEL_ANALYTICS_TOKEN` (a suitably
   scoped Vercel access token), `VERCEL_PROJECT_ID`, and `VERCEL_TEAM_ID` for a
   team-owned project. The analytics token must never have a `PUBLIC_` prefix.
   Do not copy homelab database credentials into Vercel.
4. In the homelab repository, update `cluster/apps/nheer/workflow.yaml`: set
   `SITE_DEPLOY_TARGET=vercel` for both the build and publish templates; expose
   the three deployment credentials only to the publish template. Initially
   set `VERCEL_SKIP_DOMAIN=true` on publish. Update `plan.md` and
   `docs/nheer-workflows.md` with the migration state. Keep existing syncs,
   tests and the live-snapshot check.
5. Run the live pipeline. The build stage enables `PUBLIC_PAGE_VIEWS_ENABLED`.
   The publisher validates the live snapshot, packages the checked output and
   runs `vercel deploy --prebuilt --prod --skip-domain`. Sample-data builds
   and draft previews are rejected. Locally, `mise run check` exercises the
   counter UI with mocked responses; `npm run package:vercel` inspects packaging
   without deploying.
6. Verify the staged deployment: pages, redirects, 404 status, CV downloads,
   live podcasts, theme/navigation, and `/api/views?path=/`. Test the actual
   authenticated Analytics API response; do not treat fixture tests as proof
   of account access. Preview hosts must not increment counts.
7. Inventory the current DNS records in the homelab's DNS source of truth and
   prepare the desired records. Add/verify the canonical `nheer.com` domain
   and its current aliases in Vercel, promote the verified deployment and
   apply the planned DNS cutover. Remove `VERCEL_SKIP_DOMAIN` for subsequent
   publishing only after verifying domain assignment. Verify one production
   visit and the resulting analytics count (allowing for processing/cache
   delay).

Rollback: restore the prior DNS/domain mapping and set the workflow's
`SITE_DEPLOY_TARGET` back to `netlify`. The existing Netlify publisher and
configuration are retained for this transition.
