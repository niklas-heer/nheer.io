// Statistics for the Projects section.
//
// Two sources are merged per repository:
// - live: GitHub GraphQL at build time, for public repositories only
//   (stars, forks, issues, license, release, languages by bytes, weekly commits);
// - snapshot: src/data/projects.json, written by scripts/sync-projects.mjs from
//   local checkouts (lines of code, files, commits, contributors, weekly commits).
// Private repositories are never sent to GitHub; their figures come from the
// snapshot alone. A figure that neither source provides is left undefined so
// pages can omit it instead of printing 0.
import { WEEKS, weekWindows } from "./project-weeks.mjs";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
export const GITHUB_USERNAME = "niklas-heer";
const REPOS_PER_REQUEST = 6;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type Visibility = "public" | "private";

export interface LiveLanguage { name: string; color: string | null; size: number }

export interface LiveRepo {
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  license: string | null;
  latestRelease: { tag: string; date: string | null; url: string } | null;
  lastCommit: string | null;
  commits: number | null;
  languages: LiveLanguage[];
  weekly: number[] | null;
  /** Start of the first weekly window (ISO). */
  weeksFrom: string;
}

export interface LiveArchiveRepo { url: string; stars: number }

export interface LiveData {
  source: "live" | "fixture" | "unavailable";
  repos: Map<string, LiveRepo>;
  archive: Map<string, LiveArchiveRepo>;
  accountCreatedAt: string | null;
}

export interface SnapshotRepo {
  syncedAt: string;
  head?: string;
  /** Measured from a shallow clone: no commit count, first commit or contributors. */
  shallow?: boolean;
  /** A project with hideActivity: no first or last commit, weekly counts or tag date. */
  datesHidden?: boolean;
  commits?: number;
  firstCommit?: string;
  lastCommit?: string;
  contributors?: number;
  linesOfCode?: number;
  files?: number;
  languages?: { name: string; code: number; files?: number }[];
  /** The tag's date is left out for a project with hideActivity. */
  latestTag?: { name: string; date?: string } | null;
  /** null for weeks a shallow checkout cannot account for. */
  weekly?: (number | null)[];
}

export interface Snapshot { repos: Record<string, SnapshotRepo> }

export interface LanguageShare { name: string; color: string; share: number }

export interface Activity {
  /** 52 weekly commit counts, oldest first; null where the source has no data. */
  weeks: (number | null)[];
  /** Start of the first week (ISO). */
  from: string;
  source: "live" | "snapshot";
}

export interface ProjectStats {
  repoUrl?: string;
  stars?: number;
  forks?: number;
  openIssues?: number;
  license?: string;
  release?: { tag: string; date?: string };
  firstCommit?: string;
  lastCommit?: string;
  commits?: number;
  contributors?: number;
  linesOfCode?: number;
  files?: number;
  /** Every language, largest first, with shares that add up to 1. */
  languages: LanguageShare[];
  languageBasis?: "bytes" | "lines";
  activity?: Activity;
}

const env = (name: string): string | undefined =>
  process.env[name] ?? (import.meta.env?.[name] as string | undefined);
const liveRequired = () => env("REQUIRE_LIVE_DATA") === "true";

// GitHub's linguist colours for languages the snapshot may report without live
// data (private projects). Live data carries its own colours.
export const LANGUAGE_COLORS: Record<string, string> = {
  Astro: "#ff5a03", C: "#555555", "C#": "#178600", "C++": "#f34b7d", CSS: "#663399",
  Dart: "#00b4ab", Dockerfile: "#384d54", Elixir: "#6e4a7e", Elm: "#60b5cc", Gleam: "#ffaff3",
  Go: "#00add8", GraphQL: "#e10098", Haskell: "#5e5086", HCL: "#844fba", HTML: "#e34c26",
  Java: "#b07219", JavaScript: "#f1e05a", Julia: "#a270ba", Just: "#384d54", Kotlin: "#a97bff",
  Lua: "#000080", Makefile: "#427819", Nix: "#7e7eff", Nushell: "#4e9906", "Objective-C": "#438eff",
  OCaml: "#ef7a08", Perl: "#0298c3", PHP: "#4f5d95", PowerShell: "#012456", "Protocol Buffers": "#4285f4",
  Python: "#3572a5", R: "#198ce7", Ruby: "#701516", Rust: "#dea584", Sass: "#a53b70", Scala: "#c22d40",
  SCSS: "#c6538c", Shell: "#89e051", SQL: "#e38c00", Svelte: "#ff3e00", Swift: "#f05138",
  TypeScript: "#3178c6", "Vim Script": "#199f4b", Vue: "#41b883", Zig: "#ec915c",
};
const FALLBACK_COLOR = "#8b8b8b";

