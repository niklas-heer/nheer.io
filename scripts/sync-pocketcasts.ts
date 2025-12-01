// Sync script to fetch Pocket Casts data and store in database
// Tracks daily listening stats and episode completion history

import {
  authenticate,
  fetchStats,
  fetchSubscriptions,
  fetchHistory,
  type PocketCastsEpisode,
} from "../src/utils/pocketcasts";
import {
  classifyPodcastsInBatches,
  type PodcastToClassify,
} from "../src/utils/classify";

const env = process.env;

// Pocket Casts data starts from this date
const POCKETCASTS_START_DATE = "2015-08-02";

async function syncPocketCasts() {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    // Authenticate with Pocket Casts
    console.log("Authenticating with Pocket Casts...");
    const auth = await authenticate(
      env.POCKETCASTS_EMAIL!,
      env.POCKETCASTS_PASSWORD!,
    );

    if (!auth) {
      throw new Error("Failed to authenticate with Pocket Casts");
    }
    console.log("Authenticated as:", auth.email);

    // Connect to database
    await client.connect();
    console.log("Connected to database");

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

    // Fetch and store stats
    console.log("\nFetching listening stats...");
    const stats = await fetchStats(auth.token);

    if (stats) {
      // Get previous cumulative stats to calculate daily delta
      const prevStatsResult = await client.query(
        `SELECT time_listened FROM listening_stats ORDER BY date DESC LIMIT 1`,
      );
      const prevTimeListened = prevStatsResult.rows[0]?.time_listened || 0;

      // Calculate daily listening time (delta from last sync)
      const dailyListeningTime = Math.max(
        0,
        stats.timeListened - prevTimeListened,
      );

      // Store cumulative stats
      await client.query(
        `INSERT INTO listening_stats (date, time_listened, time_silence_removal, time_skipping, time_intro_skipping, time_variable_speed)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (date) DO UPDATE SET
           time_listened = $2,
           time_silence_removal = $3,
           time_skipping = $4,
           time_intro_skipping = $5,
           time_variable_speed = $6`,
        [
          today,
          stats.timeListened,
          stats.timeSilenceRemoval,
          stats.timeSkipping,
          stats.timeIntroSkipping,
          stats.timeVariableSpeed,
        ],
      );

      console.log("Cumulative stats saved for", today);
      console.log(
        "  Total listening time:",
        Math.round(stats.timeListened / 3600),
        "hours",
      );

      // Daily stats will be updated after processing episodes
      // (to include episode counts)
      console.log(
        "  Daily delta:",
        Math.round(dailyListeningTime / 60),
        "minutes",
      );
    }

    // Fetch and store subscriptions
    console.log("\nFetching subscriptions...");
    const podcasts = await fetchSubscriptions(auth.token);
    console.log("Found", podcasts.length, "subscribed podcasts");

    let newPodcasts = 0;
    for (const podcast of podcasts) {
      const result = await client.query(
        `INSERT INTO podcasts (uuid, title, author, description, image_url, url, slug, is_subscribed)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         ON CONFLICT (uuid) DO UPDATE SET
           title = $2,
           author = $3,
           description = COALESCE(podcasts.description, $4),
           image_url = $5,
           url = $6,
           slug = COALESCE(podcasts.slug, $7),
           is_subscribed = true,
           updated_at = NOW()
         RETURNING (xmax = 0) as is_new`,
        [
          podcast.uuid,
          podcast.title,
          podcast.author,
          podcast.description,
          podcast.thumbnail,
          podcast.url,
          podcast.slug,
        ],
      );
      if (result.rows[0]?.is_new) {
        newPodcasts++;
      }
    }
    console.log("  New podcasts:", newPodcasts);

    // Mark unsubscribed podcasts
    const podcastUuids = podcasts.map((p) => p.uuid);
    if (podcastUuids.length > 0) {
      await client.query(
        `UPDATE podcasts SET is_subscribed = false WHERE uuid != ALL($1)`,
        [podcastUuids],
      );
    }

    // Classify any unclassified podcasts
    const unclassifiedResult = await client.query(`
      SELECT uuid, title, author, description
      FROM podcasts
      WHERE category IS NULL AND is_subscribed = true
      ORDER BY title
    `);

    const unclassifiedPodcasts: PodcastToClassify[] = unclassifiedResult.rows;

    if (unclassifiedPodcasts.length > 0) {
      console.log(
        `\nClassifying ${unclassifiedPodcasts.length} new podcast(s)...`,
      );

      if (env.OPENROUTER_API_KEY) {
        const classifications = await classifyPodcastsInBatches(
          unclassifiedPodcasts,
          env.OPENROUTER_API_KEY,
        );

        for (const [uuid, category] of classifications) {
          await client.query(
            `UPDATE podcasts SET category = $1, updated_at = NOW() WHERE uuid = $2`,
            [category, uuid],
          );
          const podcast = unclassifiedPodcasts.find((p) => p.uuid === uuid);
          console.log(`  ${podcast?.title} -> ${category}`);
        }

        console.log(`  Classified ${classifications.size} podcast(s)`);
      } else {
        console.log("  OPENROUTER_API_KEY not set, skipping classification");
        console.log("  Unclassified podcasts will appear in 'Uncategorized'");
      }
    }

    // Fetch and store history
    console.log("\nFetching listening history...");
    const episodes = await fetchHistory(auth.token);
    console.log("Found", episodes.length, "episodes in history");

    let newEpisodes = 0;
    let newlyCompleted = 0;
    let episodesStarted = 0;
    let totalDailyListening = 0;

    for (const episode of episodes) {
      // Check if podcast exists, if not create a placeholder
      const podcastExists = await client.query(
        `SELECT uuid FROM podcasts WHERE uuid = $1`,
        [episode.podcastUuid],
      );

      if (podcastExists.rows.length === 0) {
        // Create placeholder podcast with slug from episode if available
        await client.query(
          `INSERT INTO podcasts (uuid, title, author, slug, is_subscribed)
           VALUES ($1, $2, 'Unknown', $3, false)
           ON CONFLICT (uuid) DO NOTHING`,
          [
            episode.podcastUuid,
            episode.podcastTitle || "Unknown Podcast",
            episode.podcastSlug,
          ],
        );
      }

      const isCompleted = episode.playedUpTo >= episode.duration * 0.9; // 90% = completed

      // Get existing episode data to track changes
      const existingEpisode = await client.query(
        `SELECT uuid, played_up_to, completed, completed_at FROM episodes WHERE uuid = $1`,
        [episode.uuid],
      );

      const isNew = existingEpisode.rows.length === 0;
      const wasCompleted = existingEpisode.rows[0]?.completed || false;
      const previousPlayedUpTo = existingEpisode.rows[0]?.played_up_to || 0;

      // Calculate listening delta for this episode
      const listeningDelta = Math.max(
        0,
        episode.playedUpTo - previousPlayedUpTo,
      );

      // Determine completed_at timestamp
      let completedAt = existingEpisode.rows[0]?.completed_at || null;
      if (isCompleted && !wasCompleted) {
        // Episode just completed
        completedAt = now;
        newlyCompleted++;
      }

      // Insert or update episode
      const result = await client.query(
        `INSERT INTO episodes (uuid, podcast_uuid, title, slug, duration, played_up_to, published_at, completed, starred, completed_at, last_played_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (uuid) DO UPDATE SET
           played_up_to = GREATEST(episodes.played_up_to, $6),
           published_at = COALESCE(episodes.published_at, $7),
           slug = COALESCE(episodes.slug, $4),
           completed = $8,
           starred = $9,
           completed_at = COALESCE(episodes.completed_at, $10),
           last_played_at = CASE WHEN $6 > episodes.played_up_to THEN $11 ELSE episodes.last_played_at END
         RETURNING (xmax = 0) as is_new`,
        [
          episode.uuid,
          episode.podcastUuid,
          episode.title,
          episode.slug,
          episode.duration,
          episode.playedUpTo,
          episode.published ? new Date(episode.published) : null,
          isCompleted,
          episode.starred,
          completedAt,
          listeningDelta > 0 ? now : null,
        ],
      );

      if (result.rows[0]?.is_new) {
        newEpisodes++;
        if (episode.playedUpTo > 0) {
          episodesStarted++;
        }
      }

      // Track episode history for timeline feature
      if (listeningDelta > 0 || isNew) {
        await client.query(
          `INSERT INTO episode_history (episode_uuid, date, played_up_to, delta_seconds, completed, synced_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (episode_uuid, date) DO UPDATE SET
             played_up_to = GREATEST(episode_history.played_up_to, $3),
             delta_seconds = episode_history.delta_seconds + $4,
             completed = $5,
             synced_at = $6`,
          [
            episode.uuid,
            today,
            episode.playedUpTo,
            listeningDelta,
            isCompleted,
            now,
          ],
        );
        totalDailyListening += listeningDelta;
      }
    }

    console.log("  New episodes:", newEpisodes);
    console.log("  Newly completed:", newlyCompleted);

    // Update daily stats with episode counts
    await client.query(
      `INSERT INTO daily_stats (date, time_listened, episodes_started, episodes_completed, synced_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (date) DO UPDATE SET
         time_listened = daily_stats.time_listened + $2,
         episodes_started = daily_stats.episodes_started + $3,
         episodes_completed = daily_stats.episodes_completed + $4,
         synced_at = $5`,
      [today, totalDailyListening, episodesStarted, newlyCompleted, now],
    );

    // Print summary
    console.log("\n" + "=".repeat(50));
    console.log("Sync complete!");

    const statsCount = await client.query(
      `SELECT COUNT(*) FROM listening_stats`,
    );
    const podcastsCount = await client.query(
      `SELECT COUNT(*) FROM podcasts WHERE is_subscribed = true`,
    );
    const episodesCount = await client.query(`SELECT COUNT(*) FROM episodes`);
    const dailyStatsCount = await client.query(
      `SELECT COUNT(*) FROM daily_stats`,
    );
    const historyCount = await client.query(
      `SELECT COUNT(*) FROM episode_history`,
    );

    console.log("Database totals:");
    console.log("  Cumulative stats entries:", statsCount.rows[0].count);
    console.log("  Daily stats entries:", dailyStatsCount.rows[0].count);
    console.log("  Subscribed podcasts:", podcastsCount.rows[0].count);
    console.log("  Episodes tracked:", episodesCount.rows[0].count);
    console.log("  Episode history entries:", historyCount.rows[0].count);
    console.log("=".repeat(50));

    await client.end();
  } catch (error: any) {
    console.error("Sync failed:", error.message);
    await client.end();
    process.exit(1);
  }
}

syncPocketCasts();
