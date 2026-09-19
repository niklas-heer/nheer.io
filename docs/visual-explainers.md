# Visual explanations for this blog

Niklas's reference sites (September 2026):

- [Bun: Bun in Rust](https://bun.com/blog/bun-in-rust): replayable sequences with concrete events, code, and counters tied to the described work.
- [Sam Rose](https://samwho.dev/), especially [Load Balancing](https://samwho.dev/load-balancing/): begin with a small model, introduce one complication, then let the reader experiment with parameters. Label the limits of a simulation.
- [Making Software, Dan Hollick](https://www.makingsoftware.com/): closely annotated figures explain familiar objects from their internal mechanisms. Figures sit beside the question they answer; they carry substantial explanatory weight.
- [Lydia Hallie: Git commands visualized](https://dev.to/lydiahallie/cs-visualized-useful-git-commands-37p1): show a command's effect on the same recognizable objects across successive states.

## Apply when it helps the article

Give each figure a question. The reader should discover something by changing a value, taking a step, or comparing states. Keep positions, object identities, and color meanings stable. Label values directly; color supplements labels. Use a small, explicit model, and distinguish invented teaching numbers from measured project results.

Prefer an invitation before the graphic and an interpretation after it. Start with one cause and one effect. Add complications only after the basic mechanism is understandable. Use concrete examples and a little humor in the prose without sacrificing correctness.

Use native controls, keyboard input, readable mobile layouts, textual results, and reduced-motion support. Avoid automatic loops that compete with reading. A static first state should still convey useful information. Interactivity is a tool for understanding, not a requirement for every figure.

These are editorial references, not templates to reproduce. Keep the site's own typography and palette, write original explanations, and draw original diagrams.

## Current applications

- Benchmark plumbing story: a three-era view of the actual Arch, Earthly, and Nix/Devbox + Dagger configurations, with source-linked commits. It replaced the earlier generic workload experiment after the author's editorial feedback.
- Kipferl: a measured size comparison of two builds of the same real terminal app, accompanied by its source and a VHS recording.
- tdx: a VHS recording demonstrates editing tasks inside a README; the separate save-conflict model explains why those ordinary files need careful handling.
- Quirl: an actual terminal session demonstrates Normal mode, Data mode, Bash compatibility, and Lua. The prose supplies the author's motivation and the commands.
- Overhead Overdrive: real screenshots carry a short personal story. An interactive physics diagram would distract from the reason the author made the game.
- Hub: an interactive starting-point diagram follows creating a repository, finding the next useful task, or investigating an idea. A folder diagram explains how useful context survives between those tasks. Numbered sections and expandable starter instructions support the story. The earlier index-deletion and ownership figures remain available as components, but no longer set the article's focus.

## Reusable article components

`ArticleFigure.astro` supplies the shared dark figure surface, eyebrow, title,
caption, and accessible label relationships. Pass a unique `id`, `label`, `title`,
and `caption`, and place diagram content in its default slot. Keep diagram styles
inside the content component; the frame does not impose a layout or interactions.

`ArticleStep.astro` supplies a section heading with a numbered badge and optional
visual meaning from an emoji. Pass `id`, `number`, `icon`, and `title`. The number
and icon are decorative; the heading text must make sense on its own.

The hub article demonstrates both in MDX. Its `HubLaunchpad` custom element uses
native buttons to choose between three workflows, each with an example request,
numbered steps, and a result. A live status announces the selected workflow and
result. Buttons remain disabled until handlers are attached. The initial project
creation example remains readable without JavaScript, and the article describes
all three workflows in prose. The layout stacks on narrow screens. `HubFolders`
is a static HTML/CSS figure. No React runtime or diagram dependency is needed.

`tests/hub-article.spec.ts` exercises the published article on desktop/mobile, keyboard
workflow selection, native expandable instructions, no-JavaScript reading, and horizontal
overflow. Playwright's `hub-article` project uses the normal static build. Public
post checks also verify discovery through the homepage, post list, and RSS feed.
