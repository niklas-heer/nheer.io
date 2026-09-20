import { expect, test } from "bun:test";
import { applyHeckles, slugify, splitSections } from "../scripts/inky-heckle";

const post = `---
title: "A post"
date: "2026-01-01"
draft: true
---

import Thing from '../../../components/Thing.astro';

Opening paragraph with a [link](https://example.com) and *emphasis*.

<Thing
  id="x"
  steps={[{ a: 1 }]}
/>

<ArticleStep id="first-step" number="01" icon="🐙" title="The first step" />

Body of the first step.

\`\`\`md
## Not a section
echo hidden
\`\`\`

## Why it stays

Closing words.
`;

test("sections are the intro plus one per ArticleStep or heading, in order", () => {
  const { sections } = splitSections(post);
  expect(sections.map((s) => s.id)).toEqual(["intro", "first-step", "why-it-stays"]);
  expect(sections[0].text).toBe("Opening paragraph with a link and emphasis.");
  expect(sections[1].title).toBe("The first step");
  expect(sections[1].text).toBe("Body of the first step.\n\n[code]");
  expect(sections.map((s) => s.id)).not.toContain("not-a-section");
  expect(sections[2].text).toBe("Closing words.");
});

test("heading slugs follow rehype-slug", () => {
  expect(slugify("Why he stays in the corner")).toBe("why-he-stays-in-the-corner");
  expect(slugify("Ist das noch Größe?")).toBe("ist-das-noch-größe");
});

test("applyHeckles adds the block once and replaces it on rerun", () => {
  const once = applyHeckles(post, [{ section: "intro", comment: 'He said "hi".' }]);
  expect(once).toContain('draft: true\ninky:\n  - section: "intro"\n    comment: "He said \\"hi\\"."\n---\n');
  const twice = applyHeckles(once, [{ section: "first-step", comment: "Again." }]);
  expect(twice.match(/^inky:/gm)).toHaveLength(1);
  expect(twice).not.toContain("He said");
  expect(twice).toContain('  - section: "first-step"\n    comment: "Again."\n---\n\nimport Thing');
  expect(applyHeckles(twice, [])).not.toContain("inky:");
});

test("staleness reports missing, stale, or absent heckles", async () => {
  const { staleness } = await import("../scripts/inky-heckle");
  expect(staleness(post)).toBe("no heckles yet");
  const current = applyHeckles(post, [
    { section: "intro", comment: "a" }, { section: "first-step", comment: "b" }, { section: "why-it-stays", comment: "c" },
  ]);
  expect(staleness(current)).toBeNull();
  const renamed = current.replace("## Why it stays", "## Why he stays");
  expect(staleness(renamed)).toBe("missing: why-he-stays; stale: why-it-stays");
});
