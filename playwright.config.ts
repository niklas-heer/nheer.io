import { defineConfig } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 4321);
const baseURL = `http://127.0.0.1:${port}`;

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
    { name: 'hub-article', testMatch: 'hub-article.spec.ts' },
    { name: 'article-components', testMatch: 'article-components.spec.ts' },
    { name: 'inky', testMatch: 'inky.spec.ts' },
  ],
  webServer: [{
    // Keep the server in the foreground so Playwright owns its cleanup.
    command: `node --input-type=module -e "import { preview } from 'astro'; await preview({ server: { host: '127.0.0.1', port: ${port} } });"`,
    url: baseURL,
    reuseExistingServer: false,
  }],
});
