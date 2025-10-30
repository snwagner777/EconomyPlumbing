import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata('/blog');
  
  if (metadata) {
    return {
      title: metadata.title,
      description: metadata.description,
      alternates: {
        canonical: metadata.canonical || undefined,
      },
    };
  }
  
  return {
    title: 'Blog | Economy Plumbing Services',
    description: 'Plumbing tips, guides, and insights from Economy Plumbing Services',
  };
}
