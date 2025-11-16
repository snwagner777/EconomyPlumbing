import { Page } from '@playwright/test';

/**
 * Navigate to a service page
 */
export async function goToService(page: Page, service: string) {
  await page.goto('/');
  await page.click(`[data-testid="link-service-${service}"]`);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to portal section
 */
export async function goToPortalSection(page: Page, section: string) {
  const sectionMap: Record<string, string> = {
    dashboard: '/customer-portal/dashboard',
    appointments: '/customer-portal/appointments',
    invoices: '/customer-portal/billing',
    contacts: '/customer-portal/contacts',
    settings: '/customer-portal/settings',
  };
  
  await page.goto(sectionMap[section] || section);
  await page.waitForLoadState('networkidle');
}

/**
 * Navigate to admin section
 */
export async function goToAdminSection(page: Page, section: string) {
  await page.goto(`/admin/${section}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Fill out contact form
 */
export async function fillContactForm(page: Page, data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  await page.fill('[data-testid="input-name"]', data.name);
  await page.fill('[data-testid="input-email"]', data.email);
  await page.fill('[data-testid="input-phone"]', data.phone);
  await page.fill('[data-testid="input-message"]', data.message);
}
