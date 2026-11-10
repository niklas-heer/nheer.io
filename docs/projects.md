# Projects section

`/projects/` lists every project with a write-up, pictures and statistics;
`/projects/<slug>/` is the page for one project. The pages are
`src/pages/projects/index.astro` and `src/pages/projects/[slug].astro`.

## Add a project

1. Create `src/content/projects/<slug>.md`. The slug becomes the URL. The
   frontmatter schema is in `src/content.config.ts` (`projects`); the build
   rejects missing or overlong fields. Required: `title`, `tagline` (at most 80
   characters), `summary` (at most 220), `category`, `status`, `visibility`,
   `started`, `stack` (2 to 6 entries), `cover`, `coverAlt`, and `repo` for a
   public project only. Optional: `homepage`, `docs`, `install` (one line),
   `featured`, `gallery` (up to 4 pictures with `src`, `alt` and `caption`),
   `posts`, `highlights` (exactly 3, at most 60 characters each) and
   `hideActivity`. The body is the write-up in Markdown.
2. Put the images beside it in `src/content/projects/<slug>/` and reference them
   relatively (`cover: "./<slug>/cover.png"`). The cover is 16:10, ideally
   1600x1000 px; gallery images are 1600 px wide. Astro resizes them.
3. Set `featured: <n>` to show the project in the featured cards at the top, in
   ascending order: the first two get large alternating cards, the rest share
   a two-column row. Leave it out otherwise.
4. Set `hideActivity: true` when the dates of the work are themselves private
   (a family trip, for example). The project page then shows no weekly chart, no
   last commit, no commit count and no release date, and gives only the year it
   started; its card omits the last commit. Because this repository is public,
   the snapshot records no dates for such a project either (no first or last
   commit, weekly counts or tag date, marked `"datesHidden": true`), so a private
   one adds nothing to the combined chart on the index. Give `started` as
   January 1 of the year: the content file is public too.
5. Related posts are site paths such as `/posts/2026/02/2026-02-10_slug/`. A path
   that does not match a published post fails the build.
6. Refresh the snapshot (below) and commit the content file, its images and
   `src/data/projects.json` together. A unit test fails while a content file has
   no snapshot entry.

## Public and private projects

This site repository is public, so it never names a private repository.

- `visibility: public` requires `repo: owner/name`. The build fetches its live
  figures and links the repository.
- `visibility: private` must not have a `repo` line; the build fails if it does.
  Its snapshot entry is keyed `private:<slug>`, and the checkout it is measured
  from is named only in the untracked `.projects-local.json` (below). The pages
  never link the repository and the build never sends anything to GitHub for it.

Two tests check this where `.projects-local.json` exists: a unit test scans every
tracked file, and a browser test scans `dist/`, for each private project's
`owner/name` (read from the checkout's `origin` remote) and for its bare
repository name when that differs from the slug. Without the map they only check
that private content files carry no `repo`.

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
`scripts/sync-projects.mjs` from local checkouts. Public entries are keyed
`owner/name`, private ones `private:<slug>`. A public project's checkout is at
`~/Projects/github.com/<owner>/<repo>` (override the root with `--root` or
`PROJECTS_ROOT`) unless the local map names another place. The script only reads
the checkouts: it measures the newest of
`origin/HEAD`, `main` and `master`, exports that tree with `git archive` into a
temporary directory and counts it with tokei. Files marked `linguist-generated`
or `linguist-vendored`, files whose header says they are generated, vendored and
build directories, and prose or data formats (Markdown, JSON, YAML and so on) are
not counted as code. Snapshot weeks are shifted onto the current 52 weeks at build
time; weeks after the snapshot are shown as unknown, not as zero.

A shallow clone (`git rev-parse --is-shallow-repository`) lacks the older
history, so its entry has `"shallow": true`, no commit count, first commit or
contributors, and `null` for the weeks before its oldest available commit, which
the chart shows as unknown.

A figure no source provides is left out of the page rather than shown as 0.

## Local checkout map

`.projects-local.json` in the repository root is gitignored and machine-specific.
It tells the sync where a checkout lives when the default path does not apply:
for every private project (by slug), and for a public repository kept elsewhere
(by `owner/name`). Start from `.projects-local.example.json`:

```json
{
  "checkouts": {
    "garden-planner": "~/Projects/github.com/example-user/garden-planner",
    "example-user/dotfiles": "~/.local/share/chezmoi"
  }
}
```

`~` is the home directory; relative paths are relative to the map file. Pass
another file with `--local <file>`. Without the map, or without an entry for a
private project, the sync keeps that project's existing snapshot entry, and
`--check` passes as long as one exists.

## Refresh the snapshot

```sh
mise run sync:projects                      # every project with a content file
mise run sync:projects -- owner/repo slug   # only these projects
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
