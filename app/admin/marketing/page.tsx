/**
 * Marketing Admin Page
 * 
 * Manage email campaigns, review requests, referral nurture, and tracking numbers
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import { MarketingDashboard } from './marketing-dashboard';

export const metadata: Metadata = {
  title: 'Marketing Admin | Economy Plumbing',
  robots: 'noindex',
};

export default async function MarketingAdminPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin/oauth-login');
  }

  return <MarketingDashboard />;
}
