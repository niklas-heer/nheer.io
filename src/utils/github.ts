// GitHub REST helpers for the repository cards in posts (GitHubRepo.astro).

import { languageColor } from "./projects";

export function getLanguageColor(language: string, apiColor?: string): string {
  return languageColor(language, apiColor);
}

// REST API for fetching individual repos (used by GitHubRepo component)
export interface GitHubRepoData {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  license: { spdx_id: string } | null;
  updated_at: string;
}

export async function fetchGitHubRepo(
  repo: string,
): Promise<GitHubRepoData | null> {
  if ((process.env.SITE_TEST_DATA ?? import.meta.env.SITE_TEST_DATA) === "true") {
    return {
      full_name: repo,
      html_url: `https://github.com/${repo}`,
      description: "Sample repository used by local builds and tests.",
      stargazers_count: 42,
      forks_count: 3,
      language: "TypeScript",
      license: { spdx_id: "MIT" },
      updated_at: "2026-09-01T00:00:00.000Z",
    };
  }

  const token = process.env.GITHUB_TOKEN ?? import.meta.env.GITHUB_TOKEN;
  const live = (process.env.REQUIRE_LIVE_DATA ?? import.meta.env.REQUIRE_LIVE_DATA) === "true";

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`https://api.github.com/repos/${repo}`, { headers });

    if (!response.ok) {
      console.error(`GitHub API error for ${repo}:`, response.status);
      if (live) throw new Error("Required GitHub data unavailable");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching repo ${repo}:`, error);
    if (live) throw new Error("Required GitHub data unavailable");
    return null;
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return num.toString();
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? "s" : ""} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? "s" : ""} ago`;
  }
}
