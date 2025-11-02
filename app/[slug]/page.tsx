import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { storage } from '@/server/storage';
import BlogPostClient from './BlogPostClient';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const slug = params.slug;
  
  const post = await storage.getBlogPost(slug);
  
  if (!post) {
    return getPageMetadata(`/${slug}`, {
      title: 'Post Not Found | Economy Plumbing Services',
      description: 'The blog post you are looking for does not exist.',
    });
  }

  return getPageMetadata(`/${slug}`, {
    title: `${post.title} | Economy Plumbing Services`,
    description: post.metaDescription || post.content.substring(0, 155),
    ogImage: post.featuredImage,
    ogType: 'article',
  });
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers();

  return (
    <BlogPostClient 
      phoneConfig={phoneConfig}
      marbleFallsPhoneConfig={marbleFallsPhoneConfig}
    />
  );
}
  "Drain Cleaning": "drain",
  "Drains": "drain",
  "Emergency Tips": "general",
