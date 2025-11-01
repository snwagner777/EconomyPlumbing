/**
 * Customers Admin Page
 * 
 * Manage ServiceTitan customer data, XLSX imports, and sync monitoring
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { CustomersDashboard } from './customers-dashboard';

export const metadata: Metadata = {
  title: 'Customers Admin | Economy Plumbing',
  robots: 'noindex',
};

export default async function CustomersAdminPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <CustomersDashboard />;
}
