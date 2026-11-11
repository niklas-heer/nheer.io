import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const stageScript = fileURLToPath(new URL('../site-stage.mjs', import.meta.url));

// Runs a stage with a stand-in npm that records the audit scope it was given.
async function auditScopeFor(stage, t, extraEnv = {}) {
  const bin = await mkdtemp(join(tmpdir(), 'nheer-stage-'));
  t.after(() => rm(bin, { recursive: true, force: true }));
  const record = join(bin, 'scope');
  await writeFile(join(bin, 'npm'), `#!/bin/sh\nprintf '%s' "\${SITE_AUDIT_SCOPE:-unset}" > '${record}'\n`);
  await chmod(join(bin, 'npm'), 0o755);
  const result = spawnSync(process.execPath, [stageScript, stage], {
    encoding: 'utf8',
    env: { ...process.env, ...extraEnv, PATH: `${bin}:${process.env.PATH}` },
  });
  assert.equal(result.status, 0, result.stderr);
  return readFile(record, 'utf8');
}

test('the publishing test stage audits with the publish policy, whatever the caller set', async (t) => {
  assert.equal(await auditScopeFor('test', t, { SITE_AUDIT_SCOPE: 'strict' }), 'publish');
});

test('other stages keep the strict default audit', async (t) => {
  assert.equal(await auditScopeFor('build-check', t, { SITE_AUDIT_SCOPE: '' }), 'unset');
});
