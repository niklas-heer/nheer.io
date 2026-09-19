# Hub article evidence

Prepared September 19, 2026. Niklas requested a personal story combined with a
practical guide readers can copy, useful details, and strong storytelling. He
specified that the article belongs in the blog repository. The article remains
`draft: true` for local preview; no publication was requested. First-person
interpretation and humor are proposed editorial copy, not recovered quotations.

The source is the sibling private `hub` checkout. This was an editorial review of
its files and Git history, not a new execution of its tooling or model evaluation.
Initial commit `0b5265e` and history inspected through `4c3f0ac` are dated
2026-09-19. The post describes that same-day development without suggesting a
longer operating history. Uncommitted name-research work was excluded.

| Article material | Evidence in `hub` |
| --- | --- |
| Separate hub, dotfiles, and project responsibilities | `decisions/0001-separate-orchestration-hub.md`; initial README at `0b5265e` |
| Index deletion following another clone | `decisions/0007-live-project-discovery.md`; commit `0f1d132` removes `projects.md` |
| Shared preference routing, installed discovery checks, limits | `decisions/0002-progressive-development-preferences.md`; `research/2026-09-19-agent-instruction-audit.md` |
| Knowledge categories, selective capture, acceptance and freshness | `decisions/0003-reusable-facts-garden.md`; `facts/README.md` |
| Static audit scope and clean-machine limitation | `facts/tooling-audit-coverage.md`; `decisions/0004-rust-tooling.md` |
| Jev capture experiment, six cases, all three positives at review with 0.85 | `decisions/0005-jev-capture-gate.md`; `research/2026-09-19-jev-capture-gate.md` |
| Rust CLI tests, local Linux CI, separate native macOS checks | `decisions/0004-rust-tooling.md`; `decisions/0006-dagger-ci.md` |

The setup commands, shortened AGENTS.md, local preference index, and suggested
prompts are reader adaptations, explicitly introduced as examples. The decision
excerpt is a faithful abbreviation, not a verbatim copy. `agent-hub` is an
illustrative directory name; the real repository is named `hub`. Reader snippets
use ordinary commands without requiring RTK. No provider-specific automatic
instruction-loading behavior is assumed: the first task explicitly asks the
agent to read the instructions. Referenced preference files must be created by
the reader, as stated in the prose.

Public primary references checked on September 19, 2026:

- [GHQ command reference](https://github.com/x-motemen/ghq): list, full-path flag,
  query filtering, and primary root.
- [chezmoi source-path](https://www.chezmoi.io/reference/commands/source-path/):
  locating the source directory.
- [TypeSafe Noul](https://docs.typesafe.ai/primitives/noul): yes/no probability.

The article links these public references, not private hub paths. It contains no
credentials, secret references, personal machine paths, or incidental private
research. It makes no measured productivity or guaranteed agent-adherence claim.

Verification for the initial prose draft:

- `rtk mise run check` passed (sample-data build, pipeline/unit/browser checks,
  and dependency audit).
- Executed the starter Bash commands in an isolated temporary directory; checked
  the Git repository, four directories, and `scratch/` ignore entry.
- The local `/drafts/` index links the article and its HTTP response contains the
  rendered prose and code examples. Normal build output excludes the article
  from the homepage, post list, RSS, and draft routes.
- Browser automation was unavailable for a manual visual review of this new
  article. Existing browser tests passed; the article-specific preview check
  inspected rendered HTML.

## Visual revision — September 19, 2026

Niklas requested a more visual article using MDX, components, emoji, numbers, and
diagrams. The post now uses MDX and three original figures: index maintenance
before/after, an interactive map of ownership, and four knowledge folders. Five
numbered headings organize the guide. Native disclosures hold the full starter
instructions and the optional model experiment. The narrative and draft status
remain intact.

Diagram examples are illustrative adaptations of the existing evidence, not new
measurements or additional events. In particular, the parser example is a teaching
example, and the folder diagram does not imply that all research becomes a fact
or accepted decision. The before/after retains GHQ's configured-root limitation.

The implementation follows the blog's existing Astro/custom-element approach.
`ArticleFigure` and `ArticleStep` are reusable; their usage is documented in
`docs/visual-explainers.md`. No dependency was added. The new browser checks cover
keyboard selection, client navigation, mobile overflow, expandable copyable
instructions, and a no-JavaScript fallback. Screenshots from these checks support
visual review, superseding the initial prose draft's browser-review limitation.

Visual revision verification passed: `rtk mise run check`, including 26 browser
tests and a dependency audit with zero findings. Reviewed the three figures at
1280px and 390px from test screenshots. Normal build output still excludes the
draft from the homepage, post list, RSS, and draft routes.
