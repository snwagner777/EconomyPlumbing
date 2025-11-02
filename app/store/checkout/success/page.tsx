import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import CheckoutSuccessClient from './CheckoutSuccessClient';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata('/store/checkout/success', {
    title: 'Purchase Successful | Economy Plumbing Services',
    description: 'Thank you for your VIP membership purchase. Welcome to the Economy Plumbing VIP program.',
  });
}

export default async function CheckoutSuccessPage() {
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers();

  return (
    <CheckoutSuccessClient 
      phoneConfig={phoneConfig}
      marbleFallsPhoneConfig={marbleFallsPhoneConfig}
    />
  );
}
