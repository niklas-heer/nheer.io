#!/usr/bin/env node
// Record repository statistics for the Projects section from local checkouts.
//
//   node scripts/sync-projects.mjs            # refresh every project in src/content/projects
//   node scripts/sync-projects.mjs owner/repo # refresh only the named projects (owner/name or slug)
//   node scripts/sync-projects.mjs --check    # verify every project has a snapshot entry
//
// Checkouts are read, never modified: the script only runs read-only git commands
// and counts lines with tokei in a temporary export of the default branch.
// A public project's checkout is <root>/<owner>/<name>; private projects, and
// public ones kept elsewhere, are mapped in the untracked .projects-local.json
// (see .projects-local.example.json and docs/projects.md).
// Options: --root <dir> (default ~/Projects/github.com, or PROJECTS_ROOT),
// --local <file> (default .projects-local.json), --content <dir> (default
// src/content/projects), --out <file> (default src/data/projects.json).
import { execFileSync, spawnSync } from 'node:child_process';
import { closeSync, existsSync, mkdirSync, mkdtempSync, openSync, readdirSync, readFileSync, readSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { snapshotKey } from '../src/utils/project-keys.mjs';
import { bucketWeeks, weekWindows } from '../src/utils/project-weeks.mjs';

// Prose and data formats are not source code; counting them would make a
// documentation-heavy repository look larger than its program.
const NOT_CODE = new Set([
  'AsciiDoc', 'CSV', 'JSON', 'Markdown', 'MDX', 'Org', 'Plain Text', 'ReStructuredText',
  'SVG', 'Text', 'TOML', 'XML', 'YAML', 'Jupyter Notebooks', 'Hex', 'Lockfile',
]);

// tokei's names, folded into the names GitHub's language bar uses.
const RENAME = {
  TSX: 'TypeScript', JSX: 'JavaScript', 'C Header': 'C', 'C++ Header': 'C++',
  BASH: 'Shell', Sh: 'Shell', Zsh: 'Shell', Justfile: 'Just', 'Vim script': 'Vim Script',
};

// Vendored, generated and build output, in tokei's gitignore-style syntax.
const EXCLUDES = [
  'vendor', 'vendored', 'third_party', 'third-party', 'node_modules', 'dist', 'build', 'target',
  'generated', '__generated__', 'Pods', '.yarn', '*.min.js', '*.min.css', '*.pb.go', '*_generated.*',
  '*.generated.*', '*.lock', 'package-lock.json', 'bun.lock', 'pnpm-lock.yaml',
];

function parseArgs(argv) {
  const options = {
    check: false,
    root: process.env.PROJECTS_ROOT || join(homedir(), 'Projects', 'github.com'),
    local: '.projects-local.json',
    content: 'src/content/projects',
    out: 'src/data/projects.json',
    only: [],
  };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--check') options.check = true;
    else if (arg === '--root' || arg === '--local' || arg === '--content' || arg === '--out') {
      const value = argv[++index];
      if (!value) throw new Error(`${arg} needs a value`);
      options[arg.slice(2)] = value;
    } else if (/^[\w.-]+(?:\/[\w.-]+)?$/.test(arg)) options.only.push(arg);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

/** Every project content file with its visibility, repository and snapshot key. */
export function readContentRepos(contentDir) {
  if (!existsSync(contentDir)) return [];
  return readdirSync(contentDir)
    .filter((file) => /\.mdx?$/.test(file))
    .sort()
    .map((file) => {
      const text = readFileSync(join(contentDir, file), 'utf8');
      const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const repo = frontmatter.match(/^repo:\s*["']?([\w.-]+\/[\w.-]+)["']?\s*(?:#.*)?$/m)?.[1];
      const visibility = /^visibility:\s*["']?private["']?\s*(?:#.*)?$/m.test(frontmatter) ? 'private' : 'public';
      const hideActivity = /^hideActivity:\s*true\s*(?:#.*)?$/m.test(frontmatter);
      const slug = file.replace(/\.mdx?$/, '');
      return { file, slug, visibility, repo, hideActivity, key: snapshotKey({ slug, visibility, repo }) };
    });
}

/**
 * The untracked map of checkouts that are not at <root>/<owner>/<name>:
 * { "checkouts": { "<slug or owner/name>": "<path>" } }. "~" is the home
 * directory; relative paths are relative to the map file. A missing file is an
 * empty map.
 */
export function readLocalCheckouts(path) {
  if (!existsSync(path)) return {};
  const checkouts = JSON.parse(readFileSync(path, 'utf8')).checkouts ?? {};
  return Object.fromEntries(Object.entries(checkouts).map(([name, dir]) => {
    const expanded = String(dir).replace(/^~(?=$|\/)/, homedir());
    return [name, resolve(dirname(resolve(path)), expanded)];
  }));
}

/** Where a project's checkout should be, or null for a private project nobody mapped. */
export function checkoutDir(entry, root, local) {
  if (local[entry.slug]) return local[entry.slug];
  if (entry.visibility === 'private' || !entry.repo) return null;
  return local[entry.repo] ?? join(root, ...entry.repo.split('/'));
}

function readSnapshot(path) {
  if (!existsSync(path)) return { repos: {} };
  const snapshot = JSON.parse(readFileSync(path, 'utf8'));
  return { repos: snapshot.repos ?? {} };
}

/** Problems that make the snapshot unusable for the current content files. */
export function checkSnapshot(entries, snapshot) {
  const problems = [];
  for (const { file, visibility, repo, key } of entries) {
    if (visibility === 'private' && repo) problems.push(`${file}: a private project must not name its repository; map its checkout in .projects-local.json`);
    else if (!key) problems.push(`${file}: no "repo:" in its frontmatter`);
    else if (!snapshot.repos[key]) problems.push(`${file}: no snapshot entry for ${key}`);
  }
  return problems;
}

function git(dir, args) {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 }).trim();
}

function tryGit(dir, args) {
  try { return git(dir, args); } catch { return ''; }
}

/** The newest of the default-branch candidates, so a feature branch checkout is not measured. */
function defaultRef(dir) {
  const candidates = [
    tryGit(dir, ['symbolic-ref', '--quiet', 'refs/remotes/origin/HEAD']),
    'refs/heads/main', 'refs/heads/master',
  ].filter(Boolean);
  let best = null;
  for (const ref of candidates) {
    const time = Number(tryGit(dir, ['log', '-1', '--format=%ct', ref]));
    if (time && (!best || time > best.time)) best = { ref, time };
  }
  return best?.ref ?? 'HEAD';
}

// Header markers that code generators write, as GitHub's linguist recognises them.
const GENERATED_MARKER = /code generated .*do not edit|do not edit by hand|do not edit this file|@generated|auto-?generated|generated by (?:the )?[\w.-]+ (?:compiler|generator|tool)/i;

/**
 * Delete files marked linguist-generated or linguist-vendored in .gitattributes,
 * or whose first lines say they were generated, from the exported tree.
 */
function removeGenerated(dir, ref, tree) {
  const files = git(dir, ['ls-tree', '-r', '-z', '--name-only', ref]).split('\0').filter(Boolean);
  const marked = new Set();
  const attributes = spawnSync('git', ['-C', dir, 'check-attr', `--source=${ref}`, '-z', '--stdin', 'linguist-generated', 'linguist-vendored'], {
    input: files.join('\0'), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024,
  });
  if (attributes.status === 0) {
    const fields = attributes.stdout.split('\0');
    for (let index = 0; index + 2 < fields.length; index += 3) {
      if (fields[index + 2] === 'set' || fields[index + 2] === 'true') marked.add(fields[index]);
    }
  }
  for (const file of files) {
    const path = join(tree, file);
    if (!marked.has(file)) {
      let head = '';
      try {
        const handle = openSync(path, 'r');
        const buffer = Buffer.alloc(1024);
        const read = readSync(handle, buffer, 0, buffer.length, 0);
        closeSync(handle);
        head = buffer.subarray(0, read).toString('utf8').split('\n').slice(0, 6).join('\n');
      } catch {
        continue; // directories (submodules), symlinks and unreadable entries
      }
      if (!GENERATED_MARKER.test(head)) continue;
    }
    rmSync(path, { force: true });
  }
}

function countLines(dir, ref) {
  const work = mkdtempSync(join(tmpdir(), 'sync-projects-'));
  try {
    const archive = join(work, 'tree.tar');
    const tree = join(work, 'tree');
    git(dir, ['archive', '--format=tar', '-o', archive, ref]);
    mkdirSync(tree);
    execFileSync('tar', ['-xf', archive, '-C', tree]);
    removeGenerated(dir, ref, tree);
    const args = ['--output', 'json', ...EXCLUDES.flatMap((pattern) => ['--exclude', pattern]), tree];
    const result = spawnSync(process.env.TOKEI || 'tokei', args, { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
    if (result.error) throw new Error(`tokei is not available (${result.error.message}); install it with "brew install tokei"`);
    if (result.status !== 0) throw new Error(`tokei failed: ${result.stderr.trim()}`);
    const languages = new Map();
    for (const [name, stats] of Object.entries(JSON.parse(result.stdout))) {
      if (name === 'Total' || NOT_CODE.has(name) || !stats.code) continue;
      const display = RENAME[name] ?? name;
      const entry = languages.get(display) ?? { name: display, code: 0, files: 0 };
      entry.code += stats.code;
      entry.files += stats.reports?.length ?? 0;
      languages.set(display, entry);
    }
    const list = [...languages.values()].sort((a, b) => b.code - a.code || a.name.localeCompare(b.name));
    return {
      linesOfCode: list.reduce((sum, language) => sum + language.code, 0),
      files: list.reduce((sum, language) => sum + language.files, 0),
      languages: list,
    };
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

function latestTag(dir, ref) {
  const lines = tryGit(dir, [
    'for-each-ref', '--merged', ref, '--sort=-creatordate', '--count=50',
    '--format=%(refname:short)%09%(creatordate:iso-strict)', 'refs/tags',
  ]).split('\n').filter(Boolean);
  for (const line of lines) {
    const [name, date] = line.split('\t');
    if (/^v?\d+(\.\d+)*/.test(name)) return { name, date: new Date(date).toISOString() };
  }
  return null;
}

/**
 * Statistics for one checkout. A shallow clone lacks the older history, so its
 * commit count, first commit and contributors are left out, and the weeks
 * before its oldest available commit are recorded as unknown (null).
 */
export function snapshotRepo(dir, now = new Date()) {
  return measureRepo(dir, now);
}

/**
 * Without the figures that date the work, for a project with hideActivity: the
 * snapshot is committed to a public repository, so it must not carry them either.
 */
export function withoutDates(entry) {
  const { firstCommit: _first, lastCommit: _last, weekly: _weekly, latestTag, ...rest } = entry;
  return { ...rest, latestTag: latestTag ? { name: latestTag.name } : null, datesHidden: true };
}

function measureRepo(dir, now) {
  const ref = defaultRef(dir);
  const shallow = tryGit(dir, ['rev-parse', '--is-shallow-repository']) === 'true';
  const windows = weekWindows(now);
  const since = windows[0].since.toISOString();
  const recent = git(dir, ['log', ref, `--since=${since}`, '--format=%ct'])
    .split('\n').filter(Boolean).map((line) => Number(line) * 1000);
  const weekly = bucketWeeks(recent, now);
  const history = {};
  if (shallow) {
    // The week holding the oldest available commit may also hold missing ones.
    const oldest = Math.min(...git(dir, ['log', ref, '--format=%ct']).split('\n').filter(Boolean).map((line) => Number(line) * 1000));
    windows.forEach((window, index) => { if (window.since.getTime() <= oldest) weekly[index] = null; });
  } else {
    const roots = git(dir, ['rev-list', '--max-parents=0', ref]).split('\n').filter(Boolean);
    const firstCommit = Math.min(...roots.map((sha) => Number(git(dir, ['log', '-1', '--format=%at', sha])) * 1000));
    const contributors = git(dir, ['shortlog', '-sn', '--no-merges', ref])
      .split('\n')
      .map((line) => line.replace(/^\s*\d+\s+/, '').trim())
      .filter((name) => name && !/\[bot\]$|^dependabot|^renovate|^github-actions/i.test(name));
    history.commits = Number(git(dir, ['rev-list', '--count', ref]));
    history.firstCommit = new Date(firstCommit).toISOString();
    history.contributors = contributors.length;
  }
  return {
    syncedAt: now.toISOString(),
    head: git(dir, ['rev-parse', '--short=10', ref]),
    ...(shallow ? { shallow: true } : {}),
    commits: history.commits,
    firstCommit: history.firstCommit,
    lastCommit: new Date(Number(git(dir, ['log', '-1', '--format=%ct', ref])) * 1000).toISOString(),
    contributors: history.contributors,
    ...countLines(dir, ref),
    latestTag: latestTag(dir, ref),
    weekly,
  };
}

function sortObject(object) {
  return Object.fromEntries(Object.keys(object).sort((a, b) => a.localeCompare(b)).map((key) => [key, object[key]]));
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const entries = readContentRepos(options.content);
  const local = readLocalCheckouts(options.local);
  const out = resolve(options.out);
  const snapshot = readSnapshot(out);

  if (options.check) {
    const problems = checkSnapshot(entries, snapshot);
    if (problems.length) {
      console.error(`Project snapshot is incomplete:\n  ${problems.join('\n  ')}\nRun "mise run sync:projects" and commit ${options.out}.`);
      process.exitCode = 1;
    } else {
      console.log(`Project snapshot covers all ${entries.length} project(s).`);
    }
    return;
  }

  const problems = entries.filter((entry) => !entry.key || (entry.visibility === 'private' && entry.repo));
  if (problems.length) throw new Error(checkSnapshot(problems, { repos: {} }).join('\n'));
  const wanted = new Set(entries.map((entry) => entry.key));
  for (const name of options.only) {
    if (!entries.some((entry) => [entry.slug, entry.repo, entry.key].includes(name))) {
      throw new Error(`${name} is not a project in ${options.content}`);
    }
  }
  const targets = options.only.length
    ? entries.filter((entry) => options.only.some((name) => [entry.slug, entry.repo, entry.key].includes(name)))
    : entries;
  const repos = { ...snapshot.repos };
  // A full run drops entries for projects that no longer exist.
  if (!options.only.length) for (const key of Object.keys(repos)) if (!wanted.has(key)) delete repos[key];

  const failures = [];
  for (const entry of targets) {
    const { key } = entry;
    const kept = repos[key] ? 'keeping its previous entry' : 'it has no entry yet';
    const dir = checkoutDir(entry, options.root, local);
    if (!dir) {
      console.warn(`skip ${key}: private, and ${options.local} names no checkout for "${entry.slug}" (${kept}).`);
      if (!repos[key]) failures.push(key);
      continue;
    }
    if (!existsSync(join(dir, '.git'))) {
      const hint = entry.visibility === 'public' ? ` Clone it with "repot clone https://github.com/${entry.repo}".` : '';
      console.warn(`skip ${key}: no checkout at ${dir} (${kept}).${hint}`);
      if (!repos[key]) failures.push(key);
      continue;
    }
    try {
      const measured = snapshotRepo(dir);
      repos[key] = entry.hideActivity ? withoutDates(measured) : measured;
      const { commits, linesOfCode, languages, shallow } = repos[key];
      const size = `${linesOfCode} lines of ${languages[0]?.name ?? 'code'}${languages.length > 1 ? ` and ${languages.length - 1} more` : ''}`;
      console.log(`ok   ${key}: ${shallow ? 'shallow clone, no commit count' : `${commits} commits`}, ${size}`);
    } catch (error) {
      console.warn(`fail ${key}: ${error.message}`);
      if (!repos[key]) failures.push(key);
    }
  }

  // Keep the weekly counts on one line so diffs stay readable.
  const json = JSON.stringify({ repos: sortObject(repos) }, null, 2)
    .replace(/\[\s*((?:-?\d+|null)(?:,\s*(?:-?\d+|null))*)\s*\]/g, (_, list) => `[${list.split(/,\s*/).join(', ')}]`);
  writeFileSync(out, `${json}\n`);
  console.log(`Wrote ${options.out} (${Object.keys(repos).length} projects).`);
  if (failures.length) {
    console.error(`No statistics for: ${failures.join(', ')}. Their pages will omit snapshot figures; "--check" fails until they are synced.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
