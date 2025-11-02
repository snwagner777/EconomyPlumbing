import type { Metadata} from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import ContactClient from './ContactClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/contact', {
    title: 'Contact Us - Get Your Free Plumbing Estimate | Economy Plumbing Services',
    description: 'Contact Economy Plumbing Services for expert plumbing help in Austin and Central Texas. Call (512) 428-2769 or fill out our online form for a free estimate. 24/7 emergency service available.',
    ogType: 'website',
  });
}

export default function ContactPage() {
  return <ContactClient />;
}
