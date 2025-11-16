import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check for main heading
    await expect(page.locator('h1').first()).toBeVisible();
    
    // Check for phone number (should be displayed - use first occurrence)
    await expect(page.locator('text=/\\(512\\)/').first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check header navigation links exist
    await expect(page.locator('[data-testid*="link-"]').first()).toBeVisible();
  });

  test('should display services section', async ({ page }) => {
    await page.goto('/');
    
    // Services should be visible on homepage
    const servicesSection = page.locator('text=/services|plumbing/i').first();
    await expect(servicesSection).toBeVisible();
  });

  test('should have call-to-action buttons', async ({ page }) => {
    await page.goto('/');
    
    // Look for CTA buttons (schedule, contact, etc.)
    const ctaButtons = page.locator('button, a[href*="contact"], a[href*="schedule"]');
    await expect(ctaButtons.first()).toBeVisible();
  });
});
