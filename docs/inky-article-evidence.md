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
| Sync job | `scripts/sync-inky.ts`: HN top 5, The New Stack 5, DevOps.com 5; skip known URLs; OpenRouter model from `INKY_MODEL`, default `openai/gpt-5.6-luna` since 2026-09-20; JSON array response; news deleted after 7 days; general pool +2 when below 10, trimmed to 15. Since 2026-09-20 a rejected model/key, a reply without a JSON array, or a count mismatch throws and the script exits 1 | Model name is the current script setting, not a product promise |
| Model history | Commit `4178504` (2025-12-01): "Switch from Claude 3.5 Haiku to OpenAI GPT-5.1-chat" in the same commit as the text-emoticon ban (`:3`, `UwU`, `:tada:`) | The article says the ban and the switch share a commit; it does not claim one caused the other |
| Model comparison script | `scripts/test-inky-models.ts` (rewritten 2026-09-20): runs the real news prompt on three live HN headlines plus the general prompt through models given as arguments; prints, stores nothing | The article's "seven candidates" and results refer to the run recorded below |
| First drawing | Commit `6b83918` (2025-12-01): "kawaii octopus mascot with nerd glasses", "random blinking animations and glow effect", `Inky.astro` at 1,098 lines | The article says "about 1,100 lines" |
| Lottie switch | Commit `bda5dcc` (2025-12-06): `public/animations/octopus.json`, name `octopus v4`, v5.6.3, 500×500, 60 fps, frames 0–360, 15 layers, 188.1 KB; `Inky.astro` shrank from 1,098 to about 180 lines | "A fifth of its size" rounds 180/1098 |
| Production refusal | `REQUIRE_LIVE_DATA` throws when comments are unavailable | Sample builds use fallbacks |
| Homepage terminal | `src/pages/index.astro` `inky`, `sudo`, `rm` commands | Jokes; same in-page comment list |
| Missing mascot | Checked 2026-09-20 with headless Chromium at 1400px on `https://nheer.com/` and `/posts/`: `octopus.json` requested 4 times, `#inky-lottie svg` never mounted. Cause: `27f17d5` (2025-12-01) added `astro:page-load` alongside the direct `initInky()` call and cloned the button; the second pass held a detached element and `lottie.destroy("inky-animation")` removed the attached instance. The Lottie version of the script (`bda5dcc`) inherited that structure | "I don't know for how long" is accurate: no earlier check exists. The article presents the check in Niklas's first person; the check was run by the assistant in this session. Niklas should confirm he is comfortable owning it |
| Fix and test | `Inky.astro`: `data-inky-ready` flag, single `loadAnimation`, one document click listener, `astro:before-swap` cleanup; `tests/inky.spec.ts` covers desktop mount, two distinct lines, client navigation, narrow-screen no-download | Behaviour otherwise unchanged |
| Repo card | Public `niklas-heer/nheer.io` | Inky is not a separate repository |

No author anecdote about why Inky exists was available. The article describes
the implemented behavior and history from commits.

## News sync silence (found 2026-09-20)

Database before the fix (`inky_comments`, active rows): devops 29 (newest
2026-06-05), general 10 (all from 2025-12-01), hackernews 155 (newest
2026-06-08), thenewstack 36 (newest 2026-06-07). Every news row was older than
seven days, so the site read zero news comments. OpenRouter replied to
`openai/gpt-5.1-chat` with "No endpoints found for openai/gpt-5.1-chat"; the
old script turned that into an empty array and exited 0. It is not known when
the model was removed or how many scheduled runs came back empty; the article
says so.

Model comparison run 2026-09-20 (headlines: Pirate Face rescues LLM models,
Qwen-Image-2.1, Sherline Tools closing; OpenRouter list prices per million
tokens in/out):

| Model | Result |
| --- | --- |
| openai/gpt-5.1-chat | rejected: no endpoints |
| openai/gpt-5.6-luna ($0.20/$1.20) | parsed; good voice; 6.5 s. Chosen default |
| google/gemini-3.8-flash ($0.75/$3.75) | reply truncated, no JSON array |
| google/gemini-3.5-flash-lite ($0.30/$2.50) | news parsed; general reply contained a stray non-JSON token |
| deepseek/deepseek-v4.1-flash ($0.15/$0.60) | parsed; funniest lines; 51.9 s |
| qwen/qwen3.8-flash ($0.15/$0.47) | parsed; shorter, flatter; 29.3 s |
| anthropic/claude-haiku-4.5 ($1/$5) | parsed; good; 4.2 s |
| anthropic/claude-sonnet-5 ($2/$10) | parsed; good; 7.5 s |

Cost per sync run at Luna prices: roughly 700 input and 600 output tokens per
call, well under a tenth of a cent. Cost is not a differentiator at this volume;
reliability of the JSON reply and voice are.

Sync run on 2026-09-20 with the new default: 15 new stories, 15 comments added,
general pool at 10 so no generation, 220 news rows older than 7 days deleted.
Table afterwards: devops 5, hackernews 5, thenewstack 5, general 10.

## Personality rewrite (2026-09-20)

Niklas approved an "on-call announcer" persona after a prompt experiment in
a game-show register on the day's headlines. Explicit constraints from him:
Luna stays the model; readers must never be addressed as "crawlers" (or
players/contestants). The persona lives once in `INKY_PERSONA` in
`scripts/sync-inky.ts` and is shared by the news and general prompts.
Formats rotate: achievement with a useless reward, patch note, numbered
incident report, plain announcement to "the surface". Fallback lines
(`FALLBACK_INKY_COMMENTS`), out-of-ink lines (`INKY_EXHAUSTED_LINES`), and the
terminal's asleep line were rewritten by the assistant in the same voice; the
sample lines in the article's evidence are original. `--regenerate` on the
sync drops the pool and refills it, and was run once on 2026-09-20 so the live
corner does not mix voices.

## Visuals

- `InkyDemo.astro`: the actual Lottie octopus (lazy-loaded when the figure
  nears the viewport) with a static SVG poster captured from the rendered
  animation (`public/assets/articles/2026/inky-poster.svg`, 135 KB raw, 34 KB
  gzipped). Uses the same build-time comment list as the corner and the shared
  `src/utils/inky-client.ts` deck logic. Revised 2026-09-20 after review: the
  bubble sits above the octopus with a tail pointing down at him, mirroring
  the corner; Previous/Next buttons walk a history of what he said, and
  clicking him equals Next. Native buttons, disabled until handlers attach;
  first line and poster readable without JavaScript; reduced motion keeps the
  poster and never downloads the animation. After twelve idle seconds only the
  octopus retreats; the bubble stays readable.
- `ArticleFlow`: four-step pipeline naming the model.
- Live mascot remains in the corner for viewports ≥1200px.
- Sample-data and draft preview builds show the five fallback lines; live builds
  show the current mix. The caption adapts, including the zero-news case seen in
  the local database on 2026-09-20 (10 general, 0 news).

## Closest coverage

No published or draft Inky article existed in `src/content/posts`. Homepage
easter eggs and the mascot component are the only prior appearances.

## Open questions for Niklas

1. Own the "he had gone missing" section as first person (both findings were
   made by the assistant in this session), or reword?
2. Keep GPT-5.6 Luna, or prefer DeepSeek V4.1 Flash for voice despite the
   slower replies? `INKY_MODEL` switches it without a code change.
3. Should a failed sync stop publishing (current behaviour: exit 1 stops the
   Argo stage) or only log?
4. Publish date; the corner fix and sync fix are already on main.

## Verification

Recorded after local preview and checks in this session; see the final
summary in the session for the exact commands and results.
