# Projects section

`/projects/` lists every project with a write-up, pictures and statistics;
`/projects/<slug>/` is the page for one project. The pages are
`src/pages/projects/index.astro` and `src/pages/projects/[slug].astro`.

## Add a project

1. Create `src/content/projects/<slug>.md`. The slug becomes the URL. The
   frontmatter schema is in `src/content.config.ts` (`projects`); the build
   rejects missing or overlong fields.
2. Put the images beside it in `src/content/projects/<slug>/` and reference them
   relatively (`cover: "./<slug>/cover.png"`). The cover is 16:10, ideally
   1600x1000 px; gallery images are 1600 px wide. Astro resizes them.
3. Set `featured: <n>` to show the project in the large cards at the top, in
   ascending order. Leave it out otherwise.
4. Related posts are site paths such as `/posts/2026/02/2026-02-10_slug/`. A path
   that does not match a published post fails the build.
5. Refresh the snapshot (below) and commit the content file, its images and
   `src/data/projects.json` together. A unit test fails while a content file has
   no snapshot entry.

Private projects (`visibility: private`) still name their `repo` so the snapshot
can find the checkout, but the pages never print or link it, and the build never
sends it to GitHub. A browser test scans the built site for private repository
names.

## Live and snapshot data

| Figure | Public project | Private project |
| --- | --- | --- |
| Stars, forks, open issues, license | live | not shown |
| Latest release | live GitHub release, else newest version tag in the snapshot | snapshot tag |
| Last commit, total commits | live, else snapshot | snapshot |
| Languages | live, by bytes (GitHub's colours) | snapshot, by lines of code |
| Weekly commits (52 weeks) | live | snapshot |
| Lines of code, files, contributors, first commit | snapshot | snapshot |
| "Older work" stars | live | |

**Live** data comes from the GitHub GraphQL API at build time
(`src/utils/projects.ts`). All public repositories are fetched with aliased
queries, six per request, including one `history(since:, until:)` count per week.
It follows the site's conventions: `SITE_TEST_DATA=true` (used by
`mise run build:check`) uses deterministic sample figures without network
access; `REQUIRE_LIVE_DATA=true` (production builds) fails the build if GitHub
cannot be reached; otherwise a failure omits the live figures. A public
repository GitHub reports as missing is skipped with a warning.

**Snapshot** data is `src/data/projects.json`, written by
`scripts/sync-projects.mjs` from local checkouts at
`~/Projects/github.com/<owner>/<repo>` (override with `--root` or
`PROJECTS_ROOT`). The script only reads them: it measures the newest of
`origin/HEAD`, `main` and `master`, exports that tree with `git archive` into a
temporary directory and counts it with tokei. Files marked `linguist-generated`
or `linguist-vendored`, files whose header says they are generated, vendored and
build directories, and prose or data formats (Markdown, JSON, YAML and so on) are
not counted as code. Snapshot weeks are shifted onto the current 52 weeks at build
time; weeks after the snapshot are shown as unknown, not as zero.

A figure no source provides is left out of the page rather than shown as 0.

## Refresh the snapshot

```sh
mise run sync:projects                      # every project with a content file
mise run sync:projects -- owner/repo        # only these repositories
mise run sync:projects -- --check           # verify every content file has an entry
```

A missing checkout is reported and its previous entry kept; the run exits
non-zero only if a project has no entry at all. Clone missing repositories with
`repot clone https://github.com/<owner>/<repo>`. Run the sync after notable work
on a project; the checkouts are not fetched, so pull them first if they are
behind. No credentials are needed.

## Older work

`src/data/projects-archive.json` is an optional array of
`{ "repo": "owner/name", "name": "...", "year": 2018, "note": "one line", "url": "optional" }`.
The index lists it newest first with live star counts; the link goes to `url`
or, without one, to the repository.
