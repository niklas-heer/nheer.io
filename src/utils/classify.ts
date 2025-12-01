// AI classification utility for podcasts using OpenRouter

export const CATEGORIES = [
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

export interface PodcastToClassify {
  uuid: string;
  title: string;
  author: string;
  description: string | null;
}

/**
 * Classify podcasts into categories using AI
 * @param podcasts - Array of podcasts to classify
 * @param apiKey - OpenRouter API key
 * @returns Map of podcast UUID to category
 */
export async function classifyPodcasts(
  podcasts: PodcastToClassify[],
  apiKey: string,
): Promise<Map<string, string>> {
  if (!apiKey) {
    console.warn("OPENROUTER_API_KEY not set, skipping classification");
    return new Map();
  }

  if (podcasts.length === 0) {
    return new Map();
  }

  const podcastList = podcasts
    .map(
      (p, i) =>
        `${i + 1}. "${p.title}" by ${p.author}${p.description ? ` - ${p.description.slice(0, 100)}` : ""}`,
    )
    .join("\n");

  const prompt = `Classify each podcast into ONE of these categories: ${CATEGORIES.join(", ")}

Podcasts to classify:
${podcastList}

Respond with ONLY a JSON object mapping the podcast number to its category, like:
{"1": "Technology", "2": "Comedy", "3": "News & Politics"}

Be concise. Use exact category names from the list.`;

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
          model: "anthropic/claude-3.5-haiku",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
        }),
      },
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in classification response");
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
    console.error("Classification API call failed:", error);
    return new Map();
  }
}

/**
 * Classify podcasts in batches to avoid token limits
 * @param podcasts - Array of podcasts to classify
 * @param apiKey - OpenRouter API key
 * @param batchSize - Number of podcasts per API call
 * @returns Map of podcast UUID to category
 */
export async function classifyPodcastsInBatches(
  podcasts: PodcastToClassify[],
  apiKey: string,
  batchSize = 20,
): Promise<Map<string, string>> {
  const allClassifications = new Map<string, string>();

  for (let i = 0; i < podcasts.length; i += batchSize) {
    const batch = podcasts.slice(i, i + batchSize);
    console.log(
      `  Classifying batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(podcasts.length / batchSize)}...`,
    );

    const classifications = await classifyPodcasts(batch, apiKey);

    for (const [uuid, category] of classifications) {
      allClassifications.set(uuid, category);
    }

    // Small delay between batches to be nice to the API
    if (i + batchSize < podcasts.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return allClassifications;
}
