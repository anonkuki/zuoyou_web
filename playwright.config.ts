import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  outputDir: 'D:/Temp/zuoyou-dndweb-playwright',
  reporter: [['list'], ['html', { outputFolder: 'artifacts/qa/playwright-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    channel: 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'corepack pnpm dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_PATH: 'D:/Temp/zuoyou-dndweb-e2e-runtime/guild.sqlite',
      UPLOAD_ROOT: 'D:/Temp/zuoyou-dndweb-e2e-runtime/uploads',
      TMP: 'D:/Temp',
      TEMP: 'D:/Temp',
    },
  },
});
