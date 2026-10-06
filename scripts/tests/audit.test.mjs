import assert from 'node:assert/strict';
import test from 'node:test';
import { auditFindings } from '../audit.mjs';

const cacheAdvisory = {
  url: 'https://github.com/advisories/GHSA-ch52-4w7c-c8xp',
  dependency: 'http-cache-semantics',
  severity: 'high',
  range: '<=4.2.0',
  title: 'http-cache-semantics max-stale handling can disclose cross-user cached responses',
};
const otherAdvisory = {
  url: 'https://github.com/advisories/GHSA-p98j-92pf-mc4p',
  dependency: 'dompurify',
  severity: 'low',
  range: '3.4.13 - 3.4.15',
  title: 'DOMPurify IN_PLACE hook leaves event handlers armed',
};
const report = (...advisories) => ({
  vulnerabilities: {
    astro: { via: ['http-cache-semantics'] },
    ...Object.fromEntries(advisories.map((advisory) => [advisory.dependency, { via: [advisory] }])),
  },
});
const lock = (version) => ({ packages: { '': {}, 'node_modules/http-cache-semantics': { version } } });
// The real exception for this advisory was removed once 4.3.0 fixed it; it
// remains the fixture for how an exception behaves.
const cacheException = {
  url: cacheAdvisory.url,
  dependency: 'http-cache-semantics',
  maxVersion: '4.2.0',
  expires: '2026-12-31',
  reason: 'test fixture',
};
const audit = (report, version, today) => auditFindings(report, { lock: lock(version), today, exceptions: [cacheException] });

test('the http-cache-semantics advisory is excepted while 4.2.0 is installed and before expiry', () => {
  const { blocking, excepted } = audit(report(cacheAdvisory), '4.2.0', '2026-10-04');
  assert.deepEqual(blocking, []);
  assert.equal(excepted.length, 1);
});

test('the exception ends after its expiry date', () => {
  const { blocking } = audit(report(cacheAdvisory), '4.2.0', '2027-01-01');
  assert.deepEqual(blocking, [cacheAdvisory]);
});

test('the exception ends once a newer http-cache-semantics is installed', () => {
  const { blocking } = audit(report(cacheAdvisory), '4.2.1', '2026-10-04');
  assert.deepEqual(blocking, [cacheAdvisory]);
});

test('every other advisory still blocks, whatever its severity', () => {
  const { blocking } = audit(report(cacheAdvisory, otherAdvisory), '4.2.0', '2026-10-04');
  assert.deepEqual(blocking, [otherAdvisory]);
});

test('the shipped exception list no longer excepts the http-cache-semantics advisory', () => {
  const { blocking } = auditFindings(report(cacheAdvisory), { lock: lock('4.2.0'), today: '2026-10-04' });
  assert.deepEqual(blocking, [cacheAdvisory]);
});

test('an npm audit error never passes as a clean report', () => {
  assert.throws(
    () => auditFindings({ message: 'request failed', error: { summary: '' } }, { lock: lock('4.2.0'), today: '2026-10-04' }),
    /did not return a report: request failed/,
  );
});
