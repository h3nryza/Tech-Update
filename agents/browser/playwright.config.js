const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: '../reports/browser-report.json' }]],
  use: {
    baseURL: 'http://localhost:3939',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx serve ../../ -l 3939 -s --no-clipboard',
    port: 3939,
    timeout: 10000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'mobile-small',
      use: { viewport: { width: 320, height: 568 } },
    },
    {
      name: 'mobile-standard',
      use: { viewport: { width: 375, height: 812 } },
    },
    {
      name: 'tablet',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'laptop',
      use: { viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'desktop',
      use: { viewport: { width: 1920, height: 1080 } },
    },
  ],
});
