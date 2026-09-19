# Jev across projects: evidence and editorial notes

Prepared and revised 2026-09-19. Status: unpublished draft for local review.
Article: `src/content/posts/2026/2026-09-19_small-questions-with-jev.mdx`.

## Editorial direction and voice

The first draft focused on a Quirl benchmark's mistaken expected answer. Niklas
requested more context, then a broader article explaining Jev, how he has used
it across repositories, and the potential use cases. This replaces that draft;
the benchmark disagreement is now one example rather than the whole story.

Read complete recent English articles about Quirl, tdx, projector racing, Sceno,
and Kipferl. They start with concrete friction, use short conversational paragraphs,
explain technical detail through examples, and use restrained dry humor. Figures
follow a reader question and are interpreted in the surrounding text. The new
article introduces the hub, Jev, typed outputs, question types, and Quirl before
depending on those concepts. Prior posts are optional reading.

No new personal memory, reaction, or quotation was invented. The actual editorial
feedback supports the paragraph about broadening this article. The original
benchmark correction is described as an observed record change, not a claim
that Niklas personally authored the evaluator or discovered the error unaided.

## Evidence map

The hub integrations were inspected locally through implementation, command
documentation, dated live-run notes, and this editorial run. Private source
details remain in the hub's `research/2026-09-19-storytelling.md`; the article
links public workflow guidance, not inaccessible private repository URLs.

| Subject | Evidence and status | Boundaries retained |
| --- | --- | --- |
| Jev's programming model and question types | Official TypeSafe introduction, primitives, Choice, Score, Noul and confidence docs fetched 2026-09-19 | Typed output does not establish factual truth; no general speed, cost or accuracy claim |
| Knowledge capture | Rust implementation and live six-case evaluation; public capture-knowledge skill | Recommendation only; caller verifies/writes; provisional threshold; fixtures were sanitized examples |
| Project naming | Rust request construction and documented successful live Codex/Jev rankings of the same three-candidate report | Codex generates; code checks registries; Jev judges fit; no accepted name or verified clearance |
| Taplume example | Recorded relative preference and weak-to-acceptable fit assessments; subsequent third-party app listings | Listings are leads, not verified first-party conflicts |
| Quirl | Public commit `593af98bb7e6e4ba56d7de1d3f81ebc109274aa9`, benchmark report and original response bundle | Experiment, no command execution or shipped integration; corrected label and unresolved rejection |
| Blog selection | Actual four-candidate oracle batch in this workflow; Codex prose generation; author's follow-up messages | Jev recommended the narrow benchmark story; the author supplied the broader framing |

Public source links:

- [TypeSafe introduction](https://docs.typesafe.ai/introduction)
- [Question types](https://docs.typesafe.ai/primitives), [Choice](https://docs.typesafe.ai/primitives/choice), [Score](https://docs.typesafe.ai/primitives/score), [Noul](https://docs.typesafe.ai/primitives/noul), [confidence](https://docs.typesafe.ai/confidence)
- [Capture workflow](https://github.com/niklas-heer/dotfiles/blob/94e407f/dot_agents/skills/capture-knowledge/SKILL.md)
- [Naming workflow](https://github.com/niklas-heer/dotfiles/blob/94e407f/dot_agents/skills/find-project-name/SKILL.md)
- [Storytelling workflow](https://github.com/niklas-heer/dotfiles/blob/94e407f/dot_agents/skills/storytelling/SKILL.md)
- [Quirl experiment](https://github.com/niklas-heer/quirl/blob/593af98bb7e6e4ba56d7de1d3f81ebc109274aa9/docs/benchmarks/jev-command-search.md)

## Writing and visuals

A second bounded Codex CLI writing pass used the existing ChatGPT authentication
and `gpt-6-astra`, with read-only sandboxing and no tool calls. Its supplied
brief included verified use cases, the reader's assumed knowledge, the five-post
voice profile, and the author's revised scope. The output was edited for clear
attribution and source limits. Working files remain in ignored hub scratch.

`JevWorkbench.astro` replaces the benchmark-specific component. One figure shows
the caller/Jev/caller division of work. The other uses native disclosure controls
to explain Choice, Score, and Noul with questions from the actual workflows.
They show no invented model scores, make no API calls, and require no JavaScript.
These are explanatory diagrams, not product screenshots or live demonstrations.

Verification of the revised article:

- `rtk mise run check` passed: sample-data production build, pipeline/unit/browser
  checks, and dependency audit.
- Draft checks passed at 1280px and 390px, entering through the draft index.
  All three question disclosures work by keyboard; no horizontal overflow or
  browser page errors. The disclosures also work with JavaScript disabled.
- Inspected rendered desktop/mobile flow diagrams and the expanded mobile question
  cards. Opened and visibly verified the revised article in Arc.
- The normal build excludes its article HTML route/content and its homepage,
  post-index and RSS entries. It retains `draft: true`; no publication was run.
- Local preview: `http://127.0.0.1:4323/drafts/2026/2026-09-19_small-questions-with-jev/`.

## Visual revision after local review

Niklas found the latter half dry and asked about existing components and Mermaid.
The site has no Mermaid integration. Reused `ArticleFigure.astro` for both existing
Jev figures and three new `JevCases.astro` figures instead of adding a renderer:

- A side-by-side comparison separates Taplume's relative preference from its
  weak-to-acceptable absolute fit. No numerical scale or clearance is invented.
- A command-selection disagreement lets the reader reveal the recorded catalog
  evidence with a native disclosure. The exact request and command flags come
  from the preserved Quirl case, not an interactive shell or a new model call.
- A vertical timeline follows the actual recommendation, Codex draft, author
  feedback, and broader article. It explains why selecting a story and framing
  it for readers are distinct parts of writing.

Figures now accompany the naming, command, and editorial sections. The closing
returns to these concrete examples; speculative inbox use and repeated general
caveats were removed. All figures are HTML/CSS with textual labels, no animations,
no API requests, and no new runtime dependency. Native disclosures work without
JavaScript. These are explanations of recorded work, not product demonstrations.

Verification of this visual revision:

- Production build, pipeline/unit checks, and all 26 browser tests passed.
  The final dependency audit could not run: npm returned HTTP 503 maintenance,
  including on a separate retry. This revision adds no dependencies.
- All five figures checked at 1280px and 390px. Every disclosure toggles with
  Enter and Space; the new evidence reveal also works with JavaScript disabled.
  No horizontal overflow or browser page errors after refreshing the preview's
  stale dependency cache through Astro's stop/start commands.
- Inspected desktop/mobile figure screenshots and the actual refreshed Arc tab.
  The preview remains at the same URL. Normal-build HTML and feeds exclude the
  draft title and slug.

## Reusable component integration

Niklas subsequently explicitly requested Mermaid support and reusable dashboard
numbers. This supersedes the earlier choice to leave Mermaid unsupported. The
introductory workflow now uses `MermaidDiagram`; the recorded Quirl totals use
`ArticleMetrics` (112 cases, 111 acceptable after correction, 1 unassessed).
No new measurements were introduced. The remaining explanatory components stay
in place. The shared library, tradeoffs, gallery, and authoring recipes are in
`docs/article-components.md`.

The actual revised draft rendered successfully at 1280px and 390px. Inspected the
Mermaid workflow and result cards at both widths, with no browser page errors or
horizontal overflow. The broader site/component checks and npm audit limitation
are recorded in that component guide. The article retains `draft: true`.

## Publication and layout components

Niklas asked for the article to use the newer reusable components where they make
sense, and for the draft flag to be removed. Added on 2026-09-19:

- `ArticleStep` numbers the six sections (01–06) with an icon, matching the hub
  article's treatment. The headings still read on their own; the numbers and icons
  are decorative and marked `aria-hidden`.
- `ArticleFlow` shows the knowledge-capture handoff as four steps: gather the
  candidate and its evidence, ask the three bounded questions, combine the typed
  answers into one recommendation, verify before anything is written. This section
  previously had no figure. The steps restate the documented command behaviour;
  no new measurement or threshold is claimed.
- `ArticleSplit` (`wide`, media right, top aligned) places the editorial paragraphs
  beside the existing `JevCases` timeline. The copy avoids spatial wording, because
  the visual moves below the prose under 721px.

`ArticleComparison` was deliberately not used. The only measured values in the
article are the Quirl totals (112 unique cases, 111 acceptable, 1 unassessed).
Those are a part-to-whole count already carried by `ArticleMetrics`; rendering
them as bars on a shared zero-based scale would show two near-identical bars and
imply a comparison the experiment did not make. No illustrative numbers were
invented to justify a chart.

Frontmatter now carries `draft: false` rather than omitting the key. The schema
defaults `draft` to false, but `tests/site.spec.ts` selects published interactive
articles by matching a literal `draft: false` line; omitting it let the article
reach the homepage while the test's expected "latest three" still named an older
post, which failed that check.

Verification on 2026-09-19 after this revision:

- `rtk mise run check` passed: sample-data production build, 14 pipeline checks,
  30 unit tests, 37 browser tests. `rtk mise run audit` found 0 vulnerabilities.
- The article was rendered at 1280px and 390px with no page errors and no
  horizontal document overflow. The new flow, split and numbered headings were
  inspected in screenshots at both widths. The one element extending past the
  viewport at 390px is the pre-existing Mermaid source inside its scrollable
  disclosure.
- The normal sample-data build now contains `/posts/2026/09/2026-09-19_small-questions-with-jev/`
  and the slug in `rss.xml`, `/posts/` and the homepage; `/drafts/` is absent.
  No deployment or publish task was run.
