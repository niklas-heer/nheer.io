import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  alignWeeks,
  buildLiveRequests,
  fetchLiveData,
  formatRelative,
  liveTargets,
  mergeStats,
  parseLiveResponse,
  topLanguages,
  withoutActivity,
  type LiveRepo,
  type SnapshotRepo,
} from "../src/utils/projects";
import { bucketWeeks, weekWindows } from "../src/utils/project-weeks.mjs";
import { privateRepositoryNames } from "./private-project-names";

const NOW = new Date("2026-11-10T12:00:00Z");
const saved = { ...process.env };
const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
  process.env.SITE_TEST_DATA = "false";
  delete process.env.REQUIRE_LIVE_DATA;
  spyOn(console, "error").mockImplementation(() => {});
  spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const name of ["GITHUB_TOKEN", "SITE_TEST_DATA", "REQUIRE_LIVE_DATA"]) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  mock.restore();
});

/** A GraphQL answer for every alias in the request body. */
function liveNode(stars: number) {
  const commit: Record<string, unknown> = { committedDate: "2026-11-09T20:00:00Z", history: { totalCount: 300 } };
  for (let week = 0; week < 52; week++) commit[`w${week}`] = { totalCount: week === 51 ? 4 : week % 2 };
  return {
    url: "https://github.com/x/y", stargazerCount: stars, forkCount: 2,
    issues: { totalCount: 1 }, licenseInfo: { spdxId: "MIT", name: "MIT License" },
    latestRelease: { tagName: "v1.2.0", publishedAt: "2026-11-01T00:00:00Z", url: "https://github.com/x/y/releases/v1.2.0" },
    languages: { edges: [{ size: 900, node: { name: "Go", color: "#00ADD8" } }, { size: 100, node: { name: "Shell", color: "#89e051" } }] },
    defaultBranchRef: { target: commit },
  };
}

