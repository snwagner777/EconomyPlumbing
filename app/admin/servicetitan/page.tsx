/**
 * ServiceTitan Sync - Admin Page
 * 
 * ServiceTitan sync monitoring
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { ServiceTitanDashboard } from './servicetitan-dashboard';

export const metadata: Metadata = {
  title: 'ServiceTitan Sync | Admin',
  robots: 'noindex',
};

export default async function ServiceTitanPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <ServiceTitanDashboard />;
}
