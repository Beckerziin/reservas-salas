'use strict';

const { defineConfig, devices } = require('@playwright/test');

/**
 * E2E (Playwright) contra a aplicacao real: backend Express (memoria + seed)
 * + frontend React/Vite servido em dev, conversando via proxy /api.
 * workers=1: os specs compartilham o MESMO processo de backend (estado em
 * memoria), entao cada spec usa um dia distinto para nao conflitar (RN02)
 * com os outros - rodar em serie evita qualquer corrida entre eles.
 */
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : [
        {
          command: 'node src/server.js',
          port: 3000,
          env: { DATA_SOURCE: 'memory', PORT: '3000', SEED_DEV: 'true' },
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
        {
          command: 'npm run dev -- --port 5173 --strictPort',
          cwd: './frontend',
          port: 5173,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
        },
      ],
});
