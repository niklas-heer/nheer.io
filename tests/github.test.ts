import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { fetchGitHubRepo } from "../src/utils/github";

const originalFetch = globalThis.fetch;
const originalToken = process.env.GITHUB_TOKEN;
const originalLive = process.env.REQUIRE_LIVE_DATA;
const originalTestData = process.env.SITE_TEST_DATA;
function respond(body: unknown, status = 200) {
  globalThis.fetch = mock(async () => Response.json(body, { status })) as typeof fetch;
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
  process.env.REQUIRE_LIVE_DATA = "true";
  process.env.SITE_TEST_DATA = "false";
  spyOn(console, "error").mockImplementation(() => {});
  spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = originalToken;
  if (originalLive === undefined) delete process.env.REQUIRE_LIVE_DATA;
  else process.env.REQUIRE_LIVE_DATA = originalLive;
  if (originalTestData === undefined) delete process.env.SITE_TEST_DATA;
  else process.env.SITE_TEST_DATA = originalTestData;
  mock.restore();
});

const sampleRepo = {
  full_name: "niklas-heer/tdx",
  html_url: "https://github.com/niklas-heer/tdx",
  description: "todos",
  stargazers_count: 68,
  forks_count: 5,
  language: "Go",
  license: { spdx_id: "MIT" },
  updated_at: "2026-09-01T00:00:00Z",
};

test("fetchGitHubRepo authenticates and returns the requested repository", async () => {
  let authorization: string | null = null;
  globalThis.fetch = mock(async (_input, init) => {
    authorization = new Headers(init?.headers).get("Authorization");
    return Response.json(sampleRepo);
  }) as typeof fetch;
  expect(await fetchGitHubRepo("niklas-heer/tdx")).toEqual(sampleRepo);
  expect(authorization).toBe("Bearer test-token");
});

test("fetchGitHubRepo uses sample data instead of GitHub during test builds", async () => {
  process.env.SITE_TEST_DATA = "true";
  globalThis.fetch = mock(async () => {
    throw new Error("GitHub should not be contacted for sample data");
  }) as typeof fetch;
  const result = await fetchGitHubRepo("niklas-heer/kipferl");
  expect(result?.full_name).toBe("niklas-heer/kipferl");
  expect(result?.html_url).toBe("https://github.com/niklas-heer/kipferl");
});

test("fetchGitHubRepo fails closed for live publishing", async () => {
  for (const status of [403, 429]) {
    respond({ message: "Unavailable" }, status);
    await expect(fetchGitHubRepo("niklas-heer/tdx")).rejects.toThrow("Required GitHub data unavailable");
  }
});

test("optional fetchGitHubRepo builds keep a null card on API failure", async () => {
  process.env.REQUIRE_LIVE_DATA = "false";
  respond({ message: "Unavailable" }, 403);
  expect(await fetchGitHubRepo("niklas-heer/tdx")).toBeNull();
});
