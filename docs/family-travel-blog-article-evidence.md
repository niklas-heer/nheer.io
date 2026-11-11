# Family travel blog article: evidence notes

Draft: `src/content/posts/2026/2026-11-11_family-travel-blog-from-telegram.mdx` (`draft: true`).
Requested by Niklas on 2026-11-11: the family blog with the Telegram workflow, what he learned with
Astro and GitHub CI, and why Cloudflare is probably the better platform.

The blog's repository is private. Its name, domain, password and bot handle stay out of this public
repository; the private source list is in the hub
(`research/2026-11-11-family-travel-blog-article-sources.md`). No screenshots of posts: every post
shows family photos. On 2026-11-11 Niklas approved the home page header (it shows the three first
names, the trip dates and Gaildorf) and supplied a Telegram screenshot.

## Voice profile

Samples read: `2026-09-07_homelab-for-the-family.mdx` (family audience, similar genre),
`2026-09-19_the-repository-between-my-repositories.mdx`, `2026-09-20_an-octopus-in-the-corner.mdx`,
`2026-09-19_small-questions-with-jev.mdx` (frontmatter and components), plus
`src/content/projects/travel-blog.md`, which already describes the project.

- Opens with a plain first-person need, then the familiar friction, then what was built.
- Short paragraphs, contractions, modest claims; limits stated in first person beside the claim.
- Subject headings, not theses. Bold lead-ins for a short list of lessons (homelab, hub).
- One dry line at most; the "21 minutes is a long time to stare at a phone" line is it.
- Figures are introduced before and interpreted after.

## Claims and sources

| Claim | Source |
| --- | --- |
| 92 updates, 343 photos, 40 places; all carried over | Blog repository's Cloudflare migration document (field-by-field check) |
| 73 via Telegram | 73 successful `telegram-post` runs; 73 `Post:` commits by `github-actions[bot]` |
| 59 / 21 / 12 by author | `author:` frontmatter of the 92 published posts |
| 15 push sign-ups (devices, not people) | Migration document: 15 push sign-ups imported |
| First updates via Claude Code PRs; bot live on day two | PR merges #4–#22 on days one and two; bot PR #26 merged on day two |
| Voice notes, timeline-first prompt, privacy rules, `/edit`, `/add`, `/undo`, "Try again" | Vercel-era agent guide and commits #29, #33, #38, #41, #46 |
| "Could not name this location" on the third morning, fixed the same morning | Failed run log on day three; fix commit #31 minutes later |
| Content collections fail the build, build-time images, data saver | Vercel-era agent guide |
| ~165 pages per build; 15 s cold / 1 s warm images | Platform design document; commit #37 |
| ~60 ms TTFB from South Africa (static) | Prototype results: 61–65 ms via Globalping probes |
| No concurrency group; queued runs were cancelled | Bot PR #26 review fixes; `telegram.yml` comment |
| `GITHUB_TOKEN` pushes start no workflow | `deploy.yml` comments |
| Vercel Git builds finished up to 45 min late, two posts offline; three-part fix | Commit #39 message, `scripts/deploy.mjs` header |
| Hobby refused private-repo commits by others | `telegram.yml` comment ("seen with its Git builds") |
| 79 s median, once 21 min | 87 successful bot runs: run created → run finished (dispatch to reply). The post says "from the moment GitHub created the workflow run". |
| 25 paired posts: 84 s vs 4.5 s median; 11–60×, 20× median | `mirror` run logs: live run created→updated vs "ms with upload" for posts logged as `new` |
| Prototype: uncached 320–730 ms from ZA; reaction 59–69 ms; $5 plan already held | Prototype results section of the design document |
| TanStack: more code (1,874 + 713 CSS vs 835 lines), ~160 KB JS | Framework comparison in the design document |
| Cut over on 10 November; logged-in readers stay logged in; tag `vercel-final`; DNS rollback | Migration document |
| Telegram bot retired; site posts are not translated | Migration document |
| Blob 2,000 writes a month on the free plan, view counts in Upstash Redis, ETag retries for reactions | Vercel-era agent guide (reactions and view counts) and the design document's "Why" |
| Authors now post on the site after a passkey sign-in | Migration document ("Posting") |
| Cached TanStack Start pages 60–122 ms (South Africa), 148–154 ms (Germany); static 61–65 / 35–55 ms | Framework comparison and prototype results, same Globalping probes |
| 87 runs = 73 new posts + 14 edits | GitHub Actions run list of the publish workflow |
| Mirror pairs from 22 October | First mirror run on the evening of 21 October (UTC); the first paired post is from 22 October |

