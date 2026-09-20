import { expect, test } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { staleness } from "../scripts/inky-heckle";

// Posts from 2025 onward carry Inky's per-section lines in their frontmatter.
// Renaming or adding a section without rerunning scripts/inky-heckle.ts fails here.
const root = "src/content/posts";

async function postsSince(year: number): Promise<string[]> {
  const years = (await readdir(root)).filter((y) => Number(y) >= year);
  const files: string[] = [];
  for (const y of years) {
    for (const f of await readdir(path.join(root, y))) {
      if (/\.mdx?$/.test(f)) files.push(path.join(root, y, f));
    }
  }
  return files.sort();
}

test("every post since 2025 has heckles that match its sections", async () => {
  const problems: string[] = [];
  for (const file of await postsSince(2025)) {
    const mdx = await readFile(file, "utf8");
    if (/^draft:\s*true/m.test(mdx)) continue; // drafts are filled before publishing
    if (/^lang:\s*"?de"?/m.test(mdx)) continue; // the persona writes English
    const problem = staleness(mdx);
    if (problem) problems.push(`${file}: ${problem}`);
  }
  expect(problems).toEqual([]);
});
