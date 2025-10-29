/**
 * ServiceTitan Sync - Admin Page
 * 
 * ServiceTitan sync monitoring
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import { ServiceTitanDashboard } from './servicetitan-dashboard';

export const metadata: Metadata = {
  title: 'ServiceTitan Sync | Admin',
  robots: 'noindex',
};

export default async function ServiceTitanPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin-login');
  }

  return <ServiceTitanDashboard />;
}
