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
| Inbox triage | Possible extension described as such | No completed mail integration is claimed |

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
