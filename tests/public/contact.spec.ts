import { test, expect } from '@playwright/test';
import { fillContactForm } from '../helpers/navigation';

test.describe('Contact Form', () => {
  test('should display contact page', async ({ page }) => {
    await page.goto('/contact');
    
    // Check page loads
    await expect(page.locator('h1, h2').filter({ hasText: /contact/i }).first()).toBeVisible();
  });

  test.skip('should have contact form fields', async ({ page }) => {
    // Skip until contact form components have data-testid attributes added
    // TODO: Add data-testid to contact form inputs for reliable testing
    await page.goto('/contact');
    
    // Check for form inputs using data-testid attributes
    const nameInput = page.locator('[data-testid="input-name"]');
    const emailInput = page.locator('[data-testid="input-email"]');
    const phoneInput = page.locator('[data-testid="input-phone"]');
    const messageInput = page.locator('[data-testid="input-message"]');
    
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
