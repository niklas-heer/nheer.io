// Pocket Casts API utility for fetching podcast data
// Unofficial API - https://api.pocketcasts.com

const POCKETCASTS_API_URL = "https://api.pocketcasts.com";

export interface PocketCastsStats {
  timeListened: number;
  timeSilenceRemoval: number;
  timeSkipping: number;
  timeIntroSkipping: number;
  timeVariableSpeed: number;
}

export interface PocketCastsPodcast {
  uuid: string;
  title: string;
  author: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  folderUuid?: string;
  slug?: string;
}

export interface PocketCastsEpisode {
  uuid: string;
  podcastUuid: string;
  podcastTitle?: string;
  podcastSlug?: string;
  title: string;
  slug?: string;
  duration: number;
  playedUpTo: number;
  playingStatus: number;
  published: string;
  starred: boolean;
}

export interface PocketCastsAuth {
  token: string;
  email: string;
}

/**
 * Authenticate with Pocket Casts and get a token
 */
export async function authenticate(
  email: string,
  password: string,
): Promise<PocketCastsAuth | null> {
  try {
    const response = await fetch(`${POCKETCASTS_API_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://play.pocketcasts.com",
      },
      body: JSON.stringify({
        email,
        password,
        scope: "webplayer",
      }),
    });

    const data = await response.json();

    if (data.token) {
      return {
        token: data.token,
        email: data.email,
      };
    }

    console.error("Pocket Casts auth failed:", data.message);
    return null;
  } catch (error) {
    console.error("Pocket Casts auth error:", error);
    return null;
  }
}

/**
 * Fetch listening stats summary
 */
export async function fetchStats(
  token: string,
): Promise<PocketCastsStats | null> {
  try {
    const response = await fetch(`${POCKETCASTS_API_URL}/user/stats/summary`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    return {
      timeListened: data.timeListened || 0,
      timeSilenceRemoval: data.timeSilenceRemoval || 0,
      timeSkipping: data.timeSkipping || 0,
      timeIntroSkipping: data.timeIntroSkipping || 0,
      timeVariableSpeed: data.timeVariableSpeed || 0,
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return null;
  }
}

/**
 * Fetch subscribed podcasts
 */
export async function fetchSubscriptions(
  token: string,
): Promise<PocketCastsPodcast[]> {
  try {
    const response = await fetch(`${POCKETCASTS_API_URL}/user/podcast/list`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.podcasts) {
      console.error("No podcasts in response");
      return [];
    }

    return data.podcasts.map((p: any) => ({
      uuid: p.uuid,
      title: p.title,
      author: p.author,
      description: p.description,
      url: p.url,
      // Construct image URL from UUID - Pocket Casts uses this pattern
      thumbnail: `https://static.pocketcasts.com/discover/images/webp/480/${p.uuid}.webp`,
      folderUuid: p.folderUuid,
      slug: p.slug,
    }));
  } catch (error) {
    console.error("Failed to fetch subscriptions:", error);
    return [];
  }
}

/**
 * Fetch listening history (last ~100 episodes)
 */
export async function fetchHistory(
  token: string,
): Promise<PocketCastsEpisode[]> {
  try {
    const response = await fetch(`${POCKETCASTS_API_URL}/user/history`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.episodes) {
      console.error("No episodes in response");
      return [];
    }

    return data.episodes.map((e: any) => ({
      uuid: e.uuid,
      podcastUuid: e.podcastUuid,
      podcastTitle: e.podcastTitle,
      podcastSlug: e.podcastSlug,
      title: e.title,
      slug: e.slug,
      duration: e.duration || 0,
      playedUpTo: e.playedUpTo || 0,
      playingStatus: e.playingStatus || 0,
      published: e.published,
      starred: e.starred || false,
    }));
  } catch (error) {
    console.error("Failed to fetch history:", error);
    return [];
  }
}

/**
 * Fetch in-progress episodes
 */
export async function fetchInProgress(
  token: string,
): Promise<PocketCastsEpisode[]> {
  try {
    const response = await fetch(`${POCKETCASTS_API_URL}/user/in_progress`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.episodes) {
      return [];
    }

    return data.episodes.map((e: any) => ({
      uuid: e.uuid,
      podcastUuid: e.podcastUuid,
      podcastTitle: e.podcastTitle,
      podcastSlug: e.podcastSlug,
      title: e.title,
      slug: e.slug,
      duration: e.duration || 0,
      playedUpTo: e.playedUpTo || 0,
      playingStatus: e.playingStatus || 0,
      published: e.published,
      starred: e.starred || false,
    }));
  } catch (error) {
    console.error("Failed to fetch in-progress:", error);
    return [];
  }
}

/**
 * Fetch full podcast details
 */
export async function fetchPodcastDetails(
  token: string,
  podcastUuid: string,
): Promise<PocketCastsPodcast | null> {
  try {
    const response = await fetch(
      `https://podcast-api.pocketcasts.com/podcast/full/${podcastUuid}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!data.podcast) {
      return null;
    }

    const p = data.podcast;
    return {
      uuid: p.uuid,
      title: p.title,
      author: p.author,
      description: p.description,
      url: p.url,
      thumbnail: p.thumbnail,
    };
  } catch (error) {
    console.error("Failed to fetch podcast details:", error);
    return null;
  }
}

/**
 * Format seconds into human readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

/**
 * Format seconds into days and hours for large numbers
 */
export function formatListeningTime(seconds: number): {
  days: number;
  hours: number;
} {
  const totalHours = seconds / 3600;
  const days = Math.floor(totalHours / 24);
  const hours = Math.round(totalHours % 24);
  return { days, hours };
}
