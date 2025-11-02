import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import ServicesClient from './ServicesClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/services', {
    title: 'Plumbing Services | Water Heaters, Drains, Leaks & More | Economy Plumbing',
    description: 'Complete plumbing services for residential and commercial properties. Water heater installation & repair, drain cleaning, leak detection, emergency plumbing, and more. Licensed & insured plumbers in Central Texas.',
    ogType: 'website',
  });
}

export default function ServicesPage() {
  return <ServicesClient />;
}
