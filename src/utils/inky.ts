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
export async function getInkyComments(): Promise<InkyComment[]> {
  const connectionString = import.meta.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL not set, using fallback comments");
    return getFallbackComments();
  }

  const client = new Client({ connectionString });

  try {
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

    await client.end();

    const allComments = [...newsResult.rows, ...generalResult.rows];

    if (allComments.length === 0) {
      return getFallbackComments();
    }

    return allComments.map((row) => ({
      id: row.id,
      comment: row.comment,
      sourceType: row.source_type,
      sourceTitle: row.source_title,
      sourceUrl: row.source_url,
    }));
  } catch (error) {
    console.error("Failed to fetch Inky comments:", error);
    await client.end();
    return getFallbackComments();
  }
}

/**
 * Fallback comments when database is unavailable
 */
function getFallbackComments(): InkyComment[] {
  return [
    {
      id: 0,
      comment:
        "I surfaced from the deep web just to judge your code. No regrets.",
      sourceType: "general",
      sourceTitle: null,
      sourceUrl: null,
    },
    {
      id: 0,
      comment:
        "Your Docker containers are more tangled than my tentacles. Impressive, actually.",
      sourceType: "general",
      sourceTitle: null,
      sourceUrl: null,
    },
    {
      id: 0,
      comment:
        "I've seen cleaner git histories in the Mariana Trench. And I live there.",
      sourceType: "general",
      sourceTitle: null,
      sourceUrl: null,
    },
    {
      id: 0,
      comment:
        "Kubernetes? More like Kuber-not-today. Even my eight arms can't manage that YAML.",
      sourceType: "general",
      sourceTitle: null,
      sourceUrl: null,
    },
    {
      id: 0,
      comment:
        "They say the ocean is deep, but have you seen your node_modules folder?",
      sourceType: "general",
      sourceTitle: null,
      sourceUrl: null,
    },
  ];
}
