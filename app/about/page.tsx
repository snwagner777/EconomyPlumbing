import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import AboutClient from './AboutClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/about', {
    title: 'About Us - Family-Owned Plumbing Company | Economy Plumbing Services',
    description: 'Learn about Economy Plumbing Services, a family-operated plumbing company serving Austin and Central Texas since 1998. Licensed, insured, and committed to quality.',
    ogType: 'website',
  });
}

export default function AboutPage() {
  return <AboutClient />;
}
