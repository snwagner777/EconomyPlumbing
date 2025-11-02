import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { storage } from '@/server/storage';
import BlogPostClient from './BlogPostClient';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  const post = await storage.getBlogPostBySlug(slug);
  
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

export default async function BlogPostPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{[key: string]: string | string[] | undefined}> }) {
  const resolvedParams = await params;
  const search = await searchParams;
  const urlParams = new URLSearchParams();
  Object.entries(search).forEach(([key, value]) => {
    if (value) urlParams.set(key, Array.isArray(value) ? value[0] : value);
  });
  const { austin: phoneConfig, marbleFalls: marbleFallsPhoneConfig } = await getPhoneNumbers(urlParams);

  return (
    <BlogPostClient 
      phoneConfig={phoneConfig}
      marbleFallsPhoneConfig={marbleFallsPhoneConfig}
    />
  );
}
