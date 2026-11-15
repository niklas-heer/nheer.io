# nheer.com on Cloudflare

Decided 2026-11-15: nheer.com moves from Vercel to the Cloudflare Worker `nheer`, one step at a time. This first
step changes only the host. The site, its design and its build stay as they are, and every page is still built
ahead of time by the homelab job. Later steps (scheduled syncs in the Worker, live pages, notes, games) each
get their own release. The reasoning is in the hub decision record "Host nheer.com on Cloudflare Workers, keep Astro".

## What runs where

| Thing | Value |
| --- | --- |
| Site | Worker `nheer` (`wrangler.jsonc`, `worker/index.ts`), static assets from `dist/` |
| Temporary address | `https://nheer.niklas-heer.workers.dev` |
| Page views | D1 database `nheer` (`13f4bee1-ca3d-47f0-8f20-19b1518268f8`, western Europe), `migrations/` |
| DNS | Cloudflare zone `nheer.com` (`0b163307f715b6e2f60fcb23ab170976`), nameservers `raquel` and `zeus.ns.cloudflare.com`, set at Namecheap on 2026-11-15 |
| Publishing | homelab CronWorkflow `nheer-refresh`, `deploy-target=cloudflare`: `scripts/publish-cloudflare.mjs` applies D1 migrations, then `wrangler deploy` |
| Token | `CLOUDFLARE_API_TOKEN` on `homelab/nheer Site Jobs` in 1Password: Workers Scripts, D1, Account Settings Read, and Workers Routes, Zone Read and DNS for `nheer.com` only |

Pages, images, feeds and scripts are static assets: Cloudflare serves them without running the Worker, so they
cost no Worker requests. The account is on the free Workers plan (100,000 Worker requests a day), and if that
ran out, only the counter would stop working, not the pages. Only `/api/*` runs `worker/index.ts`.

- `public/_headers` sets the security headers and the year-long cache for `/_astro/*`; `public/_redirects` keeps
  `/podcasts` and `/gh/sc`. Both are read by Cloudflare, not served (Vercel's packaging drops them).
- `/about` answers 307 to `/about/`, the canonical address (Vercel answered 200 at both). The site links to
  the slashed addresses, so readers don't take the extra hop.
- An unknown address gets `dist/404.html` with status 404.

## Page views

Each page asks `POST /api/view` to count it and shows the total it gets back (`src/components/PageViews.astro`).
The Worker counts a view only from a page on `https://nheer.com`, only for a page the site has, and not for
crawlers. It stores the day, the page and the count; nothing about the reader. `page_view_totals` keeps each
page's sum so a view reads one row.

Views counted on Vercel (19 September 2026 until the move) live in the homelab database. They are copied into D1
as rows with source `vercel`; copying again replaces those rows and leaves the Worker's own counts alone:

```sh
# With DATABASE_URL and VERCEL_PROJECT_ID for the homelab database:
node scripts/seed-page-views.mjs scratch/seed.sql
node_modules/.bin/wrangler d1 execute nheer --remote --file scratch/seed.sql
```

Copy once before the domain moves, and once more about two days later, after the last cached DNS answers have
expired and the homelab's Vercel sync has fetched Vercel's final days.

## Checks

`npm test` runs the Worker in workerd with a local D1 (`scripts/tests/worker.test.mjs`): pages, feeds, headers,
redirects, the 404 page, counting and what must not count, and seeding. `npm run typecheck:worker` checks the
Worker's types. Neither reaches Cloudflare.

To check a branch on the temporary address with live data, run the homelab pipeline on it:

```sh
# In the homelab repository:
mise exec -- uv run invoke nheer.run --mode publish --target cloudflare --ref <branch>
```

## Deploying by hand

Wrangler is not logged in on the Mac. Mint a short-lived token with the `cf` CLI (hub note
`facts/kindred-repos-and-deployment.md`), then, after a live build:

```sh
export CLOUDFLARE_API_TOKEN=… CLOUDFLARE_ACCOUNT_ID=338c28d4727afe5c502384db4f3504b2
npm run deploy:cloudflare
```

## Rollback to Vercel

The Vercel project `nheer-io` keeps its last deployment and both domains. Until the Worker serves the domain,
the Cloudflare zone still points at Vercel (DNS only), so nothing needs undoing. After the cutover:

1. Detach the Worker's domains (`GET`, then `DELETE /accounts/<account>/workers/domains/<id>` for `nheer.com` and
   `www.nheer.com`), which removes their DNS records, or remove the routes from `wrangler.jsonc` and deploy.
2. Recreate the Vercel records in the Cloudflare zone, DNS only: apex A `216.198.79.1` and `64.29.17.1`, `www`
   CNAME `d6d10a4ee034c711.vercel-dns-017.com`.
3. Set the homelab schedule back to `deploy-target=vercel`. Views counted on Cloudflare stay in D1; Vercel builds
   show no counter, because `/api/view` does not exist there.

The older rollback, nameservers back to INWX (`ns.inwx.de`, `ns2.inwx.de`, `ns3.inwx.eu`) at Namecheap, also lands
on Vercel: the INWX zone is unchanged.
