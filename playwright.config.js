const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:8766', headless: true },
  webServer: { command: 'node tests/browser/server.js', url: 'http://127.0.0.1:8766', reuseExistingServer: false },
});
