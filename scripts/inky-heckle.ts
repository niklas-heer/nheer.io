/**
 * Generate Inky's heckles for blog posts and store them in the frontmatter.
 *
 *   bun run scripts/inky-heckle.ts src/content/posts/2026/*.mdx
 *   bun run scripts/inky-heckle.ts --check src/content/posts/2026/*.mdx
 *
 * `--check` calls no model: it reports posts whose stored section ids no
 * longer match the post's sections, and exits 1 if any are stale.
 *
 * One line per section: the intro plus every `## heading` or `<ArticleStep>`.
 * The site reads `inky:` from the frontmatter at build time; nothing calls a
 * model while the page is served. Review the lines like any other content.
 */
import { readFile, writeFile } from "node:fs/promises";
import { INKY_MODEL, INKY_PERSONA, outputBudget, requestCommentArray } from "./sync-inky";

export interface Section {
  id: string;
  title: string;
  text: string;
}

export interface Heckle {
  section: string;
  comment: string;
}

/** Same rules as github-slugger, which rehype-slug uses for heading ids. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function cleanText(source: string): string {
  return source
    .replace(/^import .*$/gm, "")
    .replace(/<[A-Z][A-Za-z]*[\s\S]*?\/>/g, "")
    .replace(/<\/?[A-Za-z][^>]*>/g, "")
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "[image]")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Split MDX into the intro and one section per heading. */
export function splitSections(mdx: string): { frontmatter: string; body: string; sections: Section[] } {
  const match = mdx.match(/^---\n([\s\S]*?)\n---\n?/);
  const frontmatter = match ? match[1] : "";
  const body = match ? mdx.slice(match[0].length) : mdx;
  const markers: { index: number; id: string; title: string }[] = [];
  // Blank out fenced code so a `## heading` inside a code sample is not a section.
  const scan = body.replace(/```[\s\S]*?```/g, (fence) => " ".repeat(fence.length));
  const step = /<ArticleStep\b[^>]*\bid="([^"]+)"[^>]*\btitle="([^"]+)"[^>]*\/>/g;
  for (const m of scan.matchAll(step)) markers.push({ index: m.index!, id: m[1], title: m[2] });
  const heading = /^## +(.+?)\s*$/gm;
  for (const m of scan.matchAll(heading)) markers.push({ index: m.index!, id: slugify(m[1]), title: m[1] });
  markers.sort((a, b) => a.index - b.index);

  const sections: Section[] = [];
  const introEnd = markers[0]?.index ?? body.length;
  const intro = cleanText(body.slice(0, introEnd));
  if (intro) sections.push({ id: "intro", title: "Introduction", text: intro });
  markers.forEach((marker, i) => {
    const end = markers[i + 1]?.index ?? body.length;
    const text = cleanText(body.slice(marker.index, end).replace(/^.*\n/, ""));
    sections.push({ id: marker.id, title: marker.title, text });
  });
  return { frontmatter, body, sections };
}

/** Replace or append the `inky:` block in the frontmatter. */
export function applyHeckles(mdx: string, heckles: Heckle[]): string {
  const match = mdx.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error("No frontmatter found");
  const without = match[1].replace(/^inky:\n(?:[ \t]+.*\n?)*/m, "").replace(/\n+$/, "");
  const block = heckles.length
    ? "\ninky:\n" + heckles.map((h) => `  - section: ${JSON.stringify(h.section)}\n    comment: ${JSON.stringify(h.comment)}`).join("\n")
    : "";
  return `---\n${without}${block}\n---\n` + mdx.slice(match[0].length);
}

export function hecklePrompt(title: string, sections: Section[]): string {
  const list = sections
    .map((s, i) => `${i + 1}. [${s.id}] ${s.title}\n${s.text.slice(0, 2400)}`)
    .join("\n\n");
  return `${INKY_PERSONA}

The reader is on the author's own blog, reading a post titled "${title}". Below are its sections. Write exactly one line per section that heckles that section: what the author claims, builds, admits, or skips over. Refer to something concrete from the section, not just its title. Tease the author's habits as a developer and writer; never his person. Rotate the formats as usual.

${list}

Respond with ONLY a JSON array of ${sections.length} strings, in section order.`;
}

/** Stored section ids in the frontmatter, in order. */
export function storedSections(mdx: string): string[] {
  const { frontmatter } = splitSections(mdx);
  return [...frontmatter.matchAll(/^  - section: "([^"]+)"/gm)].map((m) => m[1]);
}

/** Empty when the stored heckles match the post's sections; otherwise what differs. */
export function staleness(mdx: string): string | null {
  const fresh = splitSections(mdx).sections.map((s) => s.id);
  const stored = storedSections(mdx);
  if (fresh.length === 0) return null;
  if (stored.length === 0) return "no heckles yet";
  const missing = fresh.filter((id) => !stored.includes(id));
  const extra = stored.filter((id) => !fresh.includes(id));
  if (missing.length === 0 && extra.length === 0) return null;
  return [missing.length ? `missing: ${missing.join(", ")}` : "", extra.length ? `stale: ${extra.join(", ")}` : ""].filter(Boolean).join("; ");
}

export async function heckleFile(path: string, apiKey: string, model = INKY_MODEL): Promise<Heckle[]> {
  const mdx = await readFile(path, "utf8");
  const { frontmatter, sections } = splitSections(mdx);
  const title = frontmatter.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ?? path;
  if (sections.length === 0) return [];
  const lines = await requestCommentArray(hecklePrompt(title, sections), apiKey, model, outputBudget(sections.length));
  if (lines.length !== sections.length) {
    throw new Error(`${path}: asked for ${sections.length} lines, received ${lines.length}`);
  }
  const heckles = sections.map((section, i) => ({ section: section.id, comment: lines[i] }));
  await writeFile(path, applyHeckles(mdx, heckles));
  return heckles;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const paths = args.filter((a) => a !== "--check");
  if (check) {
    let stale = false;
    for (const path of paths) {
      const problem = staleness(await readFile(path, "utf8"));
      if (problem) {
        stale = true;
        console.log(`${path}: ${problem}`);
      }
    }
    console.log(stale ? "Rerun without --check for the posts above." : `${paths.length} post(s) current.`);
    process.exit(stale ? 1 : 0);
  }
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || paths.length === 0) {
    console.error("Usage: OPENROUTER_API_KEY=... bun run scripts/inky-heckle.ts <post.mdx> ...");
    process.exit(1);
  }
  let failed = false;
  for (const path of paths) {
    try {
      const heckles = await heckleFile(path, apiKey);
      console.log(`${path}: ${heckles.length} heckles`);
      for (const h of heckles) console.log(`  [${h.section}] ${h.comment}`);
    } catch (error) {
      failed = true;
      console.error(`${path}: ${(error as Error).message}`);
    }
  }
  process.exit(failed ? 1 : 0);
}
