import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4321',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'site', testMatch: 'site.spec.ts' },
    { name: 'articles', testMatch: 'articles.spec.ts' },
  ],
  webServer: [{
    // The API stays in the foreground so Playwright owns cleanup, including in agent environments.
    command: `node --input-type=module -e "import { preview } from 'astro'; await preview({ server: { host: '127.0.0.1', port: 4321 } });"`,
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
  }],
});
