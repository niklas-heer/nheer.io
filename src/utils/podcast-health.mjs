export function snapshotStatus(value, now = new Date()) {
  if (!value) return 'missing';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'missing';
  const age = now.getTime() - time;
  if (age < -24 * 3600_000) return 'invalid';
  return age > 48 * 3600_000 ? 'stale' : 'fresh';
}

export function assertLiveSnapshot(report, now = new Date()) {
  if (report.source !== 'live' || report.draftPreview) {
    throw new Error('Publishing requires a live-data build without draft previews');
  }
  if (snapshotStatus(report.snapshot, now) !== 'fresh') {
    throw new Error('Podcast snapshot is missing, invalid, or older than 48 hours; publishing stopped');
  }
}
