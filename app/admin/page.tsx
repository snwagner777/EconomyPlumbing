/**
 * Admin Dashboard - Main Page (Server Component)
 * 
 * Auth-gated entry point that loads the dashboard overview
 * Uses DashboardOverviewClient as single source of truth for admin metrics
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import DashboardOverviewClient from './_components/dashboard-overview-client';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Economy Plumbing Services',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <DashboardOverviewClient />;
}
