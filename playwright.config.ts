import { defineConfig } from '@playwright/test';

const e2eRuntimeRoot = process.env.E2E_RUNTIME_ROOT
  ?? `D:/Temp/zuoyou-dndweb-e2e-runs/run-${Date.now()}-${process.pid}`;
process.env.E2E_RUNTIME_ROOT = e2eRuntimeRoot;

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
    baseURL: 'http://127.0.0.1:5174',
    browserName: 'chromium',
    channel: 'msedge',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'corepack pnpm --filter @guild/web dev --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_PATH: `${e2eRuntimeRoot}/guild.sqlite`,
      UPLOAD_ROOT: `${e2eRuntimeRoot}/uploads`,
      API_PORT: '3101',
      VITE_API_PROXY_TARGET: 'http://127.0.0.1:3101',
      TMP: 'D:/Temp',
      TEMP: 'D:/Temp',
    },
  },
});
