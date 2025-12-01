// Inky comment generation script
// Fetches tech news and generates snarky comments using OpenRouter

import pg from "pg";

const env = process.env;

interface NewsItem {
  title: string;
  url: string;
  source: "hackernews" | "thenewstack" | "devops";
}

interface GeneratedComment {
  comment: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
}

/**
 * Fetch top stories from Hacker News
 */
async function fetchHackerNews(count = 5): Promise<NewsItem[]> {
  try {
    const topStoriesRes = await fetch(
      "https://hacker-news.firebaseio.com/v0/topstories.json",
    );
    const topStoryIds: number[] = await topStoriesRes.json();

    const stories: NewsItem[] = [];
    for (const id of topStoryIds.slice(0, count)) {
      const storyRes = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
      );
      const story = await storyRes.json();
      if (story && story.title && story.url) {
        stories.push({
          title: story.title,
          url: story.url,
          source: "hackernews",
        });
      }
    }

    return stories;
  } catch (error) {
    console.error("Failed to fetch Hacker News:", error);
    return [];
  }
}

/**
 * Parse RSS feed with flexible title format handling
 */
function parseRssFeed(
  xml: string,
  source: "thenewstack" | "devops",
  count = 5,
): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) || [];

  for (const itemXml of itemMatches.slice(0, count)) {
    // Try CDATA format first, then plain format
    let titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    if (!titleMatch) {
      titleMatch = itemXml.match(/<title>([^<]+)<\/title>/);
    }

    const linkMatch = itemXml.match(/<link>([^<]+)<\/link>/);

    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        url: linkMatch[1].trim(),
        source,
      });
    }
  }

  return items;
}

/**
 * Fetch latest from The New Stack (DevOps/Cloud Native focused)
 */
async function fetchTheNewStack(count = 5): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://thenewstack.io/feed/");
    const xml = await res.text();
    return parseRssFeed(xml, "thenewstack", count);
  } catch (error) {
    console.error("Failed to fetch The New Stack:", error);
    return [];
  }
}

/**
 * Fetch latest from DevOps.com
 */
async function fetchDevOpsCom(count = 5): Promise<NewsItem[]> {
  try {
    const res = await fetch("https://devops.com/feed/");
    const xml = await res.text();
    return parseRssFeed(xml, "devops", count);
  } catch (error) {
    console.error("Failed to fetch DevOps.com:", error);
    return [];
  }
}

/**
 * Generate snarky comments for news items using OpenRouter
 */
async function generateNewsComments(
  news: NewsItem[],
  apiKey: string,
): Promise<GeneratedComment[]> {
  if (news.length === 0) return [];

  const newsList = news.map((n, i) => `${i + 1}. "${n.title}"`).join("\n");

  const prompt = `You are Inky, a snarky kawaii octopus mascot who lives in the "deep web" (you take this literally as the deep ocean). You surface occasionally to make sassy comments about tech news. Your personality:
- Tech-savvy but slightly jaded
- Love ocean/nautical puns mixed with tech
- Reference Docker, Kubernetes, containers (ocean themes!)
- Fourth-wall breaks are welcome
- Cute but sassy with attitude
- Keep comments short (1-2 sentences max)
- Use real Unicode emojis sparingly (🐙, 🌊, 💀, 🔥, etc.) - NEVER use text emoticons like :3, UwU, :tada:, or similar

Generate a snarky comment for each of these tech headlines:

${newsList}

Respond with ONLY a JSON array of strings, one comment per headline:
["comment 1", "comment 2", ...]`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5.1-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        }),
      },
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in response");
      return [];
    }

    const comments: string[] = JSON.parse(jsonMatch[0]);
    return comments.map((comment, i) => ({
      comment,
      sourceTitle: news[i].title,
      sourceUrl: news[i].url,
      sourceType: news[i].source,
    }));
  } catch (error) {
    console.error("Failed to generate news comments:", error);
    return [];
  }
}

/**
 * Generate general tech humor comments
 */
