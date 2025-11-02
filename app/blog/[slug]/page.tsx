import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { storage } from '@/server/storage';
import { getPageMetadata } from '@/server/lib/metadata';
import BlogPostClient from '@/page-components/BlogPost';
import { createBlogPostSchema, createBreadcrumbListSchema } from '@/components/SEO/JsonLd';

/**
 * Blog Post Detail Page - Server Component with Database-Driven Metadata
 * 
 * Metadata dynamically generated from blog post content for optimal SEO
 * Post data fetched server-side and rendered in HTML for search engines
 */

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const post = await storage.getBlogPostBySlug(slug);
    
    if (!post) {
      return {
        title: 'Post Not Found | Economy Plumbing',
        description: 'The blog post you are looking for could not be found.',
      };
    }

    const canonicalUrl = `https://www.plumbersthatcare.com/${slug}`;
    const ogImage = post.featuredImage 
      ? (post.featuredImage.startsWith('http') 
          ? post.featuredImage 
          : `https://www.plumbersthatcare.com${post.featuredImage}`)
      : 'https://www.plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg';

    return {
      title: `${post.title} | Economy Plumbing`,
      description: post.metaDescription || post.excerpt || post.title,
      keywords: post.category,
      openGraph: {
        title: post.title,
        description: post.metaDescription || post.excerpt || post.title,
        url: canonicalUrl,
        siteName: 'Economy Plumbing Services',
        type: 'article',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `Featured image for: ${post.title}`,
          },
        ],
        locale: 'en_US',
        publishedTime: new Date(post.publishDate).toISOString(),
        authors: [post.author],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.metaDescription || post.excerpt || post.title,
        images: [ogImage],
        site: '@plumbersthatcare',
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('[Blog Post Page] Error generating metadata:', error);
    return {
      title: 'Blog Post | Economy Plumbing',
      description: 'Read our latest plumbing tips, advice, and news.',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  
  // Fetch blog post server-side for SEO
  const post = await storage.getBlogPostBySlug(slug);
  
  if (!post) {
    notFound();
  }
  
  // Fetch all posts for related posts and navigation
  const allPosts = await storage.getBlogPosts();
  
  // Generate JSON-LD schemas for SEO
  const canonicalUrl = `https://www.plumbersthatcare.com/${slug}`;
  const blogPostSchema = createBlogPostSchema(post);
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Blog", url: "https://www.plumbersthatcare.com/blog" },
    { name: post.title, url: canonicalUrl }
  ]);
  
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      
      {/* Client component with interactive features */}
      <BlogPostClient post={post} allPosts={allPosts} />
    </>
  );
}
