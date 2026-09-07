# nheer.io

Personal website and blog by Niklas Heer.

Built with [Astro](https://astro.build/) and styled with [Tailwind CSS](https://tailwindcss.com/).

## Development

```bash
# Install dependencies
bun install

# Start dev server
just dev

# Build for production
just build

# Preview production build
just preview
```

## Verification

The committed npm lockfile supports reproducible installs:

```bash
npm ci
npm run build
npx playwright install chromium
npm test
```

Browser regression tests run against the production build and cover theme controls,
client-side navigation, scroll controls, and unpublished draft routes. Build first
when testing changes. API credentials are optional for these checks; connected
reading, podcast, and GitHub data use their existing fallbacks when unavailable.

## CV downloads and preview

The About page displays the designed CV and offers both published PDF editions.
The CV repository remains the source of truth. After updating it, run its
`mise run check-all` task and commit the generated PDFs, then run here:

```sh
npm run sync:cv                         # Uses ../cv at HEAD
npm run sync:cv -- /path/to/cv <commit> # Optional repository and revision
```

The sync requires Poppler (`pdfinfo` and `pdftoppm`; `brew install poppler` on
macOS). It exports only the two committed PDFs, verifies each is one A4 page,
and renders the designed PDF into the inline JPEG preview. It records the source
commit and artifact checksums in `src/data/cv.json`. Uncommitted CV edits are not
included. Commit the resulting website changes together.

These snapshots are checked in, so ordinary website builds need neither the CV
checkout nor Poppler. Downloads are served at `/cv.pdf` and `/cv-ats.pdf`;
the preview links to the full PDF for zooming. Career copy on About is still
maintained separately and should be checked when updating the CV.

## Homelab pipelines

Argo Workflows owns the recurring refresh pipeline in the homelab repository:
checkout → install → Pocket Casts sync → Inky sync → build → browser tests → Netlify.
The public website stays on Netlify; PostgreSQL stays private inside the cluster.

`node scripts/site-stage.mjs <stage>` runs a single Argo stage. For a local full
run, use `npm run refresh` (sync/build/test) or `npm run publish:site` (also deploys).
Both require the environment variables documented in `.env.example`; publishing
also requires the existing Netlify site ID and deployment token. Production builds
fail if required live data is unavailable. Ordinary `npm run build` retains the
credential-free development fallback.

Run `npm run test:pipeline` to check the local pipeline's failure and overlap guards.
Cluster configuration and migration operations are documented in the homelab
repository's `docs/nheer-workflows.md`. Keep the old GitHub sync workflow disabled
after cutover, and stop Netlify Git builds so only the tested cluster output deploys.

## Available Commands

Run `just` to see all available commands.

| Command | Description |
|---------|-------------|
| `just dev` | Start development server |
| `just build` | Build for production |
| `just preview` | Preview production build |
| `just check` | Type check the project |
| `just new-post "title"` | Create a new blog post |

## Tech Stack

- **Framework**: Astro 5
- **Styling**: Tailwind CSS 4
- **Theme**: Tokyo Night
- **Syntax Highlighting**: Expressive Code
- **Package Manager**: Bun
- **Deployment**: Netlify

## License

Content is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).

## Tests and article previews

```bash
npm run build:check   # Explicit sample podcast data; never eligible for publishing
npm test             # Unit guards + production UI + all six draft visuals, desktop/mobile
npm run test:sync     # Docker + Bun: real PostgreSQL rollback, retry and recovery checks
npm run preview:articles -- --port 4323
# Open http://127.0.0.1:4323/drafts/
```

The draft preview runs on localhost and needs no live credentials. New articles
remain `draft: true`; normal builds exclude their routes and RSS entries.
`PREVIEW_DRAFTS=true` enables only the `/drafts/` review routes, not public post listings.
See `docs/article-dates.md` for the project milestones behind their dates.

The build emits `build-health.json`. Live builds and publishing require a live
podcast snapshot at most 48 hours old. Publishing rejects sample data and draft
previews. Browser checks require a populated podcast page, so missing credentials
cannot silently skip the main dashboard test; use `build:check` for local CI.

The Pocket Casts importer uses a transaction and database lock. An API failure
rolls back partial writes; a repeated run does not count the same episode progress
twice. After a long data gap, it refreshes totals and episode state without assigning
all missed listening to the recovery date. The API's limited history cannot recreate
missing daily snapshots. Keep production sync/publish paused until the 1Password
`nheer Site Jobs` credentials are configured and a live run succeeds.
