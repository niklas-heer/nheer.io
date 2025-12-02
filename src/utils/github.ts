// GitHub API utility for fetching pinned repositories
// Uses GitHub GraphQL API

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
const GITHUB_USERNAME = "niklas-heer";

export interface Repository {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  repositoryTopics: {
    nodes: {
      topic: {
        name: string;
      };
    }[];
  };
}

export interface GitHubData {
  pinnedRepos: Repository[];
  username: string;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  publicRepos: number;
  createdAt: string;
}

const PINNED_REPOS_QUERY = `
  query GetPinnedRepos($username: String!) {
    user(login: $username) {
      avatarUrl
      bio
      createdAt
      followers {
        totalCount
      }
      repositories {
        totalCount
      }
      pinnedItems(first: 6, types: REPOSITORY) {
        nodes {
          ... on Repository {
            name
            description
            url
            homepageUrl
            stargazerCount
            forkCount
            primaryLanguage {
              name
              color
            }
            repositoryTopics(first: 5) {
              nodes {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function fetchGitHubData(): Promise<GitHubData | null> {
  const token = import.meta.env.GITHUB_TOKEN;

  if (!token) {
    console.warn("GITHUB_TOKEN not set, skipping GitHub data fetch");
    return null;
  }

  try {
    const response = await fetch(GITHUB_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: PINNED_REPOS_QUERY,
        variables: { username: GITHUB_USERNAME },
      }),
    });

    if (!response.ok) {
      console.error("GitHub API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GitHub GraphQL errors:", data.errors);
      return null;
    }

    const user = data.data?.user;
    if (!user) {
      console.error("No user data returned from GitHub");
      return null;
    }

    return {
      pinnedRepos: user.pinnedItems.nodes as Repository[],
      username: GITHUB_USERNAME,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      followers: user.followers.totalCount,
      publicRepos: user.repositories.totalCount,
      createdAt: user.createdAt,
    };
  } catch (error) {
    console.error("Error fetching GitHub data:", error);
    return null;
  }
}

// Language color mapping for common languages (fallback if API doesn't return color)
export const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Astro: "#ff5a03",
  Lua: "#000080",
  Shell: "#89e051",
  Earthly: "#ffffff",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Elixir: "#6e4a7e",
  PHP: "#4F5D95",
};

export function getLanguageColor(language: string, apiColor?: string): string {
  return apiColor || languageColors[language] || "#8b8b8b";
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
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      console.error(`GitHub API error for ${repo}:`, response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching repo ${repo}:`, error);
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
