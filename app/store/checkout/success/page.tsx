import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import CheckoutSuccessClient from './CheckoutSuccessClient';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata('/store/checkout/success', {
    title: 'Purchase Successful | Economy Plumbing Services',
    description: 'Thank you for your VIP membership purchase. Welcome to the Economy Plumbing VIP program.',
  });
  
  // This is a transaction confirmation page - should not be indexed
  return {
    ...metadata,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers(urlParams);

  return (
    <CheckoutSuccessClient 
      phoneConfig={phoneConfig}
      marbleFallsPhoneConfig={marbleFallsPhoneConfig}
    />
  );
}
