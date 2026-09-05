# Blog post candidates

Investigated on 2026-09-05 through the GitHub CLI: repository inventory, README
files, recent commits and published releases. Compared with existing site posts.
These are editorial proposals, not finished posts or independently reproduced
performance claims. Nothing has been published.

## Recommended order

### 1. Sceno: diagrams that an agent can repair

**Working title:** “Making architecture diagrams an agent can actually fix”

The interesting story is the feedback loop: KDL source → validation → layout
description and advice → repair → export. Explain what structured geometry and
diagnostics give an agent that a rendered image alone does not.

- Open with one imperfect service diagram and its final version.
- Show the KDL, the diagnostic, and the small source change that fixes it.
- Explain why KDL, which checks are objective, and where visual judgment remains.
- Finish with the same diagram exported for documentation and slides.

Evidence: [README](https://github.com/niklas-heer/sceno#readme),
[v0.5.0](https://github.com/niklas-heer/sceno/releases/tag/v0.5.0), published September 5.
The README documents live preview, templates, validation, advice, and verified repairs.
This is the strongest immediate technical post: a fresh release and a clear visual demo.

### 2. Overhead Overdrive: a projector becomes a racing game

**Working title:** “I turned a classroom projector into a racing game”

Lead with the absurd, playable result, then explain the engineering needed to make
it feel good. The personal school setting gives this a different voice from a tool release.

- A short race clip and the projector's moving casters/lens.
- Fixed 120 Hz vehicle simulation versus rendering.
- How grip, drift charge, boost limits, and spring animation produce game feel.
- How simulated races and browser-driven checks catch broken tracks and controls.

Evidence: [README and physics/checks sections](https://github.com/niklas-heer/overhead-overdrive#readme),
[recent commits](https://github.com/niklas-heer/overhead-overdrive/commits).
The current implementation documents three circuits and automated race checks.
No GitHub release was returned. Capture a tested build; describe the physics as an
arcade model rather than a full rigid-body simulation.

### 3. Kipferl: the compatibility budget behind a small CLI

**Working title:** “How much Python does a standalone CLI really need?”

Focus on the choices behind a curated runtime: embedding PocketPy, exposing native
modules, choosing runtime capabilities from imports, and testing compatibility.
Show a small useful program, its packaged artifact, and a deliberately unsupported case.

Evidence: [README](https://github.com/niklas-heer/kipferl#readme),
[v0.6.0](https://github.com/niklas-heer/kipferl/releases/tag/v0.6.0),
[Rust migration plan](https://github.com/niklas-heer/kipferl/blob/main/RUST_MIGRATION.md).
The README explicitly excludes pip and C extensions and distinguishes current source
features from the published release. Reproduce size/startup measurements on a named
machine and version before quoting them.

There are already product-site release and Rust-migration articles linked from the
README. Use a personal design retrospective or a concrete case study instead of
repeating those articles.

### 4. Quirl: typed pipelines without abandoning shell habits

**Working title:** “A shell with two kinds of pipes”

Start with an everyday command-line task, then show the same task with typed data.
Explain the boundary between familiar shell execution, data-mode operations, Bash
islands, and Lua extensions. Make the semantic choices the story, rather than a
catalogue of every feature.

Evidence: [README](https://github.com/niklas-heer/quirl#readme),
[language design](https://github.com/niklas-heer/quirl/blob/main/docs/language-design.md),
[v0.1.0](https://github.com/niklas-heer/quirl/releases/tag/v0.1.0).
Recent commits also add a repository finder and conversational command assistance.
Verify which examples ship in the release versus the development branch. A feature
tour already exists on the product website, so emphasize decisions and tradeoffs.

### 5. tdx: keeping plain-text tasks safe

**Working title:** “The hard part of a Markdown todo app is saving the file”

You already published “Building tdx” on November 29, 2025, covering its origin,
Bun-to-Go rewrite, AST, and AI-assisted tests. A follow-up should address a different
problem: an editor and a TUI touching the same file.

- Demonstrate an external edit while the TUI is open.
- Explain atomic saves, conflict detection, visual diffs, and restore history.
- Show what format preservation means with a real Markdown example.
- Separate currently released behavior from the new developer workflows targeting 0.14.0.

Evidence: [README](https://github.com/niklas-heer/tdx#readme),
[releases](https://github.com/niklas-heer/tdx/releases),
[existing post source](../src/content/posts/2025/2025-11-29_building-tdx.mdx).
Latest published release observed: v0.13.1; recent commits target 0.14.0.

### 6. Speed comparison: what a language benchmark measures

**Working title:** “What years of benchmarking programming languages taught me”

Use the project's history to explain measurement boundaries: the same Leibniz
algorithm, single-thread execution, separate SIMD targets, compiler choices, and
why one numerical microbenchmark cannot rank whole languages.

Evidence: [README](https://github.com/niklas-heer/speed-comparison#readme),
[Swift accumulator change](https://github.com/niklas-heer/speed-comparison/pull/251),
[results site](https://niklas-heer.github.io/speed-comparison/).
The Swift change offers a concrete before/after story about instruction-level
parallelism. Re-run it under controlled conditions before stating an effect size.

## Later candidates

- **Homelab / podcast dashboard:** “My static site needs a data pipeline.” Explain
  scheduled Argo workflows, private PostgreSQL, static Netlify publishing, and
  freshness monitoring. Wait until live sync and publishing work end to end; the
  current rollout has passed build/browser validation but is awaiting credentials.
- **Fern:** a narrow compiler-design post about explicit error handling or native
  distribution. [The repository](https://github.com/niklas-heer/fern) has substantial
  design material, but check compiler behavior directly rather than repeating its
  broad speed, safety, or completion claims.

## Podcast check accompanying this research

The public dashboard at https://nheer.com/podcasts returned HTTP 200, showed the
historical statistics, and its Technology category expanded correctly. Both
`listening_stats` and `daily_stats` in the homelab database end on 2026-06-08.
The website's old GitHub sync is `disabled_inactivity`; its last successful run
was June 8. Argo's recurring workflow is enabled in `check` mode, which skips sync
and publishing. Therefore the presentation works, but automatic freshness does not.

The separate `pocketcasts-stats` Airtable project's sync is also
`disabled_inactivity`; its latest listed successful run was April 4. A green run
alone does not prove an Airtable update because that project can skip when secrets
are absent.

Also observed: `https://nheer.io/podcasts/` redirects to the homepage at
`https://nheer.com/`, dropping the path. Use the canonical `.com/podcasts` link;
the old-domain redirect needs a path-preserving rule.
