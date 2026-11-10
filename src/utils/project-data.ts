// Loads the projects collection and merges each entry with live and snapshot
// statistics. Every page shares one promise, so a build sends the GitHub
// requests once.
import { getCollection, type CollectionEntry } from "astro:content";
import { getPostPath } from "./content-metadata";
import { snapshotKey } from "./project-keys.mjs";
import {
  fetchLiveData,
  liveTargets,
  mergeStats,
  withoutActivity,
  type Activity,
  type LiveData,
  type ProjectStats,
  type Snapshot,
} from "./projects";

export type ProjectEntry = CollectionEntry<"projects">;
export type Category = ProjectEntry["data"]["category"];

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: "tools", label: "Tools" },
  { id: "apps", label: "Apps" },
  { id: "web", label: "Web" },
  { id: "games", label: "Games" },
  { id: "infrastructure", label: "Infrastructure" },
];

export const STATUS_LABELS: Record<ProjectEntry["data"]["status"], string> = {
  active: "Active",
  maintained: "Maintained",
  experimental: "Experimental",
  paused: "Paused",
  archived: "Archived",
};

export interface Project {
  entry: ProjectEntry;
  slug: string;
  url: string;
  /** The figures pages may show; without dates of work when `hideActivity` is set. */
  stats: ProjectStats;
  /** Weekly commits for the index's combined chart, kept even when `hideActivity` is set. */
  totalsActivity?: Activity;
  posts: { title: string; url: string; date: Date }[];
}

export interface ArchiveItem {
  name: string;
  year: number;
  note: string;
  url: string;
  stars?: number;
}

export interface ProjectsData {
  projects: Project[];
  featured: Project[];
  archive: ArchiveItem[];
  live: LiveData["source"];
  accountCreatedAt: string | null;
  now: Date;
}

interface ArchiveRecord { repo: string; name: string; year: number; note: string; url?: string }

// Optional data files: a missing file yields an empty glob instead of a build error.
const snapshotFiles = import.meta.glob<Snapshot>("../data/projects.json", { eager: true, import: "default" });
const archiveFiles = import.meta.glob<ArchiveRecord[]>("../data/projects-archive.json", { eager: true, import: "default" });

const categoryOrder = new Map(CATEGORIES.map((category, index) => [category.id, index]));

/** Featured projects first (by their number), then by category and title. */
export function compareProjects(a: ProjectEntry, b: ProjectEntry): number {
  const featured = (a.data.featured ?? Infinity) - (b.data.featured ?? Infinity);
  if (featured) return featured;
  const category = categoryOrder.get(a.data.category)! - categoryOrder.get(b.data.category)!;
  return category || a.data.title.localeCompare(b.data.title, "en", { sensitivity: "base" });
}

async function load(): Promise<ProjectsData> {
  const now = new Date();
  const entries = (await getCollection("projects")).sort(compareProjects);
  const snapshot: Snapshot = Object.values(snapshotFiles)[0] ?? { repos: {} };
  const archiveRecords: ArchiveRecord[] = Object.values(archiveFiles)[0] ?? [];

  const publicRepos = liveTargets(entries.map((entry) => entry.data));
  const live = await fetchLiveData(publicRepos, archiveRecords.map((record) => record.repo), { snapshot, now });

  const posts = await getCollection("posts", ({ data }) => !data.draft);
  const postsByPath = new Map(posts.map((post) => [getPostPath(post), post]));

  const projects = entries.map((entry): Project => {
    const related = entry.data.posts.map((path) => {
      const normalized = path.endsWith("/") ? path : `${path}/`;
      const post = postsByPath.get(normalized);
      if (!post) throw new Error(`Project "${entry.id}" lists the post ${path}, but no published post has that address`);
      return { title: post.data.title.replace(/\*\*/g, ""), url: normalized, date: new Date(post.data.date) };
    });
    const { visibility, repo, hideActivity } = entry.data;
    const key = snapshotKey({ slug: entry.id, visibility, repo });
    const stats = mergeStats(visibility, repo, repo ? live.repos.get(repo) : undefined, key ? snapshot.repos[key] : undefined, now);
    return {
      entry,
      slug: entry.id,
      url: `/projects/${entry.id}/`,
      stats: hideActivity ? withoutActivity(stats) : stats,
      totalsActivity: stats.activity,
      posts: related,
    };
  });

  const archive = archiveRecords
    .map((record): ArchiveItem => ({
      name: record.name,
      year: record.year,
      note: record.note,
      url: record.url ?? live.archive.get(record.repo)?.url ?? `https://github.com/${record.repo}`,
      stars: live.archive.get(record.repo)?.stars,
    }))
    .sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));

  return {
    projects,
    featured: projects.filter((project) => project.entry.data.featured !== undefined),
    archive,
    live: live.source,
    accountCreatedAt: live.accountCreatedAt,
    now,
  };
}

let cached: Promise<ProjectsData> | undefined;

export function getProjectsData(): Promise<ProjectsData> {
  cached ??= load();
  return cached;
}
