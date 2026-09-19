import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Package exactly the static output checked by the existing browser tests.
export async function packageVercel({ root = process.cwd() } = {}) {
  const dist = join(root, 'dist');
  const output = join(root, '.vercel/output');
  const files = await readdir(dist, { recursive: true });
  const pages = files.filter(file => file.endsWith('.html'));
  const pathFor = file => new URL('/' + file.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '').replace(/\/$/, ''), 'https://nheer.com').pathname;
  const paths = pages.map(pathFor).filter(path => path !== '/404' && !path.startsWith('/drafts'));
  const routes = [
    { src: '^/(.*)$', headers: { 'X-Frame-Options': 'DENY', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin' }, continue: true },
    { src: '^/gh/(sc|speed-comparison)/?$', status: 301, headers: { Location: 'https://github.com/niklas-heer/speed-comparison' } },
    { src: '^/api/views$', dest: '/api/views' },
    ...pages.filter(file => pathFor(file) !== '/404').map(file => ({
      src: '^' + (pathFor(file) === '/' ? '/' : pathFor(file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/?') + '$',
      dest: '/' + file,
    })),
    { handle: 'filesystem' },
    { src: '^/.*$', dest: '/404.html', status: 404 },
  ];
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(dist, join(output, 'static'), { recursive: true });
  await writeFile(join(output, 'config.json'), JSON.stringify({ version: 3, routes }, null, 2));
  const fn = join(output, 'functions/api/views.func');
  await mkdir(fn, { recursive: true });
  await cp(join(root, 'server/page-views.mjs'), join(fn, 'page-views.mjs'));
  await writeFile(join(fn, 'index.mjs'), `import { createPageViewsHandler } from './page-views.mjs';\nexport default createPageViewsHandler({ paths: ${JSON.stringify(paths)} });\n`);
  await writeFile(join(fn, '.vc-config.json'), JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs', maxDuration: 10 }));
  // Keep a copy of the health report in the package; deployment validates it.
  return JSON.parse(await readFile(join(dist, 'build-health.json'), 'utf8'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await packageVercel();
