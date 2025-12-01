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
 * Get random active Inky comments for the page
 */
export async function getInkyComments(count = 5): Promise<InkyComment[]> {
  const connectionString = import.meta.env.DATABASE_URL;
  if (!connectionString) {
    console.warn("DATABASE_URL not set, using fallback comments");
    return getFallbackComments();
  }

  const client = new Client({ connectionString });

  try {
    await client.connect();

    // Get random mix of comments, preferring less-used ones
    const result = await client.query(
      `SELECT id, comment, source_type, source_title, source_url
       FROM inky_comments
       WHERE is_active = true
       ORDER BY used_count ASC, RANDOM()
       LIMIT $1`,
      [count],
    );

    await client.end();

    if (result.rows.length === 0) {
      return getFallbackComments();
    }

    return result.rows.map((row) => ({
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
