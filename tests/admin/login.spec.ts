import { test, expect } from '@playwright/test';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../helpers/auth';

test.describe('Admin Login', () => {
  test('should display admin login page', async ({ page }) => {
    await page.goto('/admin/login');
    
    // Check for login form
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');
    
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Try wrong credentials
    await usernameInput.fill('wronguser');
    await passwordInput.fill('wrongpass');
    await submitButton.click();
    
    // Should show error or stay on login page
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin/login');
  });

  test('should accept valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/admin/login');
    
    const usernameInput = page.locator('input[name="username"], input[type="text"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Login with correct credentials
    await usernameInput.fill(ADMIN_USERNAME);
    await passwordInput.fill(ADMIN_PASSWORD);
    await submitButton.click();
    
    // Should redirect to admin dashboard
    await page.waitForURL('**/admin/**', { timeout: 10000 });
    
    // Verify we're in admin area (not on login page)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
    expect(currentUrl).toContain('/admin');
  });
});
