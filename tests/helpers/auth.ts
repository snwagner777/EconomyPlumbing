import { Page } from '@playwright/test';

/**
 * Test phone number for SMS verification (mock data)
 */
export const TEST_PHONE = '5125551234';

/**
 * Test customer ID from ServiceTitan (real test customer)
 */
export const TEST_CUSTOMER_ID = 27881198;

/**
 * Test admin credentials
 */
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

/**
 * Login to customer portal using phone verification
 */
export async function loginToPortal(page: Page, phone: string = TEST_PHONE) {
  await page.goto('/customer-portal');
  
  // Enter phone number
  await page.fill('[data-testid="input-phone"]', phone);
  await page.click('[data-testid="button-send-code"]');
  
  // Wait for code input
  await page.waitForSelector('[data-testid="input-verification-code"]', { timeout: 5000 });
  
  // In test environment, we'll need to mock the SMS code
  // For now, enter a test code that should be accepted in dev mode
  await page.fill('[data-testid="input-verification-code"]', '123456');
  await page.click('[data-testid="button-verify-code"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/customer-portal/dashboard', { timeout: 10000 });
}

/**
 * Login to admin panel
 */
export async function loginToAdmin(page: Page) {
  await page.goto('/admin/login');
  
  await page.fill('[data-testid="input-username"]', ADMIN_USERNAME);
  await page.fill('[data-testid="input-password"]', ADMIN_PASSWORD);
  await page.click('[data-testid="button-login"]');
  
  // Wait for redirect to admin dashboard
  await page.waitForURL('**/admin/**', { timeout: 10000 });
}

/**
 * Logout from customer portal
 */
export async function logoutFromPortal(page: Page) {
  await page.click('[data-testid="button-logout"]');
  await page.waitForURL('**/customer-portal', { timeout: 5000 });
}

/**
 * Logout from admin panel
 */
export async function logoutFromAdmin(page: Page) {
  await page.click('[data-testid="button-logout"]');
  await page.waitForURL('**/admin/login', { timeout: 5000 });
}
