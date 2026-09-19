import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 4321);
const baseURL = `http://127.0.0.1:${port}`;
const draftPort = port + 1;
const draftURL = `http://127.0.0.1:${draftPort}`;

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'site', testMatch: 'site.spec.ts' },
    { name: 'articles', testMatch: 'articles.spec.ts' },
    { name: 'draft-articles', testMatch: 'hub-article.spec.ts', use: { baseURL: draftURL } },
  ],
  webServer: [{
    // Keep the server in the foreground so Playwright owns its cleanup.
    command: `node --input-type=module -e "import { preview } from 'astro'; await preview({ server: { host: '127.0.0.1', port: ${port} } });"`,
    url: baseURL,
    reuseExistingServer: false,
  }, {
    command: `node --input-type=module -e "import { dev } from 'astro'; await dev({ server: { host: '127.0.0.1', port: ${draftPort} } });"`,
    env: { PREVIEW_DRAFTS: 'true', SITE_TEST_DATA: 'true' },
    url: `${draftURL}/drafts/`,
    reuseExistingServer: false,
  }],
});
