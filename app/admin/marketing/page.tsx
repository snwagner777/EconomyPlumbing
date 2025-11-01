/**
 * Marketing Admin Page
 * 
 * Manage email campaigns, review requests, referral nurture, and tracking numbers
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { MarketingDashboard } from './marketing-dashboard';

export const metadata: Metadata = {
  title: 'Marketing Admin | Economy Plumbing',
  robots: 'noindex',
};

export default async function MarketingAdminPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <MarketingDashboard />;
}
