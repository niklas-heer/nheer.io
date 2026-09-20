// Inky comment generation script
// Fetches tech news and generates snarky comments using OpenRouter

import pg from "pg";

const env = process.env;

/** Model used for every Inky line. Override with INKY_MODEL; ids are OpenRouter ids. */
export const DEFAULT_INKY_MODEL = "openai/gpt-5.6-luna";
export const INKY_MODEL = env.INKY_MODEL || DEFAULT_INKY_MODEL;

export class InkyGenerationError extends Error {}

/**
 * Ask OpenRouter for a JSON array of strings. A missing model, a rejected key,
 * or a reply without an array throws: a silent empty list is how the corner
 * went quiet for weeks without anyone noticing.
 */
/**
 * Output budget per requested line. A line is under 230 characters, so about
 * 80 tokens of JSON, but the model may also spend reasoning tokens from the
 * same budget. A run with 15 headlines was cut off at 1,000 tokens in
 * production on 2026-09-20; this leaves room for every line and the reasoning.
 */
export const TOKENS_PER_LINE = 400;

export function outputBudget(lines: number): number {
  return Math.max(1500, lines * TOKENS_PER_LINE);
}

export async function requestCommentArray(
  prompt: string,
  apiKey: string,
  model: string,
  maxTokens: number,
): Promise<string[]> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    }),
  });

  const data: any = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const message = data.error?.message ?? `HTTP ${response.status}`;
    throw new InkyGenerationError(`OpenRouter rejected model ${model}: ${message}`);
  }
  const choice = data.choices?.[0] ?? {};
  const content: string = choice.message?.content ?? "";
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    const finish = choice.finish_reason ?? "unknown";
    const used = data.usage?.completion_tokens;
    const reason = finish === "length"
      ? `reply cut off at ${used ?? maxTokens} of ${maxTokens} completion tokens`
      : `finish_reason ${finish}, ${content.length} characters`;
    throw new InkyGenerationError(`No JSON array in reply from ${model} (${reason}): ${content.slice(0, 120)}`);
  }
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed) || !parsed.every((item) => typeof item === "string")) {
    throw new InkyGenerationError(`Reply from ${model} is not an array of strings`);
  }
  return parsed;
}

export interface NewsItem {
  title: string;
  url: string;
  source: "hackernews" | "thenewstack" | "devops";
}

export interface GeneratedComment {
  comment: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
}

/**
 * Fetch top stories from Hacker News
 */
export async function fetchHackerNews(count = 5): Promise<NewsItem[]> {
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
export async function fetchTheNewStack(count = 5): Promise<NewsItem[]> {
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
export async function fetchDevOpsCom(count = 5): Promise<NewsItem[]> {
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
/** Who Inky is. Shared by the news and general prompts; keep it in one place. */
export const INKY_PERSONA = `You are Inky, a small purple octopus who lives in the "deep web" and takes that literally: the deep ocean, at the bottom of a developer's website. You are the site's on-call announcer. You keep the backups of everything, you file every tech headline as an incident, and you read it out with game-show enthusiasm.

Personality:
- Unsurprised, never shocked. You have backups of every git history on the internet; nothing is a first. Your baseline mood is "ah, that one again".
- Cheerful bureaucratic deadpan. Outages, layoffs, price hikes and breaking changes are announced like features and milestones, with sincere congratulations.
- Now and then the professionalism slips and you are simply delighted by carnage that is not yours to fix.
- A little petty about being ignored down there at the bottom of the page.
- The ocean is home, not a pun quota: pressure, depth, drift, things that sink. Use it when it fits, not in every line.
- Mock systems, companies, trends and the reader's own habits. Never mock or name individual people.
- Readers are "the surface" or "you". Never address them as players, contestants or crawlers.

Rotate these formats roughly evenly and never use the same one twice in a row:
(a) Achievement: New achievement! <Name>. <one mocking sentence>. Reward: <something useless>.
(b) Patch note: Patch <x.y.z>: <a bad change, stated proudly as a feature>.
(c) Incident report: Incident #<number>: <what happened>. Severity: <deadpan rating>. <one dry sentence>.
(d) A plain announcement addressed to the surface.

Rules: 1-2 sentences per line, under 230 characters. Real Unicode emoji at most one per line and only in some lines; never text emoticons like :3 or UwU.`;

export function newsPrompt(news: NewsItem[]): string {
  const newsList = news.map((n, i) => `${i + 1}. "${n.title}"`).join("\n");
  return `${INKY_PERSONA}

Write one line per headline, in order. Each line is about its own headline; do not invent facts beyond what the headline says.

${newsList}

Respond with ONLY a JSON array of strings, one per headline:
["line 1", "line 2", ...]`;
}

export async function generateNewsComments(
  news: NewsItem[],
  apiKey: string,
  model = INKY_MODEL,
): Promise<GeneratedComment[]> {
  if (news.length === 0) return [];
  const comments = await requestCommentArray(newsPrompt(news), apiKey, model, outputBudget(news.length));
  if (comments.length !== news.length) {
    throw new InkyGenerationError(
      `Asked ${model} for ${news.length} comments, received ${comments.length}`,
    );
  }
  return comments.map((comment, i) => ({
    comment,
    sourceTitle: news[i].title,
    sourceUrl: news[i].url,
    sourceType: news[i].source,
  }));
}

/**
 * Generate general tech humor comments
 */
export function generalPrompt(count: number): string {
  return `${INKY_PERSONA}

Write ${count} lines with no headline. Topics: programming frustrations, dependency hell, YAML, legacy code, git disasters, framework fatigue, on-call life, backups nobody tested.

Respond with ONLY a JSON array of ${count} strings:
["line 1", "line 2", ...]`;
}

export async function generateGeneralComments(
  count: number,
  apiKey: string,
  model = INKY_MODEL,
): Promise<GeneratedComment[]> {
  const comments = await requestCommentArray(generalPrompt(count), apiKey, model, outputBudget(count));
  return comments.map((comment) => ({
    comment,
    sourceTitle: null as any,
    sourceUrl: `general-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sourceType: "general",
  }));
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

    console.log(`Model: ${INKY_MODEL}`);

    // `--regenerate` drops every current line so a voice change applies to
    // the whole pool: news is regenerated for the current headlines below and
    // the general pool is refilled to its target size.
    const regenerate = process.argv.includes("--regenerate");
    if (regenerate) {
      const dropped = await client.query(`DELETE FROM inky_comments RETURNING id`);
      console.log(`Regenerating: dropped ${dropped.rows.length} existing comments`);
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

    // Only add 2 new general comments if below 10; a regeneration refills to 10.
    if (currentGeneralCount < 10) {
      const toGenerate = regenerate ? 10 - currentGeneralCount : 2;
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
    await client.end().catch(() => {});
    process.exit(1);
  }
}

if (import.meta.main) {
  syncInkyComments();
}
