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
