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
    { name: 'articles', testMatch: 'articles.spec.ts', use: { baseURL: 'http://127.0.0.1:4324' } },
  ],
  webServer: [{
    command: 'npm run preview -- --host 127.0.0.1 --port 4321',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
  }, {
    command: 'npm run preview:articles -- --port 4324',
    url: 'http://127.0.0.1:4324/drafts/',
    reuseExistingServer: false,
  }],
});
