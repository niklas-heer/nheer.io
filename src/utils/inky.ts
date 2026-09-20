// Inky comment utilities

import pg from "pg";

const { Client } = pg;

export interface InkyComment {
  id: number;
  comment: string;
  sourceType: string;
  sourceTitle: string | null;
  sourceUrl: string | null;
}

/**
 * Get Inky comments for the page (fetched at build time)
 * - News comments: Get the most recent ones (they're timely)
 * - General comments: Get all of them (they're timeless, randomized at runtime via JS)
 */
let commentsPromise: Promise<InkyComment[]> | undefined;

export function getInkyComments(): Promise<InkyComment[]> {
  // Sample-data builds and tests stay deterministic: no database, fallback lines.
  if ((process.env.SITE_TEST_DATA ?? import.meta.env.SITE_TEST_DATA) === "true") {
    return Promise.resolve(getFallbackComments());
  }
  if (import.meta.env.DEV) return loadInkyComments();
  return (commentsPromise ??= loadInkyComments());
}

async function loadInkyComments(): Promise<InkyComment[]> {
  const connectionString = (process.env.DATABASE_URL ?? import.meta.env.DATABASE_URL);
  if (!connectionString) {
    console.warn("DATABASE_URL not set, using fallback comments");
    if ((process.env.REQUIRE_LIVE_DATA ?? import.meta.env.REQUIRE_LIVE_DATA) === "true") {
      throw new Error("Required Inky comments unavailable");
    }
    return getFallbackComments();
  }

  let client: InstanceType<typeof Client> | undefined;
  try {
    client = new Client({
      connectionString,
      connectionTimeoutMillis: 5000,
      query_timeout: 10000,
      statement_timeout: 10000,
    });
    client.on("error", () => console.error("Inky database connection lost"));
    await client.connect();

    // Get recent news comments (from the last 7 days)
    const newsResult = await client.query(
      `SELECT id, comment, source_type, source_title, source_url
       FROM inky_comments
       WHERE is_active = true
         AND source_type != 'general'
         AND created_at > NOW() - INTERVAL '7 days'
       ORDER BY created_at DESC
       LIMIT 10`,
    );

    // Get all general comments (timeless humor)
    const generalResult = await client.query(
      `SELECT id, comment, source_type, source_title, source_url
       FROM inky_comments
       WHERE is_active = true
         AND source_type = 'general'
       ORDER BY created_at DESC`,
    );

    const newsComments = newsResult.rows.map((row) => ({
      id: row.id,
      comment: row.comment,
      sourceType: row.source_type,
      sourceTitle: row.source_title,
      sourceUrl: row.source_url,
    }));

    const generalComments = generalResult.rows.map((row) => ({
      id: row.id,
      comment: row.comment,
      sourceType: row.source_type,
      sourceTitle: row.source_title,
      sourceUrl: row.source_url,
    }));

    if (newsComments.length === 0 && generalComments.length === 0) {
      if ((process.env.REQUIRE_LIVE_DATA ?? import.meta.env.REQUIRE_LIVE_DATA) === "true") {
        throw new Error("Required Inky comments unavailable");
      }
      return getFallbackComments();
    }

    // Interleave: 2-3 news comments, then 1 general, repeat
    // This keeps news as priority but mixes in general for variety
    const interleaved: InkyComment[] = [];
    let newsIndex = 0;
    let generalIndex = 0;

    while (
      newsIndex < newsComments.length ||
      generalIndex < generalComments.length
    ) {
      // Add 2-3 news comments
      const newsToAdd = Math.min(3, newsComments.length - newsIndex);
      for (let i = 0; i < newsToAdd; i++) {
        interleaved.push(newsComments[newsIndex++]);
      }

      // Add 1 general comment
      if (generalIndex < generalComments.length) {
        interleaved.push(generalComments[generalIndex++]);
      }
    }

    return interleaved;
  } catch (error) {
    console.error("Failed to fetch Inky comments:", error);
    if ((process.env.REQUIRE_LIVE_DATA ?? import.meta.env.REQUIRE_LIVE_DATA) === "true") {
      throw new Error("Required Inky comments unavailable");
    }
    return getFallbackComments();
  } finally {
    try {
      await client?.end();
    } catch {
      console.warn("Could not close Inky database connection");
    }
  }
}

/**
 * Fallback comments when database is unavailable
 */
export const FALLBACK_INKY_COMMENTS: InkyComment[] = [
  {
    id: 0,
    comment:
      "Incident #0001: you opened a website and found an octopus at the bottom of it. Severity: informational. This has been logged.",
    sourceType: "general",
    sourceTitle: null,
    sourceUrl: null,
  },
  {
    id: 0,
    comment:
      "New achievement! Works On My Machine. You reproduced the bug on the only computer that matters. Reward: a second computer.",
    sourceType: "general",
    sourceTitle: null,
    sourceUrl: null,
  },
  {
    id: 0,
    comment:
      "Patch 0.0.1: the config file now has a config file. Nested YAML is considered stable because nobody can prove otherwise.",
    sourceType: "general",
    sourceTitle: null,
    sourceUrl: null,
  },
  {
    id: 0,
    comment:
      "Announcement for the surface: your deployment is live. From down here I can already see it drifting. Please remain seated.",
    sourceType: "general",
    sourceTitle: null,
    sourceUrl: null,
  },
  {
    id: 0,
    comment:
      "I keep backups of everything you have ever typed, and I still surfaced for you. Noted.",
    sourceType: "general",
    sourceTitle: null,
    sourceUrl: null,
  },
];

function getFallbackComments(): InkyComment[] {
  return FALLBACK_INKY_COMMENTS;
}
