// Database utility for querying podcast data

import pg from "pg";

const { Client } = pg;

// Pocket Casts data starts from this date
export const POCKETCASTS_START_DATE = new Date("2015-08-02");

export interface ListeningStats {
  date: string;
  timeListened: number;
  timeSilenceRemoval: number;
  timeSkipping: number;
  timeIntroSkipping: number;
  timeVariableSpeed: number;
}

export interface DailyStats {
  date: string;
  timeListened: number;
  episodesStarted: number;
  episodesCompleted: number;
}

export interface Podcast {
  uuid: string;
  title: string;
  author: string | null;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  slug: string | null;
  episodeCount?: number;
}

export interface Episode {
  uuid: string;
  podcastUuid: string;
  podcastTitle?: string;
  podcastImageUrl?: string | null;
  podcastSlug?: string | null;
  title: string;
  slug: string | null;
  duration: number;
  playedUpTo: number;
  publishedAt: string | null;
  completedAt?: string | null;
  completed: boolean;
  starred: boolean;
}

export interface PodcastData {
  stats: ListeningStats | null;
  statsHistory: ListeningStats[];
  dailyStats: DailyStats[];
  monthlyStats: DailyStats[];
  yesterdayStats: DailyStats | null;
  podcasts: Podcast[];
  podcastsByCategory: Map<string, Podcast[]>;
  recentEpisodes: Episode[];
  inProgressEpisodes: Episode[];
  recentlyCompleted: Episode[];
  totalEpisodes: number;
  totalCompletedEpisodes: number;
  daysSinceStart: number;
}

async function getClient() {
  const connectionString = import.meta.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL not set");
    return null;
  }

  const client = new Client({ connectionString });
  await client.connect();
  return client;
}

