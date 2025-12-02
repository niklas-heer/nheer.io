const env = process.env;

async function testApi() {
  // Login
  const loginRes = await fetch("https://api.pocketcasts.com/user/login", {
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
  const { token } = await loginRes.json();

  // Get subscriptions
  const subsRes = await fetch("https://api.pocketcasts.com/user/podcast/list", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const data = await subsRes.json();

  console.log("First podcast fields:");
  if (data.podcasts && data.podcasts[0]) {
    console.log(JSON.stringify(data.podcasts[0], null, 2));
  }
}

testApi();
