/**
 * Customers Admin Page
 * 
 * Manage ServiceTitan customer data, XLSX imports, and sync monitoring
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import { CustomersDashboard } from './customers-dashboard';

export const metadata: Metadata = {
  title: 'Customers Admin | Economy Plumbing',
  robots: 'noindex',
};

export default async function CustomersAdminPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin/oauth-login');
  }

  return <CustomersDashboard />;
}
