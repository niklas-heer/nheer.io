import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Advisories with no patched release that cannot affect this site. Each entry
// stops applying on its own: once a newer version of the package is installed,
// or after the expiry date, the advisory fails the audit again.
export const exceptions = [];

// The GitHub check audits everything and fails on any advisory, so a new one
// is noticed and fixed in a pull request. The publishing job audits only what
// the build runs in production and fails only on high or critical advisories:
// a newly published low-severity advisory must not stop the site from updating.
export const policies = {
  strict: { args: ['--include=dev'], blocks: () => true },
  publish: { args: ['--omit=dev'], blocks: (advisory) => ['high', 'critical'].includes(advisory.severity) },
};

export function auditPolicy(scope = 'strict') {
  const policy = policies[scope];
  if (!policy) throw new Error(`Unknown audit scope: ${scope}`);
  return policy;
}

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

function exceptionFor(advisory, { lock, today, allowed }) {
  return allowed.find((exception) => {
    if (exception.url !== advisory.url || exception.dependency !== advisory.dependency) return false;
    if (today > exception.expires) return false;
    const versions = installedVersions(lock, exception.dependency);
    return versions.length > 0 && versions.every((version) => compareVersions(version, exception.maxVersion) <= 0);
  });
}

// Every advisory appears as an object in some package's `via`; string entries
// only point at another vulnerable package, so they need no separate check.
export function auditFindings(report, { lock, today, exceptions: allowed = exceptions, blocks = () => true }) {
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
  const reported = [];
  for (const advisory of advisories.values()) {
    const exception = exceptionFor(advisory, { lock, today, allowed });
    if (exception) excepted.push({ advisory, exception });
    else if (blocks(advisory)) blocking.push(advisory);
    else reported.push(advisory);
  }
  return { blocking, excepted, reported };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const scope = process.env.SITE_AUDIT_SCOPE || 'strict';
  const policy = auditPolicy(scope);
  const result = spawnSync('npm', ['audit', ...policy.args, '--json'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    console.error(result.stderr);
    throw new Error('npm audit returned output that is not JSON');
  }
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const { blocking, excepted, reported } = auditFindings(report, { lock, today, blocks: policy.blocks });
  for (const { advisory, exception } of excepted) {
    console.log(`Excepted until ${exception.expires}: ${advisory.dependency} ${advisory.url}\n  ${exception.reason}`);
  }
  for (const advisory of reported) {
    console.log(`Not blocking in the ${scope} audit: ${advisory.severity} ${advisory.dependency} ${advisory.url}`);
  }
  for (const advisory of blocking) {
    console.log(`${advisory.severity} ${advisory.dependency} ${advisory.range}: ${advisory.title}\n  ${advisory.url}`);
  }
  if (blocking.length) {
    console.log(`\n${blocking.length} advisory(ies) found. Run npm audit for fix suggestions.`);
    process.exit(1);
  }
  console.log(excepted.length || reported.length ? 'No blocking advisories found.' : 'found 0 vulnerabilities');
}
