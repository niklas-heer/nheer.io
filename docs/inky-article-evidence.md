# Inky in the corner: evidence and editorial notes

Prepared 2026-09-20, revised the same day. Status: unpublished draft for local
review. Article: `src/content/posts/2026/2026-09-20_an-octopus-in-the-corner.mdx`.

## Voice profile

Read complete recent English articles: Jev (2026-09-19), hub (2026-09-19), tdx
saving (2026-07-17), Kipferl (2026-08-06), projector racing (2026-09-04), and
the 2025 tdx origin post. They open with a concrete object or friction, keep
paragraphs short, introduce tools in plain language, and use restrained dry
humor. Figures answer a reader question and are captioned with scope. Endings
are modest and concrete, often one short line that turns the topic over once
more (projector racing, homelab). No personal memory, motive, or quotation was
invented for Inky.

## Evidence map

| Subject | Evidence | Boundaries |
| --- | --- | --- |
| Desktop-only mascot | `src/components/Inky.astro`: container hidden below 1200px; script returns before the Lottie import; 200px button; `translateX(-90px) rotate(25deg)` rest pose; 0.9s overshoot easing; 12s deactivate | Not a claim about traffic or click rates |
| Comments at build time | `src/utils/inky.ts` `getInkyComments`; up to 10 news from the last 7 days plus all general comments, interleaved 3:1; passed via `define:vars` | Browser does not query Postgres |
| Fallback comments | Exported `FALLBACK_INKY_COMMENTS` (five general lines); used when the database is missing, empty, failing, or when `SITE_TEST_DATA=true` (added today) | Not live news |
| Sync job | `scripts/sync-inky.ts`: HN top 5, The New Stack 5, DevOps.com 5; skip known URLs; OpenRouter `openai/gpt-5.1-chat`; JSON array response; news deleted after 7 days; general pool +2 when below 10, trimmed to 15 | Model name is the current script setting, not a product promise |
| Model history | Commit `4178504` (2025-12-01): "Switch from Claude 3.5 Haiku to OpenAI GPT-5.1-chat" in the same commit as the text-emoticon ban (`:3`, `UwU`, `:tada:`) | The article says the ban and the switch share a commit; it does not claim one caused the other |
| Model comparison script | `scripts/test-inky-models.ts`: same prompt across `openai/gpt-5.1-codex-mini`, `openai/gpt-5.1-chat`, `anthropic/claude-haiku-4.5`, `anthropic/claude-sonnet-4.5`, `anthropic/claude-opus-4.5`, `google/gemini-2.5-pro`; prints, stores nothing | "The choice was taste, not a benchmark" is the article's reading of a script with no recorded results; Niklas should confirm |
| First drawing | Commit `6b83918` (2025-12-01): "kawaii octopus mascot with nerd glasses", "random blinking animations and glow effect", `Inky.astro` at 1,098 lines | The article says "about 1,100 lines" |
| Lottie switch | Commit `bda5dcc` (2025-12-06): `public/animations/octopus.json`, name `octopus v4`, v5.6.3, 500×500, 60 fps, frames 0–360, 15 layers, 188.1 KB; `Inky.astro` shrank from 1,098 to about 180 lines | "A fifth of its size" rounds 180/1098 |
| Production refusal | `REQUIRE_LIVE_DATA` throws when comments are unavailable | Sample builds use fallbacks |
| Homepage terminal | `src/pages/index.astro` `inky`, `sudo`, `rm` commands | Jokes; same in-page comment list |
| Missing mascot | Checked 2026-09-20 with headless Chromium at 1400px on `https://nheer.com/` and `/posts/`: `octopus.json` requested 4 times, `#inky-lottie svg` never mounted. Cause: `27f17d5` (2025-12-01) added `astro:page-load` alongside the direct `initInky()` call and cloned the button; the second pass held a detached element and `lottie.destroy("inky-animation")` removed the attached instance. The Lottie version of the script (`bda5dcc`) inherited that structure | "I don't know for how long" is accurate: no earlier check exists. The article presents the check in Niklas's first person; the check was run by the assistant in this session. Niklas should confirm he is comfortable owning it |
| Fix and test | `Inky.astro`: `data-inky-ready` flag, single `loadAnimation`, one document click listener, `astro:before-swap` cleanup; `tests/inky.spec.ts` covers desktop mount, two distinct lines, client navigation, narrow-screen no-download | Behaviour otherwise unchanged |
| Repo card | Public `niklas-heer/nheer.io` | Inky is not a separate repository |

No author anecdote about why Inky exists was available. The article describes
the implemented behavior and history from commits.

## Visuals

- `InkyDemo.astro`: the actual Lottie octopus (lazy-loaded when the figure
  nears the viewport) with a static SVG poster captured from the rendered
  animation (`public/assets/articles/2026/inky-poster.svg`, 135 KB raw, 34 KB
  gzipped). Uses the same build-time comment list as the corner and the shared
  `src/utils/inky-client.ts` deck logic. Native button, disabled until handlers
  attach; first line and poster readable without JavaScript; reduced motion
  keeps the poster and never downloads the animation. Peek pose mirrors the
  corner's transform. Twelve-second retreat mirrors the corner; the status line
  explains it.
- `ArticleFlow`: four-step pipeline naming the model.
- Live mascot remains in the corner for viewports ≥1200px.
- Sample-data and draft preview builds show the five fallback lines; live builds
  show the current mix. The caption adapts, including the zero-news case seen in
  the local database on 2026-09-20 (10 general, 0 news).

## Closest coverage

No published or draft Inky article existed in `src/content/posts`. Homepage
easter eggs and the mascot component are the only prior appearances.

## Open questions for Niklas

1. Own the "he had gone missing" section as first person, or reword to a
   passive "a check while writing this found"?
2. Is "the choice was taste, not a benchmark" true to why GPT-5.1 Chat stayed?
3. Publish date and whether the corner fix should ship before the article.

## Verification

Recorded after local preview and checks in this session; see the final
summary in the session for the exact commands and results.
