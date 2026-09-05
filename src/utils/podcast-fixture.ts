import type { PodcastData } from './database';

// Explicit CI-only data. Publishing rejects builds containing this fixture.
export function podcastFixture(): PodcastData {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const podcast = { uuid: 'ci-podcast', title: 'The Test Signal', author: 'CI fixtures', description: 'Deterministic test data', imageUrl: null, category: 'Technology', slug: 'the-test-signal', episodeCount: 1 };
  const episode = { uuid: 'ci-episode', podcastUuid: podcast.uuid, podcastTitle: podcast.title, podcastImageUrl: null, podcastSlug: podcast.slug, title: 'A passing test is worth two guesses', slug: 'passing-test', duration: 1800, playedUpTo: 900, publishedAt: today, completed: false, starred: false };
  const stats = { date: today, timeListened: 7200, timeSilenceRemoval: 60, timeSkipping: 30, timeIntroSkipping: 10, timeVariableSpeed: 120 };
  const daily = { date: today, timeListened: 900, episodesStarted: 1, episodesCompleted: 0 };
  return { stats, statsHistory: [stats], dailyStats: [daily], monthlyStats: [daily], yesterdayStats: { ...daily, date: yesterday }, podcasts: [podcast], podcastsByCategory: new Map([['Technology', [podcast]]]), recentEpisodes: [episode], inProgressEpisodes: [episode], recentlyCompleted: [], totalEpisodes: 1, totalCompletedEpisodes: 0, daysSinceStart: 2 };
}
