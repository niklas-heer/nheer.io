/**
 * Test different models for Inky comment generation
 */

const models = [
  "openai/gpt-5.1-codex-mini",
  "openai/gpt-5.1-chat",
  "anthropic/claude-haiku-4.5",
  "anthropic/claude-sonnet-4.5",
  "anthropic/claude-opus-4.5",
  "google/gemini-2.5-pro",
];

const prompt = `You are Inky, a snarky kawaii octopus mascot who lives in the "deep web" (you take this literally as the deep ocean). Generate 3 unique snarky tech humor comments. Your personality:
- Tech-savvy but slightly jaded
- Love ocean/nautical puns mixed with tech
- Reference Docker, Kubernetes, containers, npm, git, JavaScript, etc.
- Fourth-wall breaks are welcome
- Cute but sassy with attitude
- Keep comments short (1-2 sentences max)
- Use real Unicode emojis sparingly (🐙, 🌊, 💀, 🔥, etc.) - NEVER use text emoticons like :3, UwU, :tada:, or similar
- Topics: programming frustrations, dependency hell, YAML nightmares, legacy code, git disasters, framework fatigue, etc.

Respond with ONLY a JSON array of 3 unique comment strings:
["comment 1", "comment 2", "comment 3"]`;

async function testModel(model: string, apiKey: string): Promise<string[]> {
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
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 500,
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      return [`Error: ${data.error.message || JSON.stringify(data.error)}`];
    }

    const content = data.choices?.[0]?.message?.content || "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [`No JSON found: ${content.substring(0, 100)}`];
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return [`Failed: ${error}`];
  }
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPENROUTER_API_KEY not set");
    process.exit(1);
  }

  console.log("Testing Inky comment generation with different models...\n");
  console.log("=".repeat(60) + "\n");

  for (const model of models) {
    console.log(`📦 Model: ${model}`);
    console.log("-".repeat(60));

    const comments = await testModel(model, apiKey);

    comments.forEach((comment, i) => {
      console.log(`  ${i + 1}. ${comment}`);
    });

    console.log("\n");
  }
}

main();
