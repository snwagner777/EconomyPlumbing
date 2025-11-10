/**
 * Tracking Numbers Admin Page
 * 
 * Manage dynamic phone numbers for marketing campaign attribution
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import TrackingNumbersClient from './tracking-numbers-client';

export const metadata: Metadata = {
  title: 'Tracking Numbers | Admin',
  description: 'Manage campaign phone numbers',
  robots: 'noindex',
};

export default async function TrackingNumbersPage() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    redirect('/admin/login');
  }

  return <TrackingNumbersClient />;
}
