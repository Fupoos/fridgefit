import { defineConfig } from '@playwright/test'

// Captures phone-sized screenshots of every screen (used in the README and the pitch deck).
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/fridgefit/',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    // Use the locally installed Chrome; set PW_CHANNEL=chromium to use Playwright's own build.
    channel: process.env.PW_CHANNEL ?? 'chrome',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/fridgefit/',
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