function answerAll(body: string) {
  const { query } = JSON.parse(body);
  const data: Record<string, unknown> = {};
  for (const [, alias, kind] of query.matchAll(/^ {2}(\w+): (repository|user)\(/gm)) {
    data[alias] = kind === "user" ? { createdAt: "2012-03-14T10:00:00Z" } : liveNode(7);
  }
  return { data };
}

test("only public repositories are sent to GitHub", async () => {
  const bodies: string[] = [];
  globalThis.fetch = mock(async (_url, init) => {
    bodies.push(String(init?.body));
    return Response.json(answerAll(String(init?.body)));
  }) as typeof fetch;
  const projects = [
    { visibility: "public" as const, repo: "niklas-heer/tdx" },
    { visibility: "private" as const },
    { visibility: "public" as const, repo: "niklas-heer/tdx" },
  ];
  const targets = liveTargets(projects);
  expect(targets).toEqual(["niklas-heer/tdx"]);
  const live = await fetchLiveData(targets, ["niklas-heer/old"], { now: NOW });
  expect(live.source).toBe("live");
  expect(live.repos.get("niklas-heer/tdx")?.stars).toBe(7);
  expect(live.archive.get("niklas-heer/old")?.stars).toBe(7);
  expect(live.accountCreatedAt).toBe("2012-03-14T10:00:00Z");
});

test("requests are aliased, batched, and cover 52 weekly windows per repository", () => {
  const repos = Array.from({ length: 13 }, (_, index) => `owner/repo-${index}`);
  const requests = buildLiveRequests(repos, ["owner/archived"], NOW);
  expect(requests).toHaveLength(3);
  expect(requests[0].query).toContain("account: user(");
  expect(requests[0].aliases.filter((alias) => alias.kind === "archive")).toHaveLength(1);
  expect(requests[1].query).not.toContain("account: user(");
  const windows = requests[0].query.match(/w\d+: history\(first: 1, since: "[^"]+", until: "[^"]+"\)/g) ?? [];
  expect(windows).toHaveLength(52 * 6);
  expect(requests.flatMap((request) => request.aliases.map((alias) => alias.repo)).sort()).toEqual([...repos, "owner/archived"].sort());
});

test("a repository GitHub cannot see is skipped, other GraphQL errors are not", () => {
  const request = buildLiveRequests(["owner/a", "owner/b"], [], NOW)[0];
  const body = answerAll(JSON.stringify({ query: request.query }));
  (body.data as Record<string, unknown>).p0_1 = null;
  const parsed = parseLiveResponse({ ...body, errors: [{ type: "NOT_FOUND", path: ["p0_1"] }] }, request, NOW);
  expect([...parsed.repos.keys()]).toEqual(["owner/a"]);
  expect(parsed.missing).toEqual(["owner/b"]);
  expect(parsed.repos.get("owner/a")?.weekly?.at(-1)).toBe(4);
  for (const error of [{ type: "RATE_LIMITED" }, { type: "NOT_FOUND", path: ["p0_0"] }, { type: "FORBIDDEN", path: ["p0_1", "languages"] }]) {
    expect(() => parseLiveResponse({ ...body, errors: [error] }, request, NOW)).toThrow();
  }
});

test("sample builds use the fixture and never contact GitHub", async () => {
  process.env.SITE_TEST_DATA = "true";
  globalThis.fetch = mock(async () => { throw new Error("GitHub must not be contacted"); }) as typeof fetch;
  const live = await fetchLiveData(["niklas-heer/tdx"], ["niklas-heer/old"], { now: NOW });
  expect(live.source).toBe("fixture");
  expect(live.repos.get("niklas-heer/tdx")?.weekly).toHaveLength(52);
  // Deterministic, so screenshots and tests of sample builds are stable.
  expect((await fetchLiveData(["niklas-heer/tdx"], [], { now: NOW })).repos.get("niklas-heer/tdx")?.stars)
    .toBe(live.repos.get("niklas-heer/tdx")?.stars);
});

test("live builds fail on GitHub errors; ordinary builds degrade to snapshot figures", async () => {
  globalThis.fetch = mock(async () => new Response("unavailable", { status: 502 })) as typeof fetch;
  process.env.REQUIRE_LIVE_DATA = "true";
  await expect(fetchLiveData(["owner/a"], [], { now: NOW })).rejects.toThrow("Required GitHub data unavailable");
  delete process.env.GITHUB_TOKEN;
  await expect(fetchLiveData(["owner/a"], [], { now: NOW })).rejects.toThrow("Required GitHub data unavailable");
  delete process.env.REQUIRE_LIVE_DATA;
  expect((await fetchLiveData(["owner/a"], [], { now: NOW })).source).toBe("unavailable");
  process.env.GITHUB_TOKEN = "test-token";
  const degraded = await fetchLiveData(["owner/a"], [], { now: NOW });
  expect(degraded.source).toBe("unavailable");
  expect(degraded.repos.size).toBe(0);
});

const snapshot: SnapshotRepo = {
  syncedAt: "2026-10-27T09:00:00Z",
  commits: 120, firstCommit: "2025-01-01T00:00:00Z", lastCommit: "2026-10-26T00:00:00Z", contributors: 1,
  linesOfCode: 5000, files: 40,
  languages: [{ name: "Rust", code: 4000 }, { name: "Shell", code: 1000 }],
  latestTag: { name: "v0.3.0", date: "2026-09-01T00:00:00Z" },
  weekly: Array.from({ length: 52 }, (_, index) => index),
};

test("public projects prefer live figures and fill the rest from the snapshot", async () => {
  process.env.SITE_TEST_DATA = "true";
  const live = (await fetchLiveData(["owner/a"], [], { now: NOW })).repos.get("owner/a") as LiveRepo;
  const stats = mergeStats("public", "owner/a", live, snapshot, NOW);
  expect(stats.stars).toBe(live.stars);
  expect(stats.release?.tag).toBe(live.latestRelease?.tag);
  expect(stats.linesOfCode).toBe(5000);
  expect(stats.languageBasis).toBe("bytes");
  expect(stats.activity?.source).toBe("live");
  expect(stats.repoUrl).toBe("https://github.com/owner/a");

  const offline = mergeStats("public", "owner/a", undefined, snapshot, NOW);
  expect(offline.stars).toBeUndefined();
  expect(offline.forks).toBeUndefined();
  expect(offline.license).toBeUndefined();
  expect(offline.release).toEqual({ tag: "v0.3.0", date: "2026-09-01T00:00:00Z" });
  expect(offline.languageBasis).toBe("lines");
  expect(offline.languages.map((language) => [language.name, language.share])).toEqual([["Rust", 0.8], ["Shell", 0.2]]);
  expect(offline.activity?.source).toBe("snapshot");
});

test("private projects use only the snapshot and expose no repository address", async () => {
  process.env.SITE_TEST_DATA = "true";
  const live = (await fetchLiveData(["owner/private"], [], { now: NOW })).repos.get("owner/private");
  const stats = mergeStats("private", undefined, live, snapshot, NOW);
  expect(stats.repoUrl).toBeUndefined();
  expect(stats.stars).toBeUndefined();
  expect(stats.commits).toBe(120);
  expect(JSON.stringify(stats)).not.toContain("owner/private");
});

test("figures nobody provides stay undefined instead of becoming zero", () => {
  const stats = mergeStats("private", undefined, undefined, undefined, NOW);
  expect(stats).toEqual({ languages: [] });
});

test("hideActivity removes every figure that dates the work", () => {
  const stats = withoutActivity(mergeStats("private", undefined, undefined, snapshot, NOW));
  expect(stats.activity).toBeUndefined();
  expect(stats.lastCommit).toBeUndefined();
  expect(stats.commits).toBeUndefined();
  expect(stats.firstCommit).toBeUndefined();
  expect(stats.release).toEqual({ tag: "v0.3.0" });
  expect(stats.linesOfCode).toBe(5000);
});

test("weeks a shallow snapshot does not cover stay unknown", () => {
  const weekly = [...Array.from({ length: 30 }, () => null), ...Array.from({ length: 22 }, () => 1)];
  const stats = mergeStats("private", undefined, undefined, { syncedAt: NOW.toISOString(), weekly }, NOW);
  expect(stats.activity?.weeks.slice(0, 30).every((week) => week === null)).toBe(true);
  expect(stats.activity?.weeks.at(-1)).toBe(1);
});

test("an older snapshot is shifted onto the current weeks and the gap is unknown", () => {
  const weeks = alignWeeks(snapshot.weekly!, weekWindows(new Date(snapshot.syncedAt))[0].since.toISOString(), NOW);
  // Synced two weeks before NOW: the two newest weeks have no data.
  expect(weeks.slice(-3)).toEqual([51, null, null]);
  expect(weeks[0]).toBe(2);
});

test("commits are bucketed into Monday-based UTC weeks ending with the current week", () => {
  const windows = weekWindows(NOW);
  expect(windows).toHaveLength(52);
  expect(windows[51].since.toISOString()).toBe("2026-11-09T00:00:00.000Z");
  const counts = bucketWeeks([
    Date.parse("2026-11-09T00:00:00Z"), Date.parse("2026-11-10T08:00:00Z"),
    Date.parse("2026-11-08T23:59:59Z"), Date.parse("2020-01-01T00:00:00Z"),
  ], NOW);
  expect(counts[51]).toBe(2);
  expect(counts[50]).toBe(1);
  expect(counts.reduce((sum, count) => sum + count, 0)).toBe(3);
});

test("small helpers: relative dates and the Other language bucket", () => {
  expect(formatRelative("2026-11-09T23:00:00Z", NOW)).toBe("yesterday");
  expect(formatRelative("2026-11-10T01:00:00Z", NOW)).toBe("today");
  expect(formatRelative("2026-11-03T00:00:00Z", NOW)).toBe("7 days ago");
  const languages = ["A", "B", "C", "D", "E", "F", "G"].map((name) => ({ name, color: "#000", share: 1 / 7 }));
  const top = topLanguages(languages, 5);
  expect(top.map((language) => language.name)).toEqual(["A", "B", "C", "D", "E", "Other"]);
  expect(top.at(-1)?.share).toBeCloseTo(2 / 7);
});

// ------------------------------------------------------------- sync script

const script = join(import.meta.dir, "..", "scripts", "sync-projects.mjs");
const node = process.execPath.endsWith("bun") ? "node" : process.execPath;

function run(args: string[], cwd: string) {
  return spawnSync(node, [script, ...args], { cwd, encoding: "utf8" });
}

function workspace() {
  const dir = mkdtempSync(join(tmpdir(), "sync-projects-test-"));
  mkdirSync(join(dir, "content"));
  return dir;
}

function git(dir: string, ...args: string[]) {
  const result = spawnSync("git", ["-C", dir, ...args], {
    encoding: "utf8",
    env: { ...process.env, GIT_AUTHOR_NAME: "Test", GIT_AUTHOR_EMAIL: "t@example.test", GIT_COMMITTER_NAME: "Test", GIT_COMMITTER_EMAIL: "t@example.test" },
  });
  if (result.status !== 0) throw new Error(result.stderr);
}

test("--check fails while a project has no snapshot entry or a private project names its repository", () => {
  const dir = workspace();
  try {
    writeFileSync(join(dir, "content", "a.md"), '---\ntitle: "A"\nvisibility: public\nrepo: "owner/a"\n---\n');
    writeFileSync(join(dir, "content", "secret.md"), '---\ntitle: "S"\nvisibility: private\n---\n');
    writeFileSync(join(dir, "snapshot.json"), JSON.stringify({ repos: {} }));
    const missing = run(["--check", "--content", "content", "--out", "snapshot.json"], dir);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain("a.md: no snapshot entry for owner/a");
    expect(missing.stderr).toContain("secret.md: no snapshot entry for private:secret");
    const entry = { syncedAt: "2026-01-01T00:00:00Z" };
    writeFileSync(join(dir, "snapshot.json"), JSON.stringify({ repos: { "owner/a": entry, "private:secret": entry } }));
    expect(run(["--check", "--content", "content", "--out", "snapshot.json"], dir).status).toBe(0);
    writeFileSync(join(dir, "content", "secret.md"), '---\ntitle: "S"\nvisibility: private\nrepo: "owner/secret"\n---\n');
    const named = run(["--check", "--content", "content", "--out", "snapshot.json"], dir);
    expect(named.status).toBe(1);
    expect(named.stderr).toContain("secret.md: a private project must not name its repository");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the committed snapshot covers every project content file", () => {
  const result = run(["--check"], join(import.meta.dir, ".."));
  expect(result.stderr).toBe("");
  expect(result.status).toBe(0);
});

const hasTokei = spawnSync(process.env.TOKEI || "tokei", ["--version"]).status === 0;

test.skipIf(!hasTokei)("sync reads a checkout without changing it and reports a missing one", () => {
  const dir = workspace();
  try {
    const repo = join(dir, "root", "owner", "a");
    mkdirSync(join(repo, "gen"), { recursive: true });
    git(repo, "init", "-q", "-b", "main");
    writeFileSync(join(repo, "main.go"), "package main\n\nfunc main() {\n\tprintln(1)\n}\n");
    writeFileSync(join(repo, "gen", "api.go"), "// Code generated by tool. DO NOT EDIT.\npackage gen\n\nvar A = 1\n");
    writeFileSync(join(repo, "README.md"), "# A\n\nProse is not code.\n");
    git(repo, "add", ".");
    git(repo, "commit", "-q", "-m", "first");
    writeFileSync(join(repo, "untracked.go"), "package main\n\nvar untracked = 1\n");
    const before = spawnSync("git", ["-C", repo, "status", "--porcelain"], { encoding: "utf8" }).stdout;

    writeFileSync(join(dir, "content", "a.md"), '---\nvisibility: public\nrepo: "owner/a"\n---\n');
    writeFileSync(join(dir, "content", "b.md"), '---\nvisibility: public\nrepo: "owner/missing"\n---\n');
    const result = run(["--root", join(dir, "root"), "--content", "content", "--out", "snapshot.json"], dir);
    expect(result.stderr).toContain("no checkout at");
    expect(result.status).toBe(1);

    const entry = JSON.parse(readFileSync(join(dir, "snapshot.json"), "utf8")).repos["owner/a"];
    expect(entry.commits).toBe(1);
    expect(entry.contributors).toBe(1);
    // Committed Go only: no README, no generated file, no untracked file.
    expect(entry.languages).toEqual([{ name: "Go", code: 4, files: 1 }]);
    expect(entry.weekly).toHaveLength(52);
    expect(entry.weekly.at(-1)).toBe(1);
    expect(spawnSync("git", ["-C", repo, "status", "--porcelain"], { encoding: "utf8" }).stdout).toBe(before);
    expect(existsSync(join(repo, "snapshot.json"))).toBe(false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test.skipIf(!hasTokei)("private and shallow checkouts: keyed by slug, located by the local map, no invented history", () => {
  const dir = workspace();
  try {
    const source = join(dir, "elsewhere", "secret-name");
    mkdirSync(source, { recursive: true });
    git(source, "init", "-q", "-b", "main");
    for (const [index, date] of ["2025-01-06T10:00:00Z", "2026-11-03T10:00:00Z", "2026-11-09T10:00:00Z"].entries()) {
      writeFileSync(join(source, "main.go"), `package main\n\nvar n = ${index}\n`);
      git(source, "add", ".");
      spawnSync("git", ["-C", source, "commit", "-q", "-m", `c${index}`, "--date", date], {
        env: { ...process.env, GIT_COMMITTER_DATE: date, GIT_AUTHOR_NAME: "Test", GIT_AUTHOR_EMAIL: "t@example.test", GIT_COMMITTER_NAME: "Test", GIT_COMMITTER_EMAIL: "t@example.test" },
      });
    }
    const shallow = join(dir, "elsewhere", "shallow");
    expect(spawnSync("git", ["clone", "-q", "--depth", "2", `file://${source}`, shallow]).status).toBe(0);

    writeFileSync(join(dir, "content", "secret.md"), '---\nvisibility: private\n---\n');
    writeFileSync(join(dir, "content", "thin.md"), '---\nvisibility: private\n---\n');
    writeFileSync(join(dir, "content", "unmapped.md"), '---\nvisibility: private\n---\n');
    writeFileSync(join(dir, "content", "quiet.md"), '---\nvisibility: private\nhideActivity: true\n---\n');
    writeFileSync(join(dir, "local.json"), JSON.stringify({ checkouts: { secret: "elsewhere/secret-name", thin: shallow, quiet: source } }));
    const previous = { syncedAt: "2026-01-01T00:00:00Z", linesOfCode: 9 };
    writeFileSync(join(dir, "snapshot.json"), JSON.stringify({ repos: { "private:unmapped": previous } }));
    const result = run(["--root", join(dir, "root"), "--local", "local.json", "--content", "content", "--out", "snapshot.json"], dir);
    expect(result.status).toBe(0);

    const text = readFileSync(join(dir, "snapshot.json"), "utf8");
    expect(text).not.toContain("secret-name");
    const { repos } = JSON.parse(text);
    expect(Object.keys(repos).sort()).toEqual(["private:quiet", "private:secret", "private:thin", "private:unmapped"]);
    expect(repos["private:secret"].commits).toBe(3);
    // hideActivity: the committed snapshot carries no dates of the work.
    const quiet = repos["private:quiet"];
    expect(quiet.datesHidden).toBe(true);
    expect(quiet.commits).toBe(3);
    for (const field of ["firstCommit", "lastCommit", "weekly"]) expect(quiet[field]).toBeUndefined();
    expect(JSON.stringify({ ...quiet, syncedAt: undefined })).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(repos["private:unmapped"]).toEqual(previous);

    const thin = repos["private:thin"];
    expect(thin.shallow).toBe(true);
    expect(thin.commits).toBeUndefined();
    expect(thin.firstCommit).toBeUndefined();
    expect(thin.contributors).toBeUndefined();
    expect(thin.linesOfCode).toBe(2);
    // The clone holds the commits of 3 and 9 November; the week of the older one may be incomplete.
    expect(thin.weekly.slice(0, 51).every((week: number | null) => week === null)).toBe(true);
    expect(thin.weekly.at(-1)).toBe(1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("tracked files never name a private project's repository", () => {
  const names = privateRepositoryNames();
  if (!names.length) return; // only checkable where .projects-local.json maps the checkouts
  const root = join(import.meta.dir, "..");
  const files = spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8" }).stdout.split("\0").filter(Boolean);
  for (const file of files) {
    if (/\.(png|jpe?g|webp|gif|avif|ico|woff2?|pdf|mp4)$/i.test(file) || !existsSync(join(root, file)) || !statSync(join(root, file)).isFile()) continue;
    const text = readFileSync(join(root, file), "utf8").toLowerCase();
    for (const name of names) expect(text.includes(name), `${file} names a private repository`).toBe(false);
  }
});
