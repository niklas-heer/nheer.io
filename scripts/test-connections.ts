// Test script to validate all API connections

// Load environment variables
const env = process.env;

async function testNeonDatabase() {
  console.log("Testing Neon database connection...");
  const { Client } = await import("pg");
  const client = new Client({ connectionString: env.DATABASE_URL });

  try {
    await client.connect();
    const result = await client.query("SELECT version()");
    console.log("Neon database connected!");
    console.log("   Version:", result.rows[0].version.split(" ").slice(0, 2).join(" "));
    await client.end();
    return true;
  } catch (error: any) {
    console.log("Neon database failed:", error.message);
    return false;
  }
}

async function testPocketCasts() {
  console.log("\nTesting Pocket Casts authentication...");

  try {
    const response = await fetch("https://api.pocketcasts.com/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://play.pocketcasts.com",
      },
      body: JSON.stringify({
        email: env.POCKETCASTS_EMAIL,
        password: env.POCKETCASTS_PASSWORD,
        scope: "webplayer",
      }),
    });

    const data = await response.json();

    if (data.token) {
      console.log("Pocket Casts authenticated!");
      console.log("   Email:", data.email);

      // Test stats endpoint
      const statsResponse = await fetch("https://api.pocketcasts.com/user/stats/summary", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${data.token}`,
          "Content-Type": "application/json",
        },
      });
      const stats = await statsResponse.json();
      if (stats.timeListened) {
        const hours = Math.round(stats.timeListened / 3600);
        console.log("   Total listening time:", hours, "hours");
      }
      return { success: true, token: data.token };
    } else {
      console.log("Pocket Casts failed:", data.message || "Unknown error");
      return { success: false };
    }
  } catch (error: any) {
    console.log("Pocket Casts failed:", error.message);
    return { success: false };
  }
}

async function testOpenRouter() {
  console.log("\nTesting OpenRouter API...");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("OpenRouter connected!");
      console.log("   Available models:", data.data?.length || 0);
      return true;
    } else {
      console.log("OpenRouter failed:", response.status, response.statusText);
      return false;
    }
  } catch (error: any) {
    console.log("OpenRouter failed:", error.message);
    return false;
  }
}

async function main() {
  console.log("=".repeat(50));
  console.log("Testing all connections...");
  console.log("=".repeat(50));

  const neonOk = await testNeonDatabase();
  const pocketCastsResult = await testPocketCasts();
  const openRouterOk = await testOpenRouter();

  console.log("\n" + "=".repeat(50));
  console.log("Summary:");
  console.log("  Neon Database:", neonOk ? "OK" : "FAILED");
  console.log("  Pocket Casts:", pocketCastsResult.success ? "OK" : "FAILED");
  console.log("  OpenRouter:", openRouterOk ? "OK" : "FAILED");
  console.log("=".repeat(50));
}

main();