export function languageColor(name: string, liveColor?: string | null): string {
  return liveColor || LANGUAGE_COLORS[name] || FALLBACK_COLOR;
}

// ---------------------------------------------------------------- live query

/** The repositories that may be sent to GitHub: public projects only, each once. */
export function liveTargets(projects: { visibility: Visibility; repo?: string }[]): string[] {
  const repos = projects.filter((project) => project.visibility === "public").map((project) => project.repo);
  return [...new Set(repos.filter((repo): repo is string => !!repo))];
}

const REPO_FIELDS = (windows: { since: Date; until: Date }[]) => `
    url stargazerCount forkCount
    issues(states: OPEN) { totalCount }
    licenseInfo { spdxId name }
    latestRelease { tagName publishedAt url }
    languages(first: 20, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name color } } }
    defaultBranchRef { target { ... on Commit {
      committedDate
      history(first: 1) { totalCount }
${windows.map((w, index) => `      w${index}: history(first: 1, since: "${w.since.toISOString()}", until: "${w.until.toISOString()}") { totalCount }`).join("\n")}
    } } }`;

function repoArgs(repo: string): string {
  const [owner, name] = repo.split("/");
  return `owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}`;
}

export interface LiveRequest {
  query: string;
  aliases: { alias: string; repo: string; kind: "project" | "archive" }[];
  includesUser: boolean;
}

/**
 * Aliased GraphQL documents covering every repository in as few requests as the
 * per-request size allows. Only pass public repositories.
 */
export function buildLiveRequests(projects: string[], archive: string[], now = new Date()): LiveRequest[] {
  const windows = weekWindows(now);
  const requests: LiveRequest[] = [];
  const unique = [...new Set(projects)];
  const chunks: string[][] = [];
  for (let index = 0; index < unique.length; index += REPOS_PER_REQUEST) {
    chunks.push(unique.slice(index, index + REPOS_PER_REQUEST));
  }
  if (!chunks.length) chunks.push([]);
  chunks.forEach((chunk, chunkIndex) => {
    const aliases: LiveRequest["aliases"] = chunk.map((repo, index) => ({ alias: `p${chunkIndex}_${index}`, repo, kind: "project" }));
    // The archive and the account need few fields; they ride along with the first request.
    if (chunkIndex === 0) {
      [...new Set(archive)].forEach((repo, index) => aliases.push({ alias: `a${index}`, repo, kind: "archive" }));
    }
    const parts = aliases.map(({ alias, repo, kind }) =>
      kind === "project"
        ? `  ${alias}: repository(${repoArgs(repo)}) {${REPO_FIELDS(windows)}\n  }`
        : `  ${alias}: repository(${repoArgs(repo)}) { url stargazerCount }`,
    );
    const includesUser = chunkIndex === 0;
    if (includesUser) parts.unshift(`  account: user(login: ${JSON.stringify(GITHUB_USERNAME)}) { createdAt }`);
    requests.push({ query: `query ProjectStats {\n${parts.join("\n")}\n}`, aliases, includesUser });
  });
  return requests;
}

type GraphQLError = { type?: string; path?: unknown[]; message?: string };

interface ParsedResponse {
  repos: Map<string, LiveRepo>;
  archive: Map<string, LiveArchiveRepo>;
  accountCreatedAt: string | null;
  /** Repositories GitHub reported as missing or inaccessible. */
  missing: string[];
}

