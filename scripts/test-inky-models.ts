/**
 * Compare Inky's voice across models: the real news prompt on live headlines
 * plus the general-joke prompt. Prints only; stores nothing.
 *
 *   bun run scripts/test-inky-models.ts [model ...]
 */
import {
  DEFAULT_INKY_MODEL,
  fetchHackerNews,
  generateGeneralComments,
  generateNewsComments,
} from "./sync-inky";

const candidates = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [DEFAULT_INKY_MODEL];

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("OPENROUTER_API_KEY not set");
  process.exit(1);
}

const headlines = (await fetchHackerNews(3)).slice(0, 3);
console.log("Headlines:");
for (const item of headlines) console.log(`  - ${item.title}`);

for (const model of candidates) {
  console.log(`\n${"=".repeat(64)}\n${model}\n${"-".repeat(64)}`);
  const started = Date.now();
  try {
    const news = await generateNewsComments(headlines, apiKey, model);
    for (const c of news) console.log(`  news: ${c.comment}`);
    const general = await generateGeneralComments(3, apiKey, model);
    for (const c of general) console.log(`  joke: ${c.comment}`);
    console.log(`  (${((Date.now() - started) / 1000).toFixed(1)}s)`);
  } catch (error) {
    console.log(`  FAILED: ${(error as Error).message}`);
  }
}
