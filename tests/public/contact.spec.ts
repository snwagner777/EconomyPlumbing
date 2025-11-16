import { test, expect } from '@playwright/test';
import { fillContactForm } from '../helpers/navigation';

test.describe('Contact Form', () => {
  test('should display contact page', async ({ page }) => {
    await page.goto('/contact');
    
    // Check page loads
    await expect(page.locator('h1, h2').filter({ hasText: /contact/i }).first()).toBeVisible();
  });

  test('should have contact form fields', async ({ page }) => {
    await page.goto('/contact');
    
    // Check for form inputs (may not have exact test IDs yet)
    const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const messageInput = page.locator('textarea').first();
    
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(messageInput).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/contact');
    
    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Should see validation messages (native or custom)
    // This will fail if form allows empty submission
    const isValid = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form?.checkValidity() ?? false;
    });
    
    expect(isValid).toBe(false);
  });
});