/**
 * Read one GraphQL response. A repository that GitHub reports as NOT_FOUND or
 * FORBIDDEN (renamed, made private, or outside the token's reach) is skipped so
 * its page falls back to the snapshot; any other error rejects the response.
 */
export function parseLiveResponse(body: any, request: LiveRequest, now = new Date()): ParsedResponse {
  const data = body?.data;
  const errors: GraphQLError[] = Array.isArray(body?.errors) ? body.errors : [];
  const aliasNames = new Set(request.aliases.map((entry) => entry.alias));
  const missing = new Set<string>();
  for (const error of errors) {
    const alias = Array.isArray(error.path) && error.path.length === 1 ? String(error.path[0]) : null;
    const tolerated = alias && aliasNames.has(alias) && (error.type === "NOT_FOUND" || error.type === "FORBIDDEN") && data?.[alias] === null;
    if (!tolerated) throw new Error(`GitHub GraphQL error: ${error.type ?? ""} ${error.message ?? ""}`.trim());
    missing.add(alias);
  }
  if (!data) throw new Error("GitHub GraphQL response has no data");

  const from = weekWindows(now)[0].since.toISOString();
  const result: ParsedResponse = {
    repos: new Map(),
    archive: new Map(),
    accountCreatedAt: request.includesUser ? data.account?.createdAt ?? null : null,
    missing: [],
  };
  for (const { alias, repo, kind } of request.aliases) {
    const node = data[alias];
    if (!node) {
      result.missing.push(repo);
      continue;
    }
    if (kind === "archive") {
      result.archive.set(repo, { url: node.url, stars: node.stargazerCount });
      continue;
    }
    const commit = node.defaultBranchRef?.target;
    const weekly = commit?.w0
      ? Array.from({ length: WEEKS }, (_, index) => commit[`w${index}`]?.totalCount ?? 0)
      : null;
    result.repos.set(repo, {
      url: node.url,
      stars: node.stargazerCount,
      forks: node.forkCount,
      openIssues: node.issues?.totalCount ?? 0,
      license: node.licenseInfo && node.licenseInfo.spdxId !== "NOASSERTION"
        ? node.licenseInfo.spdxId ?? node.licenseInfo.name
        : node.licenseInfo?.name && node.licenseInfo.name !== "Other" ? node.licenseInfo.name : null,
      latestRelease: node.latestRelease
        ? { tag: node.latestRelease.tagName, date: node.latestRelease.publishedAt, url: node.latestRelease.url }
        : null,
      lastCommit: commit?.committedDate ?? null,
      commits: commit?.history?.totalCount ?? null,
      languages: (node.languages?.edges ?? []).map((edge: any) => ({ name: edge.node.name, color: edge.node.color, size: edge.size })),
      weekly,
      weeksFrom: from,
    });
  }
  return result;
}

function hash(text: string): number {
  let value = 2166136261;
  for (const char of text) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
  return value >>> 0;
}

/** Deterministic sample data for SITE_TEST_DATA builds; no network access. */
export function fixtureLiveData(projects: string[], archive: string[], snapshot: Snapshot, now = new Date()): LiveData {
  const from = weekWindows(now)[0].since.toISOString();
  const repos = new Map<string, LiveRepo>();
  for (const repo of projects) {
    const seed = hash(repo);
    const snap = snapshot.repos[repo];
    const languages = snap?.languages?.length
      ? snap.languages.map((language) => ({ name: language.name, color: null, size: language.code * 32 }))
      : [{ name: "TypeScript", color: "#3178c6", size: 48_000 }, { name: "CSS", color: "#663399", size: 6_000 }];
    repos.set(repo, {
      url: `https://github.com/${repo}`,
      stars: 10 + (seed % 240),
      forks: seed % 17,
      openIssues: seed % 6,
      license: "MIT",
      latestRelease: { tag: `v1.${seed % 9}.0`, date: new Date(now.getTime() - (seed % 60) * 86_400_000).toISOString(), url: `https://github.com/${repo}/releases` },
      lastCommit: new Date(now.getTime() - (seed % 20) * 86_400_000).toISOString(),
      commits: 120 + (seed % 900),
      languages,
      weekly: Array.from({ length: WEEKS }, (_, index) => ((seed >> (index % 24)) & 7) * ((index * 7 + seed) % 3)),
      weeksFrom: from,
    });
  }
  return {
    source: "fixture",
    repos,
    archive: new Map(archive.map((repo) => [repo, { url: `https://github.com/${repo}`, stars: 5 + (hash(repo) % 120) }])),
    accountCreatedAt: "2012-03-14T10:00:00Z",
  };
}

