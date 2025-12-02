// AI classification script for podcasts using OpenRouter

const env = process.env;

const CATEGORIES = [
  "Technology",
  "Science",
  "News & Politics",
  "Business",
  "Comedy",
  "True Crime",
  "History",
  "Education",
  "Health & Fitness",
  "Society & Culture",
  "Music",
  "Gaming",
  "Sports",
  "Arts",
  "Personal Development",
];

interface PodcastToClassify {
  uuid: string;
  title: string;
  author: string;
  description: string | null;
}

async function classifyPodcasts(podcasts: PodcastToClassify[]): Promise<Map<string, string>> {
  const podcastList = podcasts
    .map((p, i) => `${i + 1}. "${p.title}" by ${p.author}${p.description ? ` - ${p.description.slice(0, 100)}` : ""}`)
    .join("\n");

  const prompt = `Classify each podcast into ONE of these categories: ${CATEGORIES.join(", ")}

Podcasts to classify:
${podcastList}

Respond with ONLY a JSON object mapping the podcast number to its category, like:
{"1": "Technology", "2": "Comedy", "3": "News & Politics"}

Be concise. Use exact category names from the list.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-haiku",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response");
      return new Map();
    }

    const classifications = JSON.parse(jsonMatch[0]);
    const result = new Map<string, string>();

    for (const [index, category] of Object.entries(classifications)) {
      const podcast = podcasts[parseInt(index) - 1];
      if (podcast && CATEGORIES.includes(category as string)) {
        result.set(podcast.uuid, category as string);
      }
    }

    return result;
  } catch (error) {
    console.error("Classification failed:", error);
    return new Map();
  }
}

async function main() {
  const { Client } = await import("pg");
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    console.log("Connected to database");

    // Get podcasts without categories
    const result = await client.query(`
      SELECT uuid, title, author, description
      FROM podcasts
      WHERE category IS NULL AND is_subscribed = true
      ORDER BY title
    `);

    const podcasts: PodcastToClassify[] = result.rows;
    console.log(`Found ${podcasts.length} podcasts to classify`);

    if (podcasts.length === 0) {
      console.log("All podcasts already classified!");
      await client.end();
      return;
    }

    // Process in batches of 20 to avoid token limits
    const batchSize = 20;
    let classified = 0;

    for (let i = 0; i < podcasts.length; i += batchSize) {
      const batch = podcasts.slice(i, i + batchSize);
      console.log(`\nClassifying batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(podcasts.length / batchSize)}...`);

      const classifications = await classifyPodcasts(batch);

      for (const [uuid, category] of classifications) {
        await client.query(
          `UPDATE podcasts SET category = $1, updated_at = NOW() WHERE uuid = $2`,
          [category, uuid]
        );
        classified++;

        const podcast = batch.find((p) => p.uuid === uuid);
        console.log(`  ${podcast?.title} -> ${category}`);
      }
    }

    console.log(`\nClassified ${classified} podcasts`);

    // Show category breakdown
    const breakdown = await client.query(`
      SELECT category, COUNT(*) as count
      FROM podcasts
      WHERE is_subscribed = true AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);

    console.log("\nCategory breakdown:");
    for (const row of breakdown.rows) {
      console.log(`  ${row.category}: ${row.count}`);
    }

    await client.end();
  } catch (error: any) {
    console.error("Classification failed:", error.message);
    await client.end();
    process.exit(1);
  }
}

main();