Comparison limits, stated in the figure caption and prose: the mirror received photos already resized
by the live pipeline and wrote no translation; the Cloudflare time includes the upload from the GitHub
runner but the two clocks measure different spans.

## Interpretation and author questions

- "My parents", the public places and the reading of "GitHub CI tags" (Actions lessons plus the
  `vercel-final` tag) were confirmed by Niklas on 2026-11-11 ("sounds good").
- "Well received at home": the author's statement in the request; no quotes invented.
- Shown through the approved header: the three first names, the trip dates and Gaildorf. Still left
  out: the domain, the bot handle, other relatives' names.

## Visuals

- `family-blog-header-desktop.webp` and `-phone.webp`: the live home page header captured on
  2026-11-11 with Playwright (1280 px light, 390 px dark, 2× scale), cropped above the notification
  card. Nothing else on the page is shown.
- `family-blog-telegram-chat.webp`: Niklas's own screenshot of the bot's last post of the trip
  (3 November, 11:42 to 11:44 local time). The shared location map (a residential street), the post's
  URL, the domain in the link preview and the bot's display name in the two reply quotes are blurred with ffmpeg `boxblur`; the original stays out of
  the repository.
- `ArticleMetrics` (counts above), `ArticleFlow` (the three publish steps), `MermaidDiagram`
  (production layout on Cloudflare).
- `TravelDeployRace.astro`: schematic, not to scale; labelled as such.
- `TravelPublishTimes.astro`: the 25 measured pairs, one linear scale, medians marked, full table in
  a native `details` element.

## Checks (2026-11-11)

- Inky: 8 lines generated; the Telegram line was corrected (it claimed the road lookup failed
  silently). `inky-heckle.ts --check` reports the post current.
- Draft preview at 1280 px and 390 px with Playwright: every figure inspected, no page errors, no
  horizontal overflow. The race figure's last segment was clipped and the Mermaid layout crossed
  itself; both fixed and re-inspected.
- `PLAYWRIGHT_PORT=44321 rtk mise run check`: pipeline tests 21 passed, 1 skipped, 0 failed; 55
  browser tests passed; npm audit found 0 vulnerabilities.
- Normal sample-data build: no HTML, post list or RSS entry references the draft. A CSS chunk is
  emitted under the post's file name (`_astro/2026-11-11_family-travel-blog-from-telegram.*.css`),
  unreferenced, styles only.

## Council review (2026-11-11)

Niklas asked for a council of GPT-6.1 Sol and Claude Fable 5.2 before publishing. Round 1: both 8/10.
Fixed: the 79 s span and the 87 runs (73 posts + 14 edits), the concurrency default, the race figure
(Post 1's own Action deploy, Vercel Git builds only in "Before"), cached timings with measured numbers,
"push sign-ups" instead of readers, the mirror wording, the bot's display name blurred, and several
style points. Round 2: Sol 9/10, Fable 8.5/10, both satisfied; Fable's last item (the "Readers see"
lane on a different scale than the build lanes on desktop) was fixed and measured aligned at 1280, 760,
390 and 320 px. Left unchanged on purpose: the title, the figure titles and the Cloudflare heading.

With `draft: false`, `rtk mise run check` passed (pipeline, unit, 55 browser tests, audit) and the
post appears on the home page, the post list and in RSS. The project page links it.
