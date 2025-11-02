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

export default async function CustomerPortalPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers(urlParams);

  return (
    <CustomerPortalClient 
      phoneConfig={phoneConfig}
      marbleFallsPhoneConfig={marbleFallsPhoneConfig}
    />
  );
}