async function generateGeneralComments(
  count: number,
  apiKey: string,
): Promise<GeneratedComment[]> {
  const prompt = `You are Inky, a snarky kawaii octopus mascot who lives in the "deep web" (you take this literally as the deep ocean). Generate ${count} unique snarky tech humor comments. Your personality:
- Tech-savvy but slightly jaded
- Love ocean/nautical puns mixed with tech
- Reference Docker, Kubernetes, containers, npm, git, JavaScript, etc.
- Fourth-wall breaks are welcome
- Cute but sassy with attitude
- Keep comments short (1-2 sentences max)
- Use real Unicode emojis sparingly (🐙, 🌊, 💀, 🔥, etc.) - NEVER use text emoticons like :3, UwU, :tada:, or similar
- Topics: programming frustrations, dependency hell, YAML nightmares, legacy code, git disasters, framework fatigue, etc.

Respond with ONLY a JSON array of ${count} unique comment strings:
["comment 1", "comment 2", ...]`;

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5.1-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
        }),
      },
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in response");
      return [];
    }

    const comments: string[] = JSON.parse(jsonMatch[0]);
    return comments.map((comment) => ({
      comment,
      sourceTitle: null as any,
      sourceUrl: `general-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sourceType: "general",
    }));
  } catch (error) {
    console.error("Failed to generate general comments:", error);
    return [];
  }
}

async function syncInkyComments() {
  const { Client } = pg;
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    console.log("Connected to database");

    if (!env.OPENROUTER_API_KEY) {
      console.log("OPENROUTER_API_KEY not set, skipping Inky sync");
      await client.end();
      return;
    }

    // Fetch news from all sources
    console.log("\nFetching tech news...");
    const [hnNews, tnsNews, devopsNews] = await Promise.all([
      fetchHackerNews(5),
      fetchTheNewStack(5),
      fetchDevOpsCom(5),
    ]);
    console.log(`  Hacker News: ${hnNews.length} stories`);
    console.log(`  The New Stack: ${tnsNews.length} stories`);
    console.log(`  DevOps.com: ${devopsNews.length} stories`);

    // Filter out already-commented news
    const allNews = [...hnNews, ...tnsNews, ...devopsNews];
    const existingUrls = await client.query(
      `SELECT source_url FROM inky_comments WHERE source_url = ANY($1)`,
      [allNews.map((n) => n.url)],
    );
    const existingUrlSet = new Set(existingUrls.rows.map((r) => r.source_url));

    const newNews = allNews.filter((n) => !existingUrlSet.has(n.url));
    console.log(`  New stories to comment on: ${newNews.length}`);

    // Generate comments for new news
    if (newNews.length > 0) {
      console.log("\nGenerating snarky news comments...");
      const newsComments = await generateNewsComments(
        newNews,
        env.OPENROUTER_API_KEY,
      );

      for (const c of newsComments) {
        await client.query(
          `INSERT INTO inky_comments (comment, source_type, source_title, source_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (source_url) DO NOTHING`,
          [c.comment, c.sourceType, c.sourceTitle, c.sourceUrl],
        );
        console.log(`  Added: "${c.comment.slice(0, 50)}..."`);
      }
    }

    // Only generate general comments if running low (they're filler, not the main attraction)
    const generalCount = await client.query(
      `SELECT COUNT(*) FROM inky_comments WHERE source_type = 'general' AND is_active = true`,
    );
    const currentGeneralCount = parseInt(generalCount.rows[0].count);
    console.log(`\nCurrent general comments: ${currentGeneralCount}`);

    // Only add 2 new general comments if below 10
    if (currentGeneralCount < 10) {
      const toGenerate = 2;
      console.log(
        `Running low on general comments, generating ${toGenerate}...`,
      );

      const generalComments = await generateGeneralComments(
        toGenerate,
        env.OPENROUTER_API_KEY,
      );

      for (const c of generalComments) {
        await client.query(
          `INSERT INTO inky_comments (comment, source_type, source_title, source_url)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (source_url) DO NOTHING`,
          [c.comment, c.sourceType, c.sourceTitle, c.sourceUrl],
        );
        console.log(`  Added: "${c.comment.slice(0, 50)}..."`);
      }
    } else {
      console.log("General comments pool is healthy, skipping generation");
    }

    // Delete old news comments (older than 7 days)
    const deleted = await client.query(
      `DELETE FROM inky_comments
       WHERE source_type != 'general'
         AND created_at < NOW() - INTERVAL '7 days'
       RETURNING id`,
    );
    if (deleted.rows.length > 0) {
      console.log(
        `\nDeleted ${deleted.rows.length} old news comments (>7 days)`,
      );
    }

    // Delete oldest general comments if we have too many (keep max 30)
    const excessGeneral = await client.query(
      `DELETE FROM inky_comments
       WHERE id IN (
         SELECT id FROM inky_comments
         WHERE source_type = 'general'
         ORDER BY created_at ASC
         LIMIT GREATEST(0, (SELECT COUNT(*) FROM inky_comments WHERE source_type = 'general') - 15)
       )
       RETURNING id`,
    );
    if (excessGeneral.rows.length > 0) {
      console.log(
        `Deleted ${excessGeneral.rows.length} excess general comments (keeping max 15)`,
      );
    }

    // Summary
    const stats = await client.query(`
      SELECT source_type, COUNT(*) as count, SUM(used_count) as total_uses
      FROM inky_comments
      WHERE is_active = true
      GROUP BY source_type
    `);

    console.log("\n" + "=".repeat(50));
    console.log("Inky comments summary:");
    for (const row of stats.rows) {
      console.log(`  ${row.source_type}: ${row.count} comments`);
    }
    console.log("=".repeat(50));

    await client.end();
  } catch (error: any) {
    console.error("Inky sync failed:", error.message);
    await client.end();
    process.exit(1);
  }
}

syncInkyComments();
