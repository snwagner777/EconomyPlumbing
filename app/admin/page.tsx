/**
 * Admin Dashboard - Main Page (Server Component)
 * 
 * Auth-gated entry point that loads the unified admin client component
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import UnifiedAdminClient from './_components/UnifiedAdminClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Economy Plumbing Services',
  robots: 'noindex',
};

export default async function AdminDashboardPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <UnifiedAdminClient />;
}
