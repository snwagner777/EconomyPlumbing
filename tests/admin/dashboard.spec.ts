import { test, expect } from '@playwright/test';
import { loginToAdmin } from '../helpers/auth';

test.describe('Admin Dashboard', () => {
  test('should display dashboard after login', async ({ page }) => {
    await loginToAdmin(page);
    
    // Should see dashboard content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should have navigation sidebar', async ({ page }) => {
    await loginToAdmin(page);
    
    // Should have sidebar navigation
    const nav = page.locator('nav, aside, [role="navigation"]').first();
    await expect(nav).toBeVisible();
  });

  test('should be able to navigate to different sections', async ({ page }) => {
    await loginToAdmin(page);
    
    // Look for navigation links
    const navLinks = page.locator('a[href^="/admin/"]');
    const count = await navLinks.count();
    
    // Should have multiple admin sections
    expect(count).toBeGreaterThan(0);
  });
});
