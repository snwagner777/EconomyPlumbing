/**
 * Admin Dashboard - Main Page (Server Component)
 * 
 * Auth-gated entry point that loads the unified admin client component
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import UnifiedAdminClient from './_components/UnifiedAdminClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Economy Plumbing Services',
  robots: 'noindex',
};

export default async function AdminDashboardPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin/login');
  }

  return <UnifiedAdminClient />;
}
