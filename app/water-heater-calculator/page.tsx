import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import WaterHeaterCalculatorClient from './WaterHeaterCalculatorClient';

/**
 * Water Heater Cost Calculator Page - Server Component with SEO
 * 
 * Metadata rendered server-side for proper SEO
 * Phone numbers server-rendered for crawlers, upgraded client-side for tracking
 */

interface WaterHeaterCalculatorPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/water-heater-calculator', {
    title: 'Water Heater Cost Calculator | Instant Installation Estimate',
    description: 'Calculate water heater installation costs instantly. Get estimates for tank, tankless, and hybrid water heaters. Free quotes available. Call (512) 368-9159.',
    ogImage: 'https://www.plumbersthatcare.com/attached_assets/optimized/Plumber_installing_water_heater_3f7d8a09.webp',
    ogType: 'website',
  });
}

export default async function WaterHeaterCalculatorPage({ searchParams }: WaterHeaterCalculatorPageProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Convert to URLSearchParams for phone number resolution
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      const stringValue = Array.isArray(value) ? value[0] : value;
      if (stringValue) urlParams.set(key, stringValue);
    }
  });
  
  // Fetch phone numbers server-side for SEO
  const { austin } = await getPhoneNumbers(urlParams);
  
  return <WaterHeaterCalculatorClient phoneConfig={austin} />;
}
