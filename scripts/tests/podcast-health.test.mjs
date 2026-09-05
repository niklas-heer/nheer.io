import assert from 'node:assert/strict';
import test from 'node:test';
import { assertLiveSnapshot, snapshotStatus } from '../../src/utils/podcast-health.mjs';
import { readPocketResponse, canAttributeToToday } from '../../src/utils/pocketcasts-response.mjs';

const now = new Date('2026-09-05T12:00:00Z');
test('an old database, absent date or future date cannot pass freshness checks', () => {
  for (const snapshot of ['2026-06-08', null, 'invalid', '2027-01-01']) {
    assert.throws(() => assertLiveSnapshot({ source: 'live', snapshot }, now));
  }
  assert.equal(snapshotStatus('2026-09-05', now), 'fresh');
});
test('publishing rejects sample data and draft previews even with a fresh date', () => {
  assert.throws(() => assertLiveSnapshot({ source: 'fixture', snapshot: now }, now));
  assert.throws(() => assertLiveSnapshot({ source: 'live', snapshot: now, draftPreview: true }, now));
  assert.doesNotThrow(() => assertLiveSnapshot({ source: 'live', snapshot: now }, now));
});
test('an API error cannot become a successful empty sync', async () => {
  await assert.rejects(readPocketResponse(new Response('{}', { status: 401 }), 'stats'), /HTTP 401/);
  for (const field of ['stats', 'podcasts', 'episodes']) {
    await assert.rejects(readPocketResponse(new Response('{}'), field), /invalid/);
  }
  await assert.rejects(readPocketResponse(new Response('{"timeListened":-1}'), 'stats'), /invalid/);
  assert.deepEqual(await readPocketResponse(new Response('{"episodes":[]}'), 'episodes'), { episodes: [] });
});
test('a resumed sync does not attribute months of activity to today', () => {
  assert.equal(canAttributeToToday('2026-06-08', '2026-09-05'), false);
  assert.equal(canAttributeToToday(null, '2026-09-05'), false);
  assert.equal(canAttributeToToday('2026-09-04', '2026-09-05'), true);
  assert.equal(canAttributeToToday('2026-09-05', '2026-09-05'), true);
});
