import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Advisories with no patched release that cannot affect this site. Each entry
// stops applying on its own: once a newer version of the package is installed,
// or after the expiry date, the advisory fails the audit again.
export const exceptions = [
  {
    url: 'https://github.com/advisories/GHSA-ch52-4w7c-c8xp',
    dependency: 'http-cache-semantics',
    maxVersion: '4.2.0',
    expires: '2026-12-31',
    reason:
      'max-stale lets a shared cache serve another user\'s response; Astro only caches remote images during the static build, which has no users. No patched release exists yet.',
  },
];

function compareVersions(left, right) {
  const parts = (version) => version.split('-')[0].split('.').map(Number);
  const [a, b] = [parts(left), parts(right)];
  for (let index = 0; index < 3; index += 1) {
    if ((a[index] ?? 0) !== (b[index] ?? 0)) return (a[index] ?? 0) - (b[index] ?? 0);
  }
  return 0;
}

export function installedVersions(lock, name) {
  return Object.entries(lock.packages ?? {})
    .filter(([path]) => path === `node_modules/${name}` || path.endsWith(`/node_modules/${name}`))
    .map(([, entry]) => entry.version);
}

function exceptionFor(advisory, { lock, today }) {
  return exceptions.find((exception) => {
    if (exception.url !== advisory.url || exception.dependency !== advisory.dependency) return false;
    if (today > exception.expires) return false;
    const versions = installedVersions(lock, exception.dependency);
    return versions.length > 0 && versions.every((version) => compareVersions(version, exception.maxVersion) <= 0);
  });
}

// Every advisory appears as an object in some package's `via`; string entries
// only point at another vulnerable package, so they need no separate check.
export function auditFindings(report, { lock, today }) {
  if (!report || report.error || typeof report.vulnerabilities !== 'object') {
    throw new Error(`npm audit did not return a report: ${report?.message ?? 'unexpected output'}`);
  }
  const advisories = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities)) {
    for (const via of vulnerability.via) {
      if (typeof via === 'object') advisories.set(`${via.url} ${via.dependency}`, via);
    }
  }
  const blocking = [];
  const excepted = [];
  for (const advisory of advisories.values()) {
    const exception = exceptionFor(advisory, { lock, today });
    if (exception) excepted.push({ advisory, exception });
    else blocking.push(advisory);
  }
  return { blocking, excepted };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = spawnSync('npm', ['audit', '--include=dev', '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    console.error(result.stderr);
    throw new Error('npm audit returned output that is not JSON');
  }
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const { blocking, excepted } = auditFindings(report, { lock, today });
  for (const { advisory, exception } of excepted) {
    console.log(`Excepted until ${exception.expires}: ${advisory.dependency} ${advisory.url}\n  ${exception.reason}`);
  }
  for (const advisory of blocking) {
    console.log(`${advisory.severity} ${advisory.dependency} ${advisory.range}: ${advisory.title}\n  ${advisory.url}`);
  }
  if (blocking.length) {
    console.log(`\n${blocking.length} advisory(ies) found. Run npm audit for fix suggestions.`);
    process.exit(1);
  }
  console.log(excepted.length ? 'No other advisories found.' : 'found 0 vulnerabilities');
}