function unavailable(): LiveData {
  return { source: "unavailable", repos: new Map(), archive: new Map(), accountCreatedAt: null };
}

/**
 * Live statistics for public repositories. With SITE_TEST_DATA=true a fixture is
 * returned; with REQUIRE_LIVE_DATA=true any failure throws; otherwise failures
 * leave the affected repositories out.
 */
export async function fetchLiveData(
  projects: string[],
  archive: string[],
  options: { snapshot?: Snapshot; now?: Date } = {},
): Promise<LiveData> {
  const now = options.now ?? new Date();
  if (env("SITE_TEST_DATA") === "true") return fixtureLiveData(projects, archive, options.snapshot ?? { repos: {} }, now);

  const fail = (message: string, error?: unknown): LiveData => {
    console.error(message, error ?? "");
    if (liveRequired()) throw new Error("Required GitHub data unavailable");
    return unavailable();
  };
  const token = env("GITHUB_TOKEN");
  if (!token) {
    if (liveRequired()) throw new Error("Required GitHub data unavailable");
    console.warn("GITHUB_TOKEN not set; project pages use snapshot figures only");
    return unavailable();
  }

  const result: LiveData = { source: "live", repos: new Map(), archive: new Map(), accountCreatedAt: null };
  const requests = buildLiveRequests(projects, archive, now);
  const responses = await Promise.all(requests.map(async (request) => {
    try {
      const response = await fetch(GITHUB_GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query: request.query }),
      });
      if (!response.ok) return { error: `GitHub API error: ${response.status} ${response.statusText}` };
      return { parsed: parseLiveResponse(await response.json(), request, now) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }));
  const failures = responses.filter((response) => "error" in response);
  if (failures.length === responses.length) return fail("GitHub project statistics unavailable:", failures[0].error);
  if (failures.length && liveRequired()) return fail("GitHub project statistics incomplete:", failures[0].error);
  for (const response of responses) {
    if (!("parsed" in response) || !response.parsed) {
      console.warn("Some GitHub project statistics are unavailable:", (response as { error: string }).error);
      continue;
    }
    const { parsed } = response;
    parsed.repos.forEach((value, key) => result.repos.set(key, value));
    parsed.archive.forEach((value, key) => result.archive.set(key, value));
    result.accountCreatedAt ??= parsed.accountCreatedAt;
    if (parsed.missing.length) console.warn(`GitHub has no accessible repository for ${parsed.missing.join(", ")}; using snapshot figures`);
  }
  return result;
}

// ---------------------------------------------------------------- merging

function shares(entries: { name: string; color: string | null; value: number }[]): LanguageShare[] {
  const total = entries.reduce((sum, entry) => sum + entry.value, 0);
  if (!total) return [];
  return entries
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((entry) => ({ name: entry.name, color: languageColor(entry.name, entry.color), share: entry.value / total }));
}

/**
 * Place weekly counts that start at `from` onto the current 52-week grid. Weeks
 * the source did not cover (a snapshot taken a while ago) become null.
 */
export function alignWeeks(weeks: (number | null)[], from: string, now = new Date()): (number | null)[] {
  const gridStart = weekWindows(now)[0].since.getTime();
  const offset = Math.round((new Date(from).getTime() - gridStart) / WEEK_MS);
  return Array.from({ length: WEEKS }, (_, index) => {
    const source = index - offset;
    return source >= 0 && source < weeks.length ? weeks[source] : null;
  });
}

