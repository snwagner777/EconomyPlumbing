/**
 * Hydro Jetting Services Page
 */

import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import HydroJettingServicesClient from './HydroJettingServicesClient';

interface HydroJettingServicesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/hydro-jetting-services', {
    title: 'Hydro Jetting Services Austin TX | Drain Cleaning',
    description: 'Professional hydro jetting services in Austin. High-pressure water jetting for stubborn clogs, tree roots, and grease buildup. Call (512) 368-9159.',
  });
}

export default async function HydroJettingServicesPage({ searchParams }: HydroJettingServicesPageProps) {
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

  return <HydroJettingServicesClient phoneConfig={phoneConfig} />;
}
