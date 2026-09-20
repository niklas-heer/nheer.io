# Evidence notes: "The compiler can yell at somebody else now"

Prepared 2026-09-20 from Niklas's spoken brief, repository histories, and the
linked public sources. Status: published 2026-09-20 on Niklas's instruction.
Article: `src/content/posts/2026/2026-09-20_the-compiler-can-yell-at-somebody-else.mdx`.
Personal motivations, memories, and reactions are the author's account and are
marked as such in this file. Everything else was checked against a primary source
on the date above.

## Author's account versus repository evidence

| Author's memory | What the sources show | Handling in the article |
| --- | --- | --- |
| The first Rust implementation in speed-comparison (2018) took significantly longer than the other languages. | Python, PHP and Rust were committed within 17 seconds of each other at 20:05 on 2018-02-17, after an initial commit at 16:32. The log cannot measure per-language effort. The Rust file is 24 lines to Python's 16 and is the only one of the first five with `.expect`, `.unwrap`, `parse::<i32>` and an `as f64` cast; a clarifying f64 comment followed seven minutes later. | Told as memory; the article says explicitly that the log cannot confirm it and shows what it can show. |
| "Maybe 2018 or so", "10 or 12 languages" in the first batch. | 2018-02-17 is correct. 12 entries by the end of 2018-02-18; 17 by 2018-03-02. | Exact dates and counts used. |
| tdx: the first thought was Python; Bun with Ink is what got built, and it shipped the same way Python would have (a script around a bundled runtime). | First commit 2025-11-21: "implement tdx CLI todo manager with Bun and TypeScript" (Ink). The 2025 post reports ~90 MB; its comparison image reports 59 MB versus 4 MB for Go. Go migration on 2025-11-22. | Author's account (2026-09-21): Python first, then Bun; the article no longer frames this as a misremembering. Both size numbers are named. |
| Go was the initial plan for Kipferl but C interoperability forced Zig. | No Go code in the history. The first README (2025-12-16) compares "Go + Charm ~10MB" and "Rust + Ratatui ~5MB, Hard" against MicroPython. | Presented as the author's account, consistent with the README table. |
| The Rust rewrite of Kipferl made it smaller and faster and caught bugs. | Retrospective: startup median 4.332 ms (Zig) to 7.044 ms (Rust); ARM64 size 2.31 MB to 3.98–4.77 MB. Tree shaking in the same release: minimal app 1,450,837 bytes. Bugs found in the 2026-09-05 review pass, not in the port itself. | Article gives the slower/larger numbers first, then tree shaking, then the review findings. |
| Agentic work on speed-comparison began "around 2025". | Return on 2025-12-04; CLAUDE.md on 2025-12-05; 270 commits in December 2025. | Exact dates used. |
| The Zig creator's reply was "mean" to Bun's creator. | Kelley's post (2026-07-09) argues practices, not the language; contains "net liability", "unreviewed slop" and personal remarks; ends by acknowledging resentment, wishing Sumner well "by his own standards", and apologizing to Zig users. | Reaction stays the author's; Kelley's position summarized with his closing acknowledgement included. |

## Source list

speed-comparison (`niklas-heer/speed-comparison`, local clone, fetched 2026-09-20):

- Initial commit 54f3cfd (2018-02-17 16:32 +0100); Python 5d7fdcc, PHP 5c8a0e2, Rust 2d1e9db (20:05); f64 comment 2440f62 (20:12); JS 7d7951d (20:30); Go a93334c (21:18).
- First README results a39d701: Python 3.6.3 real 0.34 s, PHP 7.1.14 real 0.06 s, rustc 1.22.1 real 0.12 s. Script 5bd3a57 compiled with `rustc leibniz.rs`, no optimization flag; Dockerfile f1d1773 used Alpine 3.7 packages.
- Release-profile fix 40991e2 (2021-05-14, yinheli): "rust speed compare should use release profile", adding `-C opt-level=3`.
- Commits per year from `git log`: 2018 72, 2021 7, 2022 290, 2023 21, 2024 8, 2025 272, 2026 88 (to 2026-09-20). December 2025: 270.
- Last own non-merge commit before the return: 4a7721f (2023-11-09). Return merges 315f823 through 4bcc86f (2025-12-04 22:13–22:24); first agent-era commits c147ea0 onward (22:54); CLAUDE.md 40feda6 (2025-12-05).
- Pull requests via `gh pr list --state all`: 209 total; 16 open on 2025-01-01 (created earlier, closed 2025-12-04/05 or still open), oldest #57 (2022-10-18). Issues: 20 open on 2025-01-01.
- Catalog: 76 `Language(` entries in `pipeline/languages.py` at HEAD (languages and variants).

