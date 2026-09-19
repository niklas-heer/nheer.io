# nheer.io

Personal website and blog by Niklas Heer.

Vercel hosting and public per-page view counts are prepared; production cutover
is pending account setup and verification. See [the migration runbook](docs/vercel-migration.md).

Built with [Astro](https://astro.build/) and styled with [Tailwind CSS](https://tailwindcss.com/).

## Setup and development

Install [mise](https://mise.jdx.dev/getting-started.html), then run:

```sh
mise trust
mise install
mise run setup
mise run dev
```

`mise.toml` pins Node.js 26.8.2 and Bun 1.4.2. Setup installs dependencies from
`package-lock.json` with `npm ci` and installs Playwright's Chromium browser.
Shell activation is optional: `mise run` selects the project runtimes itself.
No global shell changes are needed.

Use `mise tasks` to list commands. Tasks delegate to the existing npm scripts,
so local commands and automated pipelines share the same behavior. Mise does not
automatically load `.env`; Astro and the existing pipeline keep their own
environment handling. See `.env.example` for optional integrations and live jobs.

```sh
mise run check                              # Sample-data build, tests, and dependency audit
mise run preview --host 127.0.0.1 --port 4321 # Preview that build
mise run preview:articles --port 4323        # Unpublished articles at /drafts/
mise run new-post "My post title"           # Create a draft without overwriting files
```

## Commands

| Command | Purpose |
| --- | --- |
| `mise run setup` | Install locked dependencies and Chromium |
| `mise run dev` | Start Astro with hot reload |
| `mise run build` | Build the static site |
| `mise run build:check` | Build with explicit sample podcast data |
| `mise run preview` | Serve the existing static build |
| `mise run check` | Run `build:check`, the full test suite, and dependency audit |
| `mise run audit` | Audit production and development dependencies |
| `mise run test` | Run pipeline, unit, and browser tests against the existing build |
| `mise run test:pipeline` | Check refresh and publishing guards |
| `mise run test:unit` | Run mocked data and content tests |
| `mise run test:browser` | Run Playwright browser tests |
| `mise run test:sync` | Run isolated PostgreSQL integration tests; requires Docker |
| `mise run preview:articles` | Start the local draft preview |
| `mise run new-post "Title"` | Create an unpublished Markdown post |
| `mise run sync:cv` | Import the committed CV artifacts; requires Poppler |
| `mise run refresh` | Sync live data, build, and test |
| `mise run publish` | Run the live pipeline and deploy its verified output |

## Tests and article previews

```bash
mise run build:check   # Explicit sample podcast data; never eligible for publishing
mise run test         # Unit guards + production UI + all six draft visuals, desktop/mobile
mise run test:sync     # Docker + Bun: real PostgreSQL rollback, retry and recovery checks
mise run preview:articles --port 4323
# Open http://127.0.0.1:4323/drafts/
```

`mise run check` runs the sample-data build, full test suite, and dependency
audit in sequence. The audit includes development dependencies and fails on any
reported vulnerability, including low-severity advisories.
Browser tests start their own preview server on port 4321. If that port is in use,
run `PLAYWRIGHT_PORT=44321 mise run check` to use another port. Ordinary `mise run build` keeps
existing development fallbacks, but its output may lack the podcast data required
by browser checks.

The draft preview runs on localhost and needs no live credentials. New articles
remain `draft: true`; normal builds exclude their routes and RSS entries.
`PREVIEW_DRAFTS=true` enables only the `/drafts/` preview routes, not public post listings.
See `docs/article-dates.md` for the project milestones behind their dates.

The build emits `build-health.json`. Live builds and publishing require a live
podcast snapshot at most 48 hours old. Publishing rejects sample data and draft
previews. Browser checks require a populated podcast page, so missing credentials
cannot silently skip the main dashboard test; use `build:check` for local CI.

The Pocket Casts importer uses a transaction and database lock. An API failure
rolls back partial writes; a repeated run does not count the same episode progress
twice. After a long data gap, it refreshes totals and episode state without assigning
all missed listening to the recovery date. The API's limited history cannot recreate
missing daily snapshots. Production sync and publishing run through Argo using
the configured 1Password `nheer Site Jobs` credentials and live-data checks.

## Dependency maintenance

Dependabot proposes weekly npm and GitHub Actions updates. Minor and patch npm
updates are grouped; major updates remain separate for review. Action references
are pinned to release commits. This configuration takes effect after it reaches
the default branch; it does not merge updates automatically.

Runtime versions are pinned in `mise.toml`; keep Netlify's `NODE_VERSION` in
`netlify.toml` aligned with Node when updating it. `mise outdated` checks runtime
updates. Update the pins deliberately, run `mise install` and `mise run setup`,
then verify with `mise run check`. Dependabot does not currently support mise
runtime pins. Netlify builds use `npm ci --include=dev` and the committed npm
lockfile, matching local setup without downloading an unpinned Bun installer.

## CV downloads and preview

The About page displays the designed CV and offers both published PDF editions.
The CV repository remains the source of truth. After updating it, run its
`mise run check-all` task and commit the generated PDFs, then run here:

```sh
mise run sync:cv                         # Uses ../cv at HEAD
mise run sync:cv /path/to/cv <commit>     # Optional repository and revision
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
run, use `mise run refresh` (sync/build/test) or `mise run publish` (also deploys).
Both require the environment variables documented in `.env.example`; publishing
also requires the existing Netlify site ID and deployment token. Production builds
fail if required live data is unavailable. Ordinary `mise run build` retains the
credential-free development fallback.

Run `mise run test:pipeline` to check the local pipeline's failure and overlap guards.
Cluster configuration and migration operations are documented in the homelab
repository's `docs/nheer-workflows.md`. Keep the old GitHub sync workflow disabled
after cutover, and stop Netlify Git builds so only the tested cluster output deploys.

## Tech Stack

- **Framework**: Astro 7
- **Styling**: Tailwind CSS 4
- **Theme**: Tokyo Night
- **Syntax Highlighting**: Expressive Code
- **Tooling**: mise, npm (locked installs), Bun (tests and sync scripts)
- **Deployment**: Netlify

## License

Content is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
