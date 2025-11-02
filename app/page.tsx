import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import HomeClient from './HomeClient';

/**
 * Homepage - Server Component with Database-Driven Metadata
 * 
 * Metadata managed through admin panel at /admin/metadata
 */

export async function generateMetadata(): Promise<Metadata> {
  // Fetch metadata from admin panel database with fallback defaults
  return await getPageMetadata('/', {
    title: 'Professional Plumbing Services in Austin & Central Texas | Economy Plumbing',
    description: 'Expert plumbing services in Austin, Cedar Park, Leander, Round Rock, Georgetown, Pflugerville, Marble Falls & surrounding areas. 24/7 emergency service, licensed & insured. Call now for fast, reliable plumbing solutions.',
    ogImage: 'https://plumbersthatcare.com/attached_assets/logo.jpg',
    ogType: 'website',
  });
}

export default function HomePage() {
  return <HomeClient />;
}
