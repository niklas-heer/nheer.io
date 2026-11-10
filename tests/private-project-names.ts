// Names that must never appear in the public site repository or its build:
// the repositories behind private projects. They are read from the untracked
// .projects-local.json and each checkout's origin remote, so this list exists
// only on a machine that has the checkouts. Elsewhere it is empty.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = join(import.meta.dirname, "..");

function privateSlugs(): string[] {
  const dir = join(root, "src", "content", "projects");
  return readdirSync(dir)
    .filter((file) => /\.mdx?$/.test(file))
    .filter((file) => /^visibility:\s*["']?private/m.test(readFileSync(join(dir, file), "utf8")))
    .map((file) => file.replace(/\.mdx?$/, ""));
}

/**
 * For each mapped private project: its `owner/name`, and its bare name when that
 * differs from the slug (the slug is public anyway: it is the page address).
 */
export function privateRepositoryNames(mapFile = join(root, ".projects-local.json")): string[] {
  if (!existsSync(mapFile)) return [];
  const checkouts: Record<string, string> = JSON.parse(readFileSync(mapFile, "utf8")).checkouts ?? {};
  const names = new Set<string>();
  for (const slug of privateSlugs()) {
    if (!checkouts[slug]) continue;
    const dir = resolve(dirname(mapFile), checkouts[slug].replace(/^~(?=$|\/)/, homedir()));
    const remote = spawnSync("git", ["-C", dir, "remote", "get-url", "origin"], { encoding: "utf8" });
    const repo = remote.status === 0 ? remote.stdout.trim().match(/[:/]([\w.-]+\/[\w.-]+?)(?:\.git)?$/)?.[1] : undefined;
    if (!repo) continue;
    names.add(repo.toLowerCase());
    const bare = repo.split("/")[1].toLowerCase();
    if (bare !== slug.toLowerCase()) names.add(bare);
  }
  return [...names];
}
