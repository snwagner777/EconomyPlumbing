/**
 * Admin Dashboard Overview Page
 * 
 * Comprehensive admin dashboard with:
 * - Customer database sync status
 * - Portal analytics
 * - Photo management stats
 * - System health monitoring
 * - Conversion tracking
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import DashboardOverviewClient from './dashboard-overview-client';

export const metadata: Metadata = {
  title: 'Dashboard Overview | Admin',
  robots: 'noindex',
};

export default async function DashboardOverviewPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <DashboardOverviewClient />;
}
