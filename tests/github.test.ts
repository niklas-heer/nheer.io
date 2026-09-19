import { afterEach, beforeEach, expect, mock, spyOn, test } from "bun:test";
import { fetchGitHubData } from "../src/utils/github";

const originalFetch = globalThis.fetch;
const originalToken = process.env.GITHUB_TOKEN;
const originalLive = process.env.REQUIRE_LIVE_DATA;
const repo = {
  name: "accessible", description: null, url: "https://github.com/example/accessible",
  homepageUrl: null, stargazerCount: 4, forkCount: 1, primaryLanguage: null,
  repositoryTopics: { nodes: [] },
};
const user = {
  avatarUrl: "https://example.test/avatar.png", bio: null, createdAt: "2020-01-01",
  followers: { totalCount: 2 }, repositories: { totalCount: 3 },
  pinnedItems: { nodes: [repo, null] },
};
const deniedPin = { type: "FORBIDDEN", path: ["user", "pinnedItems", "nodes", 1] };

function respond(body: unknown, status = 200) {
  globalThis.fetch = mock(async () => Response.json(body, { status })) as typeof fetch;
}

beforeEach(() => {
  process.env.GITHUB_TOKEN = "test-token";
  process.env.REQUIRE_LIVE_DATA = "true";
  spyOn(console, "error").mockImplementation(() => {});
  spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalToken === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = originalToken;
  if (originalLive === undefined) delete process.env.REQUIRE_LIVE_DATA;
  else process.env.REQUIRE_LIVE_DATA = originalLive;
  mock.restore();
});

test("keeps live profile and accessible pins when an organization denies one pin", async () => {
  respond({ data: { user }, errors: [deniedPin] });
  const result = await fetchGitHubData();
  expect(result?.pinnedRepos).toEqual([repo]);
  expect(result?.followers).toBe(2);
  expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("1 accessible live repositories"));
});

test("accepts a successful response with no errors or an empty errors array", async () => {
  for (const errors of [undefined, []]) {
    respond({ data: { user: { ...user, pinnedItems: { nodes: [repo] } } }, errors });
    expect((await fetchGitHubData())?.pinnedRepos).toEqual([repo]);
  }
});

test("allows a genuinely empty pin list", async () => {
  respond({ data: { user: { ...user, pinnedItems: { nodes: [] } } } });
  expect((await fetchGitHubData())?.pinnedRepos).toEqual([]);
});

test("does not publish when every pin is inaccessible or the profile is missing", async () => {
  for (const profile of [null, { ...user, pinnedItems: { nodes: [null, null] } }]) {
    respond({ data: { user: profile }, errors: [deniedPin] });
    await expect(fetchGitHubData()).rejects.toThrow("Required GitHub data unavailable");
  }
});

test("only tolerates FORBIDDEN errors at the exact null pinned repository", async () => {
  for (const error of [
    { type: "RATE_LIMITED" },
    { type: "INTERNAL", path: deniedPin.path },
    { type: "FORBIDDEN" },
    { type: "FORBIDDEN", path: ["user"] },
    { type: "FORBIDDEN", path: ["user", "followers"] },
    { type: "FORBIDDEN", path: ["user", "pinnedItems", "nodes", 0] },
    { type: "FORBIDDEN", path: ["user", "pinnedItems", "nodes", 99] },
    { type: "FORBIDDEN", path: [...deniedPin.path, "stargazerCount"] },
  ]) {
    respond({ data: { user }, errors: [deniedPin, error] });
    await expect(fetchGitHubData()).rejects.toThrow("Required GitHub data unavailable");
  }
});

test("HTTP authentication and service errors still prevent live publishing", async () => {
  for (const status of [401, 403, 429, 503]) {
    respond({ message: "Unavailable" }, status);
    await expect(fetchGitHubData()).rejects.toThrow("Required GitHub data unavailable");
  }
});

test("optional builds retain their null fallback on API failure", async () => {
  process.env.REQUIRE_LIVE_DATA = "false";
  respond({ errors: [{ type: "FORBIDDEN" }] });
  expect(await fetchGitHubData()).toBeNull();
});
