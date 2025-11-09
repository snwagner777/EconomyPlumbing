/**
 * Email Marketing Command Center
 * 
 * Consolidated email marketing dashboard with:
 * - Campaign management (Review Requests, Referral Nurture, Quote Follow-up)
 * - AI-powered email template generation (GPT-4o)
 * - Template editor with visual/HTML/plain text modes
 * - Campaign analytics and performance metrics
 * - UTM-tracked phone numbers for email campaigns
 * - Master email switch controls
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import EmailMarketingClient from './email-marketing-client';

export const metadata: Metadata = {
  title: 'Email Marketing | Admin',
  description: 'Manage email campaigns, templates, and analytics',
  robots: 'noindex',
};

export default async function EmailMarketingPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <EmailMarketingClient />;
}
