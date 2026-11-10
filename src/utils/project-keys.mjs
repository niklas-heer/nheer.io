// Shared by the build (src/utils/project-data.ts) and scripts/sync-projects.mjs.
//
// The snapshot (src/data/projects.json) keys a public project by its repository
// and a private one by its slug, so the public site repository never names a
// private repository.

/**
 * @param {{ slug: string; visibility: "public" | "private"; repo?: string }} project
 * @returns {string | undefined} undefined for a public project without a repository
 */
export function snapshotKey({ slug, visibility, repo }) {
  if (visibility === "private") return `private:${slug}`;
  return repo || undefined;
}
