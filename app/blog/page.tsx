import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import BlogClient from './BlogClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/blog', {
    title: 'Plumbing Tips & Expert Advice Blog | Economy Plumbing Services',
    description: 'Expert plumbing tips, maintenance guides, and industry insights from Economy Plumbing Services. Learn how to maintain your plumbing system and prevent costly repairs.',
    ogType: 'website',
  });
}

export default function BlogPage() {
  return <BlogClient />;
}
