// Shared by the build (src/utils/projects.ts) and scripts/sync-projects.mjs, so
// live GitHub activity and the committed snapshot bucket commits the same way.

export const WEEKS = 52;
const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStart(date) {
  const day = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - offset * DAY);
}

/**
 * The last 52 calendar weeks (Monday to Monday, UTC), oldest first. The final
 * window is the current, still running week.
 */
export function weekWindows(now = new Date()) {
  const current = weekStart(now).getTime();
  return Array.from({ length: WEEKS }, (_, index) => {
    const since = new Date(current - (WEEKS - 1 - index) * WEEK);
    return { since, until: new Date(since.getTime() + WEEK) };
  });
}

/** Count commit timestamps (milliseconds) into the windows from weekWindows(). */
export function bucketWeeks(timestamps, now = new Date()) {
  const windows = weekWindows(now);
  const first = windows[0].since.getTime();
  const counts = new Array(WEEKS).fill(0);
  for (const time of timestamps) {
    const index = Math.floor((time - first) / WEEK);
    if (index >= 0 && index < WEEKS) counts[index] += 1;
  }
  return counts;
}