tdx (`niklas-heer/tdx`): commits 3095a18/06d7ac8 (2025-11-21), ba4fbd8 (2025-11-22, Go migration), a88e9e3 (2026-09-05, "isolate the editor and evaluate Rust trade-offs (#20)") with `experiments/rust-eval/README.md`: Rust 10–11× faster on matched parse/patch, 0.63 MiB versus 3.75 MiB probe binaries, Go fresh build 3.29 s versus Rust 6.58 s, production Go operation about 3 ms for 1,000 tasks; recommendation "keep tdx in Go for now".

Kipferl (`niklas-heer/kipferl`): ac602ee (2025-12-16 04:46, proof of concept), 4b7ee9c (05:07, Zig CLI), 65edd82 (05:16, remove Python CLI), 0d76f79 (2025-12-20, PocketPy), FAQ commit 89558e5, v0.5.0 (2025-12-21), PR #5 (2026-08-04 08:03 UTC) with the "over 28,000 lines coupled to pre-1.0 Zig APIs" rationale, port PRs #6–#35 the same day, v0.6.0 (2026-08-05). `RUST_MIGRATION.md` and `docs/rust-review.md` (2026-09-05) for the lint set and findings. Retrospective: <https://kipferl.dev/blog/rust-migration> (numbers quoted in the article).

Other repositories: Quirl first commit 2026-08-15, strict lints 0602177 (2026-08-25); vrdx 22b181c (2026-09-12, "migrate to Rust with Ratatui and Premise"), stable-Rust decision 2026-09-19; Latchrun and Kindred first commits 2026-09-19; the private hub's Rust tooling decision 2026-09-19 (private repository, not linked).

External:

- Jarred Sumner, "Rewriting Bun in Rust", 2026-07-08: <https://bun.com/blog/bun-in-rust>
- Andrew Kelley, "My Thoughts on the Bun Rust Rewrite", 2026-07-09: <https://andrewkelley.me/post/my-thoughts-bun-rust-rewrite.html>
- The Register, 2026-07-14: <https://www.theregister.com/devops/2026/07/14/zig-creator-calls-buns-claude-rust-rewrite-unreviewed-slop/5270743>
- Zig 0.16.0 release notes (2026-04-14): <https://ziglang.org/download/0.16.0/release-notes.html>
- Linus Torvalds at Open Source Summit Korea, November 2025, quoted by The New Stack: <https://thenewstack.io/rust-goes-mainstream-in-the-linux-kernel/>

## Visual provenance

- `RustFirstContact.astro`: both programs verbatim from commits 5d7fdcc and 2d1e9db; shebang and encoding lines omitted from the Python file. Static HTML.
- `LanguageArrivals.astro`: dates from the commit log above. Static HTML; a screen-reader summary lists the same data.
- Commits per year, first results, return metrics, migration metrics: `ArticleComparison` and `ArticleMetrics` with the values listed above.
- `LintCatches.astro`: six findings paraphrased from `docs/rust-review.md` at Kipferl HEAD on 2026-09-20. The "lint" column names the rule family; the review document does not attribute each finding to one lint by name, and the caption says so.
- `RustLandings.astro`: dates from the repositories' first commits as listed above.
- No screenshots or recordings were made; no command in the article was rerun for this draft.

## Voice profile used for drafting

Samples: `2026-02-10_what-a-benchmark-measures.mdx`, `2026-08-06_small-python-cli.mdx`, `2025-11-29_building-tdx.mdx`, `2026-08-23_shell-two-pipelines.mdx`, `2026-09-19_small-questions-with-jev.mdx`. Observations: concrete openings, short paragraphs, dry asides at paragraph ends, modest measured claims with scope stated, sentence-case headings, quiet endings that return to the opening image. The Codex writing route was unavailable (subscription usage limit until 2026-09-26); a Cursor CLI pass with Grok 4.6 was used for a first prose draft, then revised in the session.

## Open questions for the author

- Was Go really considered first for Kipferl before Zig? The README table suggests so, the history does not record it.
- The Linux kernel angle is the author's reading at the time; no specific thread is cited.
- The tdx binary size: the article now names both 59 MB and 90 MB, the author's own numbers from November 2025.

## Revisions

- 2026-09-21: the tdx section was rewritten on the author's instruction. Python
  was the first idea, Bun with Ink was what got built, and the point is that
  Python would have shipped the same way. The "remembered wrong" framing and its
  Inky line were removed; the new heading is "A todo list with a runtime inside"
  and its line was written by hand. Three internal post links were missing the
  month segment and were fixed.
- 2026-09-21, second pass: title changed to "Rust's compiler can yell at the
  agent now"; headings "What the log can and cannot say", "Two years of nobody,
  then one evening", "Three host languages in eight months" and "Wherever I can,
  and where I cannot" replaced with plainer ones. The Kipferl section no longer
  claims three host languages: one Python runtime swap (MicroPython to PocketPy)
  and one host swap (Zig to Rust). The first-contact figure is now highlighted
  with Shiki, and the closing configuration is a single copyable prompt
  (`PromptCard.astro`) that still shows Cargo.toml and clippy.toml separately.
