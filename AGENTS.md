# nheer.io

Personal website and blog, built with Astro and Tailwind CSS and hosted on Vercel.

Read [README.md](README.md) for setup and development, and [docs/vercel-migration.md](docs/vercel-migration.md) for deployment status, token setup and DNS records.

- Install [mise](https://mise.jdx.dev/getting-started.html) first; it owns the toolchain versions for this checkout.
- Content and site code are the normal working area. Treat `docs/` runbooks as the source of truth for deployment procedure.
- Posts from 2025 onward carry Inky's per-section lines in their frontmatter. When writing or restructuring a post, follow `.agents/skills/inky-heckles/SKILL.md` (also linked from `.claude/skills/`) before opening the preview; a published post with missing or stale lines fails the unit tests.
- Keep credentials in 1Password. Never commit a resolved token, a `.env` file, or database output.

## Credentialed local jobs

`scripts/refresh-site.mjs` and `scripts/sync-cv.mjs` need `GITHUB_TOKEN`, `HARDCOVER_API_TOKEN`, `OPENROUTER_API_KEY`, `VERCEL_TOKEN` and `DATABASE_URL`. Building, testing and `astro dev` do not.

For a session that runs those jobs more than once, use Latchrun so the vault is unlocked once instead of per command. Copy `.latchrun/example.json` to `.latchrun/local.json`, replace the placeholder absolute paths and the `op://` field references with the real ones, then:

```sh
latchrun session start nheer-io --profile .latchrun/local.json
```

Only the commands listed in that profile are permitted. To add one, stop the session, add the complete command, and resume it with the profile. This is a convenience for interactive work and is not required by any build or test task.
