# Quirl evaluation article: evidence and editorial notes

Prepared 2026-09-19. Status: draft for local review, not approved for publication.
Article: `src/content/posts/2026/2026-09-19_when-the-benchmark-answer-is-wrong.mdx`.

## Voice analysis

Read complete recent English posts: Quirl (`2026-08-23_shell-two-pipelines.mdx`),
tdx (`2026-07-17_saving-a-markdown-file.mdx`), projector racing
(`2026-09-04_projector-racing.mdx`), Sceno
(`2026-07-19_diagrams-that-explain-themselves.mdx`), and Kipferl
(`2026-08-06_small-python-cli.mdx`).

- Openings start from a recognizable problem or an actual personal memory;
  they reach the subject quickly, often with a short comic turn.
- Short paragraphs alternate with fuller technical explanations. Headings
  develop the argument instead of following a standard release-note template.
- Humor concerns the awkwardness of the task, with restrained callbacks at the
  end. Technical limits remain plain and specific.
- First-person motivation is supported by author context. No new memory,
  reaction, chronology of discovery, or spoken quote is invented in this draft.
- Real examples and visuals carry claims. The prose introduces a question before
  a figure and interprets the result afterward.

The original Quirl article concerns shell habits and mode boundaries. This draft
instead follows one evaluator error; it does not retell the origin story.

## Claim map and visual provenance

Primary source revision:
[`593af98bb7e6e4ba56d7de1d3f81ebc109274aa9`](https://github.com/niklas-heer/quirl/commit/593af98bb7e6e4ba56d7de1d3f81ebc109274aa9).

| Claim or visual | Evidence | Limits |
| --- | --- | --- |
| Catalog of 62 commands, choice alternatives, no execution/integration | `docs/benchmarks/jev-command-search.md`, setup/interpretation | Research scope, not a production feature |
| Original request, expected NONE, returned tree, incorrect verdict | `spikes/jev-command-search/evidence.json`, `stress-command-07` request and result | Inspected retained result; not rerun |
| tree/eza label correction | Report's “Incorrect expected label” section and evidence corrections | Apparent size vs disk allocation not separately tested |
| 112 distinct cases, 111 validated acceptable, 1 unassessed | Report result and anomalies | Corrected labels; exploratory challenge set |
| 144 calls include 32 order-reversal runs | Report measurement table | Not 144 unique cases |
| Preserve responses before validation | Report's unclassified rejection section and saved harness | Cannot recover the lost response |

`EvaluationEvidence.astro` draws original HTML/CSS illustrations from those
facts. The expandable catalog uses a native `details` control; it neither calls
Jev nor executes commands. The 112-square grid encodes the corrected outcome
counts, labels the unresolved case, and explicitly disclaims production accuracy.
No generated images or fictional performance data are used. Presentation is
arranged for explanation, not represented as a terminal screenshot.

## Drafting and review

A bounded Codex CLI pass through existing ChatGPT authentication produced the
initial prose with `gpt-6-astra` and read-only sandboxing. It made no tool calls.
The final MDX was edited against the source evidence and the five voice samples,
with a clearer opening, sections, and the two visual explanations. Working input,
raw output, and logs remain in ignored hub scratch space. No new billing route
or external writing provider was configured.

The source evidence, original test-case record, and revised prose were inspected.
No benchmark or shell-command demo was reproduced for this article. Niklas's
review remains the test of whether the voice and emphasis are right.

Verification completed:

- `rtk mise run check` passed: sample-data production build, pipeline/unit checks,
  26 browser tests, and zero reported dependency vulnerabilities.
- Focused draft checks at 1280px and 390px passed: entry through the draft index,
  disclosure expansion/collapse with Enter and Space, no horizontal overflow,
  and no browser page errors. The catalog disclosure also works without JavaScript.
- Inspected screenshots of the desktop comparison, mobile comparison, and mobile
  result grid; all text and controls fit. Opened the actual draft in Arc.
- Normal build has no article HTML route/content and no entry in homepage,
  post index, or RSS. Astro emits a standalone CSS asset for the imported draft
  component; it contains no article content.
- Preview remains at `http://127.0.0.1:4323/drafts/2026/2026-09-19_when-the-benchmark-answer-is-wrong/`.

The focused checks were a one-off editorial verification, not new permanent
test infrastructure. No publishing command was run and `draft: true` is retained.