export async function fetchPodcastData(): Promise<PodcastData | null> {
  const client = await getClient();
  if (!client) return null;

  try {
    // Calculate days since Pocket Casts start
    const now = new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - POCKETCASTS_START_DATE.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Get latest cumulative stats
    const statsResult = await client.query(`
      SELECT date, time_listened, time_silence_removal, time_skipping,
             time_intro_skipping, time_variable_speed
      FROM listening_stats
      ORDER BY date DESC
      LIMIT 1
    `);

    const stats: ListeningStats | null = statsResult.rows[0]
      ? {
          date: statsResult.rows[0].date,
          timeListened: parseInt(statsResult.rows[0].time_listened),
          timeSilenceRemoval: parseInt(
            statsResult.rows[0].time_silence_removal,
          ),
          timeSkipping: parseInt(statsResult.rows[0].time_skipping),
          timeIntroSkipping: parseInt(statsResult.rows[0].time_intro_skipping),
          timeVariableSpeed: parseInt(statsResult.rows[0].time_variable_speed),
        }
      : null;

    // Get cumulative stats history for chart
    const historyResult = await client.query(`
      SELECT date, time_listened, time_silence_removal, time_skipping,
             time_intro_skipping, time_variable_speed
      FROM listening_stats
      ORDER BY date ASC
    `);

    const statsHistory: ListeningStats[] = historyResult.rows.map((row) => ({
      date: row.date,
      timeListened: parseInt(row.time_listened),
      timeSilenceRemoval: parseInt(row.time_silence_removal),
      timeSkipping: parseInt(row.time_skipping),
      timeIntroSkipping: parseInt(row.time_intro_skipping),
      timeVariableSpeed: parseInt(row.time_variable_speed),
    }));

    // Get daily stats (actual per-day listening)
    const dailyStatsResult = await client.query(`
      SELECT date, time_listened, episodes_started, episodes_completed
      FROM daily_stats
      ORDER BY date DESC
      LIMIT 30
    `);

    const dailyStats: DailyStats[] = dailyStatsResult.rows.map((row) => ({
      date: row.date,
      timeListened: parseInt(row.time_listened),
      episodesStarted: parseInt(row.episodes_started),
      episodesCompleted: parseInt(row.episodes_completed),
    }));

    // Get yesterday's stats
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const yesterdayResult = await client.query(
      `SELECT date, time_listened, episodes_started, episodes_completed
       FROM daily_stats
       WHERE date = $1`,
      [yesterdayStr],
    );

    const yesterdayStats: DailyStats | null = yesterdayResult.rows[0]
      ? {
          date: yesterdayResult.rows[0].date,
          timeListened: parseInt(yesterdayResult.rows[0].time_listened),
          episodesStarted: parseInt(yesterdayResult.rows[0].episodes_started),
          episodesCompleted: parseInt(
            yesterdayResult.rows[0].episodes_completed,
          ),
        }
      : null;

    // Get this month's daily stats for the chart
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstOfMonthStr = firstOfMonth.toISOString().split("T")[0];

    const monthlyStatsResult = await client.query(
      `SELECT date, time_listened, episodes_started, episodes_completed
       FROM daily_stats
       WHERE date >= $1
       ORDER BY date ASC`,
      [firstOfMonthStr],
    );

    const monthlyStats: DailyStats[] = monthlyStatsResult.rows.map((row) => ({
      date: row.date,
      timeListened: parseInt(row.time_listened),
      episodesStarted: parseInt(row.episodes_started),
      episodesCompleted: parseInt(row.episodes_completed),
    }));

    // Get subscribed podcasts with episode counts, ordered by listen count
    const podcastsResult = await client.query(`
      SELECT p.uuid, p.title, p.author, p.description, p.image_url, p.category, p.slug,
             COUNT(e.uuid) as episode_count
      FROM podcasts p
      LEFT JOIN episodes e ON e.podcast_uuid = p.uuid
      WHERE p.is_subscribed = true
      GROUP BY p.uuid, p.title, p.author, p.description, p.image_url, p.category, p.slug
      ORDER BY episode_count DESC, p.title
    `);

    const podcasts: Podcast[] = podcastsResult.rows.map((row) => ({
      uuid: row.uuid,
      title: row.title,
      author: row.author,
      description: row.description,
      imageUrl: row.image_url,
      category: row.category,
      slug: row.slug,
      episodeCount: parseInt(row.episode_count),
    }));

    // Group by category
    const podcastsByCategory = new Map<string, Podcast[]>();
    for (const podcast of podcasts) {
      const category = podcast.category || "Uncategorized";
      if (!podcastsByCategory.has(category)) {
        podcastsByCategory.set(category, []);
      }
      podcastsByCategory.get(category)!.push(podcast);
    }

    // Get recent episodes
    const episodesResult = await client.query(`
      SELECT e.uuid, e.podcast_uuid, e.title, e.slug, e.duration, e.played_up_to,
             e.published_at, e.completed, e.starred, e.completed_at,
             p.title as podcast_title, p.image_url as podcast_image_url, p.slug as podcast_slug
      FROM episodes e
      JOIN podcasts p ON p.uuid = e.podcast_uuid
      ORDER BY e.first_seen_at DESC, e.published_at DESC
      LIMIT 20
    `);

    const recentEpisodes: Episode[] = episodesResult.rows.map((row) => ({
      uuid: row.uuid,
      podcastUuid: row.podcast_uuid,
      podcastTitle: row.podcast_title,
      podcastImageUrl: row.podcast_image_url,
      podcastSlug: row.podcast_slug,
      title: row.title,
      slug: row.slug,
      duration: row.duration,
      playedUpTo: row.played_up_to,
      publishedAt: row.published_at,
      completedAt: row.completed_at,
      completed: row.completed,
      starred: row.starred,
    }));

    // Get in-progress episodes (not completed)
    const inProgressResult = await client.query(`
      SELECT e.uuid, e.podcast_uuid, e.title, e.slug, e.duration, e.played_up_to,
             e.published_at, e.completed, e.starred, e.completed_at,
             p.title as podcast_title, p.image_url as podcast_image_url, p.slug as podcast_slug
      FROM episodes e
      JOIN podcasts p ON p.uuid = e.podcast_uuid
      WHERE e.completed = false AND e.played_up_to > 0
      ORDER BY e.last_played_at DESC NULLS LAST, e.played_up_to DESC
      LIMIT 10
    `);

    const inProgressEpisodes: Episode[] = inProgressResult.rows.map((row) => ({
      uuid: row.uuid,
      podcastUuid: row.podcast_uuid,
      podcastTitle: row.podcast_title,
      podcastImageUrl: row.podcast_image_url,
      podcastSlug: row.podcast_slug,
      title: row.title,
      slug: row.slug,
      duration: row.duration,
      playedUpTo: row.played_up_to,
      publishedAt: row.published_at,
      completedAt: row.completed_at,
      completed: row.completed,
      starred: row.starred,
    }));

    // Get recently completed episodes
    const recentlyCompletedResult = await client.query(`
      SELECT e.uuid, e.podcast_uuid, e.title, e.slug, e.duration, e.played_up_to,
             e.published_at, e.completed, e.starred, e.completed_at,
             p.title as podcast_title, p.image_url as podcast_image_url, p.slug as podcast_slug
      FROM episodes e
      JOIN podcasts p ON p.uuid = e.podcast_uuid
      WHERE e.completed = true AND e.completed_at IS NOT NULL
      ORDER BY e.completed_at DESC
      LIMIT 10
    `);

    const recentlyCompleted: Episode[] = recentlyCompletedResult.rows.map(
      (row) => ({
        uuid: row.uuid,
        podcastUuid: row.podcast_uuid,
        podcastTitle: row.podcast_title,
        podcastImageUrl: row.podcast_image_url,
        podcastSlug: row.podcast_slug,
        title: row.title,
        slug: row.slug,
        duration: row.duration,
        playedUpTo: row.played_up_to,
        publishedAt: row.published_at,
        completedAt: row.completed_at,
        completed: row.completed,
        starred: row.starred,
      }),
    );

    // Get total episode count
    const countResult = await client.query(`SELECT COUNT(*) FROM episodes`);
    const totalEpisodes = parseInt(countResult.rows[0].count);

    // Get total completed episode count
    const completedCountResult = await client.query(
      `SELECT COUNT(*) FROM episodes WHERE completed = true`,
    );
    const totalCompletedEpisodes = parseInt(completedCountResult.rows[0].count);

    await client.end();

    return {
      stats,
      statsHistory,
      dailyStats,
      monthlyStats,
      yesterdayStats,
      podcasts,
      podcastsByCategory,
      recentEpisodes,
      inProgressEpisodes,
      recentlyCompleted,
      totalEpisodes,
      totalCompletedEpisodes,
      daysSinceStart,
    };
  } catch (error) {
    console.error("Failed to fetch podcast data:", error);
    await client.end();
    return null;
  }
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function formatListeningTime(seconds: number): {
  days: number;
  hours: number;
  total: string;
} {
  const totalHours = seconds / 3600;
  const days = Math.floor(totalHours / 24);
  const hours = Math.round(totalHours % 24);
  return {
    days,
    hours,
    total: days > 0 ? `${days}d ${hours}h` : `${Math.round(totalHours)}h`,
  };
}