function snapshotWeeksFrom(snapshot: SnapshotRepo): string {
  return weekWindows(new Date(snapshot.syncedAt))[0].since.toISOString();
}

export function mergeStats(
  visibility: Visibility,
  repo: string | undefined,
  live: LiveRepo | undefined,
  snapshot: SnapshotRepo | undefined,
  now = new Date(),
): ProjectStats {
  const isPublic = visibility === "public";
  const remote = isPublic ? live : undefined;
  const stats: ProjectStats = { languages: [] };

  if (isPublic && repo) stats.repoUrl = remote?.url ?? `https://github.com/${repo}`;
  if (remote) {
    stats.stars = remote.stars;
    stats.forks = remote.forks;
    stats.openIssues = remote.openIssues;
    if (remote.license) stats.license = remote.license;
  }

  if (remote?.latestRelease) stats.release = { tag: remote.latestRelease.tag, date: remote.latestRelease.date ?? undefined };
  else if (snapshot?.latestTag) stats.release = { tag: snapshot.latestTag.name, date: snapshot.latestTag.date };

  const lastCommit = remote?.lastCommit ?? snapshot?.lastCommit;
  if (lastCommit) stats.lastCommit = lastCommit;
  if (snapshot?.firstCommit) stats.firstCommit = snapshot.firstCommit;
  const commits = remote?.commits ?? snapshot?.commits;
  if (commits) stats.commits = commits;
  if (snapshot?.contributors) stats.contributors = snapshot.contributors;
  if (snapshot?.linesOfCode) stats.linesOfCode = snapshot.linesOfCode;
  if (snapshot?.files) stats.files = snapshot.files;

  if (remote?.languages.length) {
    stats.languages = shares(remote.languages.map((language) => ({ name: language.name, color: language.color, value: language.size })));
    stats.languageBasis = "bytes";
  } else if (snapshot?.languages?.length) {
    stats.languages = shares(snapshot.languages.map((language) => ({ name: language.name, color: null, value: language.code })));
    stats.languageBasis = "lines";
  }

  if (remote?.weekly) {
    stats.activity = { weeks: alignWeeks(remote.weekly, remote.weeksFrom, now), from: weekWindows(now)[0].since.toISOString(), source: "live" };
  } else if (snapshot?.weekly?.length === WEEKS) {
    const weeks = alignWeeks(snapshot.weekly, snapshotWeeksFrom(snapshot), now);
    if (weeks.some((week) => week !== null)) {
      stats.activity = { weeks, from: weekWindows(now)[0].since.toISOString(), source: "snapshot" };
    }
  }
  return stats;
}

/**
 * The figures that say when work happened, removed for a project with
 * `hideActivity: true`: the weekly chart, last commit, commit count, first
 * commit and the release date (the release tag stays).
 */
export function withoutActivity(stats: ProjectStats): ProjectStats {
  const { activity: _activity, lastCommit: _last, commits: _commits, firstCommit: _first, ...rest } = stats;
  return rest.release ? { ...rest, release: { tag: rest.release.tag } } : rest;
}

/** The largest languages, with the remainder folded into "Other". */
export function topLanguages(languages: LanguageShare[], limit = 5): LanguageShare[] {
  if (languages.length <= limit + 1) return languages;
  const top = languages.slice(0, limit);
  const rest = languages.slice(limit).reduce((sum, language) => sum + language.share, 0);
  return [...top, { name: "Other", color: "var(--color-muted)", share: rest }];
}

// ---------------------------------------------------------------- formatting

export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  if (value >= 1_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

export function formatRelative(date: string | Date, now = new Date()): string {
  // Calendar days in UTC, so a commit late yesterday reads "yesterday", not "today".
  const day = (value: Date) => Math.floor(value.getTime() / 86_400_000);
  const days = day(now) - day(new Date(date));
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  const years = Math.floor(days / 365);
  return years === 1 ? "a year ago" : `${years} years ago`;
}

export function formatMonth(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}

export function formatDay(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}
