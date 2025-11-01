/**
 * Reputation Management - Admin Page
 * 
 * AI-powered review request automation and template management
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import ReputationDashboard from './reputation-dashboard';

export const metadata: Metadata = {
  title: 'Reputation Management | Admin',
  robots: 'noindex',
};

export default async function ReputationPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <ReputationDashboard />;
}
