import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Export only the two published PDFs from a committed CV revision.
// No supporting documents or other repository contents enter the site.
const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(process.argv[2] || join(site, '../cv'));
const revision = process.argv[3] || 'HEAD';
const git = (...args) => execFileSync('git', ['-C', source, ...args], { maxBuffer: 16 * 1024 * 1024 });
const commit = git('rev-parse', '--verify', `${revision}^{commit}`).toString().trim();
const sourceDate = git('show', '-s', '--format=%cI', commit).toString().trim();
const temp = mkdtempSync(join(tmpdir(), 'nheer-cv-'));
const files = [
  ['output/pdf/niklas-heer-cv-compact.pdf', 'cv.pdf'],
  ['output/pdf/niklas-heer-cv-ats.pdf', 'cv-ats.pdf'],
];

try {
  const artifacts = {};
  for (const [input, output] of files) {
    const bytes = git('show', `${commit}:${input}`);
    const path = join(temp, output);
    writeFileSync(path, bytes);
    const info = execFileSync('pdfinfo', [path], { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C' } });
    if (!/^Pages:\s+1\s*$/m.test(info) || !/^Page size:.*\(A4\)/m.test(info)) {
      throw new Error(`${input} must be a single A4 page. Run mise run check-all in the CV repo and commit the PDFs first.`);
    }
    artifacts[output] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  }

  // Render the exact PDF being shipped, so the preview cannot drift from it.
  execFileSync('pdftoppm', [
    '-f', '1', '-singlefile', '-scale-to-x', '1600', '-scale-to-y', '-1',
    '-jpeg', '-jpegopt', 'quality=90', join(temp, 'cv.pdf'), join(temp, 'cv-preview'),
  ]);
  const preview = readFileSync(join(temp, 'cv-preview.jpg'));
  artifacts['cv-preview.jpg'] = { bytes: preview.length, sha256: createHash('sha256').update(preview).digest('hex') };

  // Complete validation and rendering before changing the website snapshot.
  for (const filename of Object.keys(artifacts)) copyFileSync(join(temp, filename), join(site, 'public', filename));
  mkdirSync(join(site, 'src/data'), { recursive: true });
  writeFileSync(join(site, 'src/data/cv.json'), `${JSON.stringify({ sourceCommit: commit, sourceDate, artifacts }, null, 2)}\n`);
  console.log(`Synced CV PDFs and preview from ${commit.slice(0, 12)}.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
