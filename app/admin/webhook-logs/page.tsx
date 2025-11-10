/**
 * Webhook Logs Admin Page
 * 
 * Monitor XLSX customer imports and ServiceTitan invoice/estimate processing
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import WebhookLogsClient from './webhook-logs-client';

export const metadata: Metadata = {
  title: 'Webhook Logs | Admin',
  description: 'Monitor data imports and webhook processing',
  robots: 'noindex',
};

export default async function WebhookLogsPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <WebhookLogsClient />;
}
