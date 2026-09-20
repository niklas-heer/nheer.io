import { afterAll, afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { EventEmitter } from "node:events";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalDev = process.env.DEV;
const originalRequireLive = process.env.REQUIRE_LIVE_DATA;
const originalTestData = process.env.SITE_TEST_DATA;
const originalFetch = globalThis.fetch;
let failure: "constructor" | "connect" | "query" | undefined;
let cleanupFails = false;
const clients: FakeClient[] = [];

class FakeClient extends EventEmitter {
  closed = 0;
  queries = 0;

  constructor(public config: Record<string, unknown>) {
    super();
    if (failure === "constructor") throw new Error("Invalid connection configuration");
    clients.push(this);
  }

  async connect() {
    if (failure === "connect") throw new Error("Connection timeout");
  }

  async query(sql: string) {
    this.queries++;
    if (failure === "query") throw new Error("Query timeout");
    return { rows: sql.includes("COUNT(*)") ? [{ count: "0" }] : [] };
  }

  async end() {
    this.closed++;
    if (cleanupFails) throw new Error("Connection already broken");
  }
}

// Import only after mocking pg: these tests never open a real connection.
mock.module("pg", () => ({ default: { Client: FakeClient }, Client: FakeClient }));
const { fetchPodcastData } = await import("../src/utils/database");
const { getInkyComments } = await import("../src/utils/inky");
const { fetchStats } = await import("../src/utils/pocketcasts");

beforeEach(() => {
  process.env.DATABASE_URL = "postgres://test.invalid/example";
  process.env.DEV = "true";
  process.env.REQUIRE_LIVE_DATA = "false";
  process.env.SITE_TEST_DATA = "false";
  failure = undefined;
  cleanupFails = false;
  clients.length = 0;
  spyOn(console, "error").mockImplementation(() => {});
  spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

afterAll(() => {
  if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = originalDatabaseUrl;
  if (originalDev === undefined) delete process.env.DEV;
  else process.env.DEV = originalDev;
  if (originalRequireLive === undefined) delete process.env.REQUIRE_LIVE_DATA;
  else process.env.REQUIRE_LIVE_DATA = originalRequireLive;
  if (originalTestData === undefined) delete process.env.SITE_TEST_DATA;
  else process.env.SITE_TEST_DATA = originalTestData;
});

describe("database reads", () => {
  test("missing credentials use existing fallbacks without creating a client", async () => {
    delete process.env.DATABASE_URL;
    expect(await fetchPodcastData()).toBeNull();
    expect((await getInkyComments()).length).toBeGreaterThan(0);
    expect(clients).toHaveLength(0);
  });

  test("sample-data builds read the fallback Inky lines without opening a client", async () => {
    process.env.SITE_TEST_DATA = "true";
    const comments = await getInkyComments();
    expect(comments).toHaveLength(5);
    expect(comments.every((comment) => comment.sourceType === "general")).toBe(true);
    expect(clients).toHaveLength(0);
  });

  for (const phase of ["constructor", "connect", "query"] as const) {
    test(`${phase} failures return fallbacks and close any created clients`, async () => {
      failure = phase;
      expect(await fetchPodcastData()).toBeNull();
      expect((await getInkyComments()).length).toBeGreaterThan(0);
      expect(clients).toHaveLength(phase === "constructor" ? 0 : 2);
      for (const client of clients) expect(client.closed).toBe(1);
    });
  }

  test("cleanup failures cannot reject successful reads or fallbacks", async () => {
    cleanupFails = true;
    expect((await fetchPodcastData())?.totalEpisodes).toBe(0);
    expect((await getInkyComments()).length).toBeGreaterThan(0);
    failure = "query";
    expect(await fetchPodcastData()).toBeNull();
    expect((await getInkyComments()).length).toBeGreaterThan(0);
    for (const client of clients) expect(client.closed).toBe(1);
  });

  test("required live builds reject missing or failed database reads", async () => {
    process.env.REQUIRE_LIVE_DATA = "true";
    for (const phase of ["constructor", "connect", "query"] as const) {
      failure = phase;
      await expect(fetchPodcastData()).rejects.toThrow("Required podcast data unavailable");
      await expect(getInkyComments()).rejects.toThrow("Required Inky comments unavailable");
    }
    delete process.env.DATABASE_URL;
    await expect(fetchPodcastData()).rejects.toThrow("Required podcast data unavailable");
    await expect(getInkyComments()).rejects.toThrow("Required Inky comments unavailable");
    for (const client of clients) expect(client.closed).toBe(1);
  });

  test("fixture builds avoid database access and cannot masquerade as live builds", async () => {
    process.env.SITE_TEST_DATA = "true";
    expect((await fetchPodcastData())?.stats).not.toBeNull();
    expect(clients).toHaveLength(0);
    process.env.REQUIRE_LIVE_DATA = "true";
    await expect(fetchPodcastData()).rejects.toThrow("Test data cannot be used in a live build");
    expect(clients).toHaveLength(0);
  });

  test("reads bound connection/query waits and handle idle connection errors", async () => {
    await fetchPodcastData();
    await getInkyComments();
    for (const client of clients) {
      expect(client.config.connectionTimeoutMillis).toBe(5000);
      expect(client.config.query_timeout).toBe(10000);
      expect(client.config.statement_timeout).toBe(10000);
      expect(() => client.emit("error", new Error("Connection lost"))).not.toThrow();
      expect(client.closed).toBe(1);
    }
  });

  test("concurrent production pages share one snapshot per data source", async () => {
    delete process.env.DEV;
    const podcasts = await Promise.all([fetchPodcastData(), fetchPodcastData()]);
    const comments = await Promise.all([getInkyComments(), getInkyComments()]);
    expect(clients).toHaveLength(2);
    expect(podcasts[0]).toBe(podcasts[1]);
    expect(comments[0]).toBe(comments[1]);
    for (const client of clients) expect(client.closed).toBe(1);
  });
});

describe("Pocket Casts cumulative stats", () => {
  const validStats = {
    timeListened: 120,
    timeSilenceRemoval: 0,
    timeSkipping: 15,
    timeIntroSkipping: 0,
    timeVariableSpeed: 3.5,
  };

  function respond(body: unknown, status = 200) {
    globalThis.fetch = mock(async (_url: unknown, options?: RequestInit) => {
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      return new Response(JSON.stringify(body), { status });
    }) as typeof fetch;
  }

  test("accepts legitimate values, including zeros and fractions", async () => {
    respond(validStats);
    expect(await fetchStats("test-token")).toEqual(validStats);
  });

  test("an HTTP error never becomes a writable zero snapshot", async () => {
    respond({ error: "rate limited" }, 429);
    await expect(fetchStats("test-token")).rejects.toThrow("Pocket Casts statistics request failed");
  });

  test("normalizes live numeric strings and supports omitted optional counters", async () => {
    respond({ timeListened: "123.5" });
    expect(await fetchStats("test-token")).toEqual({
      timeListened: 123.5,
      timeSilenceRemoval: 0,
      timeSkipping: 0,
      timeIntroSkipping: 0,
      timeVariableSpeed: 0,
    });
  });

  for (const [label, body] of [
    ["API error", { error: "unexpected response" }],
    ["null", null],
    ["missing required field", { timeSkipping: 123 }],
    ["invalid numeric string", { ...validStats, timeListened: "123 seconds" }],
    ["negative value", { ...validStats, timeListened: -1 }],
  ] as const) {
    test(`rejects ${label} instead of inventing zeros`, async () => {
      respond(body);
      await expect(fetchStats("test-token")).rejects.toThrow("Pocket Casts statistics request failed");
    });
  }

  test("invalid JSON and network failures abort the sync", async () => {
    globalThis.fetch = mock(async () => new Response("not JSON")) as typeof fetch;
    await expect(fetchStats("test-token")).rejects.toThrow("Pocket Casts statistics request failed");
    globalThis.fetch = mock(async () => { throw new Error("Request timed out"); }) as typeof fetch;
    await expect(fetchStats("test-token")).rejects.toThrow("Pocket Casts statistics request failed");
  });
});
