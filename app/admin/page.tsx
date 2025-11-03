/**
 * Admin Dashboard - Main Page (Server Component)
 * 
 * Auth-gated entry point that loads the complete unified admin dashboard
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import UnifiedAdminDashboard from './unified-admin-dashboard';

export const metadata: Metadata = {
  title: 'Unified Admin Panel | Economy Plumbing Services',
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

  return <UnifiedAdminDashboard />;
}
