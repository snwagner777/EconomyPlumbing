import type { Metadata} from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import ContactClient from './ContactClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/contact', {
    title: 'Contact Us - Get Your Free Plumbing Estimate | Economy Plumbing Services',
    description: 'Contact Economy Plumbing for expert plumbing help in Austin and Central Texas. Free estimates, 24/7 emergency service. Call or fill out our form.',
    ogType: 'website',
  });
}

export default function ContactPage() {
  return <ContactClient />;
}
