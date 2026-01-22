import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file BEFORE exporting config
config({ path: path.resolve(process.cwd(), '.env') });

export default defineConfig({
  testDir: './tests/e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail build on CI if test.only is committed
  forbidOnly: !!process.env.CI,
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 0,
  
  // Limit workers in CI for stability
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['github']] : []),
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:3000',
    
    // Capture trace on first retry
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on first retry
    video: 'retain-on-failure',
    
    // Timeout for actions
    actionTimeout: 10000,
    
    // Timeout for navigations
    navigationTimeout: 15000,
  },
  
  // Global timeout for each test
  timeout: 60000,
  
  // Expect timeout
  expect: {
    timeout: 5000,
  },
  
  // Browser projects
  projects: [
    // Setup project - runs before all tests
    {
      name: 'setup',
      testMatch: /global\.setup\.spec\.ts/,
      teardown: 'cleanup',
    },
    // Cleanup project - runs after all tests
    {
      name: 'cleanup',
      testMatch: /global\.teardown\.spec\.ts/,
    },
    // Main test project
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome']
      },
      dependencies: ['setup'],
    },
    
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // Mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
  
  // Development server configuration
  // Note: Start dev server manually with `npm run dev` in a separate terminal
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  //   stdout: 'ignore',
  //   stderr: 'pipe',
  // },
});