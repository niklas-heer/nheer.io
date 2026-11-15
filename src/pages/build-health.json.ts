import { fetchPodcastData } from '../utils/database';
import { assertLiveSnapshot } from '../utils/podcast-health.mjs';

export async function GET() {
  const data = await fetchPodcastData();
  const report = {
    source: (process.env.SITE_TEST_DATA ?? import.meta.env.SITE_TEST_DATA) === 'true' ? 'fixture' : data?.stats ? 'live' : 'unavailable',
    snapshot: data?.stats?.date ?? null,
    builtAt: new Date().toISOString(),
    draftPreview: (process.env.PREVIEW_DRAFTS ?? import.meta.env.PREVIEW_DRAFTS) === 'true',
  };
  if ((process.env.REQUIRE_LIVE_DATA ?? import.meta.env.REQUIRE_LIVE_DATA) === 'true') assertLiveSnapshot(report);
  return new Response(JSON.stringify(report), { headers: { 'Content-Type': 'application/json' } });
}
