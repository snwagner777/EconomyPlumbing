import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'child_process';

// Try to find system chromium
let chromiumPath: string | undefined;
try {
  chromiumPath = execSync('which chromium', { encoding: 'utf-8' }).trim();
} catch (e) {
  // Chromium not found in system
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: chromiumPath ? {
      executablePath: chromiumPath,
    } : undefined,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
