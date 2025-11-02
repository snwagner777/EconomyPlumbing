import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import CustomerPortalClient from './CustomerPortalClient';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata('/customer-portal', {
    title: 'Customer Portal | Economy Plumbing Services',
    description: 'Access your Economy Plumbing customer portal to view appointments, invoices, and manage your account.',
  });
}

export default async function CustomerPortalPage() {
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers();

  return (
    <CustomerPortalClient 
      phoneConfig={phoneConfig}
      marbleFallsPhoneConfig={marbleFallsPhoneConfig}
    />
  );
}
