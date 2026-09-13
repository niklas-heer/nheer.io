import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import pg from 'pg';

const name = `nheer-sync-test-${process.pid}`;
let client;
const docker = (...args) => execFileSync('docker', args, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
try {
  docker('run', '-d', '--rm', '--name', name, '-e', 'POSTGRES_PASSWORD=test-only', '-e', 'POSTGRES_DB=podcast_test', '-p', '127.0.0.1::5432', 'postgres:18.6');
  const port = docker('port', name, '5432/tcp').split(':').at(-1);
  let ready = false;
  for (let i = 0; i < 60; i++) {
    // The bootstrap server accepts socket connections before TCP is ready.
    if (spawnSync('docker', ['exec', name, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres'], { stdio: 'ignore' }).status === 0) {
      ready = true;
      break;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Postgres did not become ready for TCP connections');
  const connectionString = `postgresql://postgres:test-only@127.0.0.1:${port}/podcast_test`;
  client = new pg.Client({ connectionString });
  await client.connect();
  await client.query(`
    CREATE TABLE listening_stats (date date PRIMARY KEY, time_listened bigint, time_silence_removal bigint, time_skipping bigint, time_intro_skipping bigint, time_variable_speed bigint);
    CREATE TABLE podcasts (uuid text PRIMARY KEY, title text, author text, description text, image_url text, url text, slug text, is_subscribed boolean, category text, updated_at timestamp);
    CREATE TABLE episodes (uuid text PRIMARY KEY, podcast_uuid text REFERENCES podcasts(uuid), title text, slug text, duration int, played_up_to int, published_at timestamp, completed boolean, starred boolean, completed_at timestamp, last_played_at timestamp);
    CREATE TABLE episode_history (episode_uuid text REFERENCES episodes(uuid), date date, played_up_to int, delta_seconds int, completed boolean, synced_at timestamp, PRIMARY KEY (episode_uuid, date));
    CREATE TABLE daily_stats (date date PRIMARY KEY, time_listened int, episodes_started int, episodes_completed int, synced_at timestamp);
    INSERT INTO listening_stats (date,time_listened) VALUES (CURRENT_DATE - 1,3600);
  `);
  function sync(scenario) {
    const env = { ...process.env, DATABASE_URL: connectionString, POCKETCASTS_EMAIL: 'test@example.invalid', POCKETCASTS_PASSWORD: 'test-only', TEST_SCENARIO: scenario };
    delete env.OPENROUTER_API_KEY;
    return spawnSync('bun', ['--preload', './scripts/tests/pocketcasts-api.fixture.ts', 'scripts/sync-pocketcasts.ts'], { env, encoding: 'utf8' });
  }
  const failed = sync('failure');
  assert.notEqual(failed.status, 0);
  assert.equal((await client.query('SELECT count(*) FROM podcasts')).rows[0].count, '0');
  assert.equal((await client.query('SELECT count(*) FROM listening_stats')).rows[0].count, '1');
  console.log('PASS: failed history request rolls back preceding stats and podcast writes');
  for (let i = 0; i < 2; i++) {
    const result = sync('success');
    assert.equal(result.status, 0, result.stderr);
  }
  assert.equal((await client.query('SELECT time_listened FROM daily_stats')).rows[0].time_listened, 600);
  assert.equal((await client.query('SELECT delta_seconds FROM episode_history')).rows[0].delta_seconds, 600);
  console.log('PASS: repeated successful sync does not double-count listening');
  await client.query('TRUNCATE episode_history,daily_stats,episodes,podcasts,listening_stats; INSERT INTO listening_stats (date,time_listened) VALUES (CURRENT_DATE - 90,3600)');
  const resumed = sync('success');
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal((await client.query('SELECT count(*) FROM daily_stats')).rows[0].count, '0');
  assert.equal((await client.query('SELECT count(*) FROM episode_history')).rows[0].count, '0');
  assert.equal((await client.query('SELECT time_listened FROM listening_stats ORDER BY date DESC LIMIT 1')).rows[0].time_listened, '4800');
  console.log('PASS: recovery updates totals without inventing daily history');
} finally {
  if (client) await client.end();
  docker('rm', '-f', name);
}
