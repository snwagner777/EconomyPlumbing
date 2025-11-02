/**
 * Sewer Line Repair & Replacement Page
 */

import type { Metadata } from 'next';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import SewerLineRepairClient from './SewerLineRepairClient';

interface SewerLineRepairPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export const metadata: Metadata = {
  title: 'Sewer Line Repair Austin TX | Trenchless & Traditional',
  description: 'Expert sewer line repair and replacement in Austin. Camera inspection, trenchless repair, traditional excavation. Fast, reliable service. Call (512) 368-9159.',
  openGraph: {
    title: 'Sewer Line Repair Austin TX',
    description: 'Expert sewer line repair and replacement. Camera inspection and trenchless options.',
  },
};

export default async function SewerLineRepairPage({ searchParams }: SewerLineRepairPageProps) {
  const params = await searchParams;
  const urlParams = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = Array.isArray(value) ? value[0] : value;
      }
      return acc;
    }, {} as Record<string, string>)
  );
  
  const { austin: phoneConfig } = await getPhoneNumbers(urlParams);

  return <SewerLineRepairClient phoneConfig={phoneConfig} />;
}
