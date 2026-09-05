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

## First applications

- Benchmark draft: two hypothetical implementations, workload slider, common time scale, explicit equations, crossover at 20 units. The reader can reverse the winner without changing either implementation.
- tdx draft: stable app/disk/snapshot views; create an external edit, attempt a save, inspect the blocked write, and deliberately keep both edits. The model illustrates a safety property; it does not promise arbitrary automatic merging in tdx.
