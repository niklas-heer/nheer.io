---
name: inky-heckles
description: Use when writing, revising, or publishing a blog post in this repository, or when a post's section headings change, so Inky's per-section lines exist and match the headings before the preview is opened.
---

# Inky heckles for a post

Inky, the corner mascot, has one line per section of every post from 2025
onward. The lines are content: they live in the post's frontmatter under
`inky:` (`section` id plus `comment`) and are generated once by
`scripts/inky-heckle.ts` with the persona in `scripts/sync-inky.ts`. Nothing
calls a model while a page is served. A post whose `inky:` block is missing
or no longer matches its sections fails `tests/inky-heckles-current.test.ts`
once it is published.

## When

- A new post is drafted, before its local preview is opened for review.
- A section is added, removed, or retitled. Ids come from `<ArticleStep id>`
  or the slug of a `## heading`, so a retitled heading needs a rerun.
- Not for edits inside a section: existing lines stay valid.
- German posts (`lang: "de"`) are skipped; the persona writes English.

## Procedure

1. Finish the section structure first. Regenerating replaces every line, so
   run it after the headings are settled.
2. Generate. Bun loads `.env`; the key is `OPENROUTER_API_KEY`. Cost is a
   fraction of a cent per post.

   ```sh
   bun run scripts/inky-heckle.ts src/content/posts/2026/<post>.mdx
   ```

3. Read every line in the frontmatter. Keep a line only if it refers to
   something concrete in its section and mocks a system, tool, or habit. Fix
   or replace a line by editing the `comment` directly, or rerun for a new
   set. Drop a line that mocks a named person.
4. Verify without the model:

   ```sh
   bun run scripts/inky-heckle.ts --check src/content/posts/2026/<post>.mdx
   ```

   Then hover the section headings in the draft preview on a window wider
   than 1,200 pixels: Inky should follow the cursor and speak each line once.
5. Commit the frontmatter with the post.

## Watch for

- A `##` inside a fenced code block is not a section; the splitter ignores it.
- The intro is section `intro`; the article element itself is its anchor.
- Lines that only restate the section in costume: rerun or rewrite them.
- The showcase article for the mechanism is
  `src/content/posts/2026/2026-09-20_an-octopus-in-the-corner.mdx`.
