/**
 * Dynamic Blog Post Page
 * 
 * Handles individual blog post URLs (/:slug)
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: { slug: string };
};

async function getBlogPost(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/blog-posts/${slug}`,
    { next: { revalidate: 3600 } }
  );
  
  if (!res.ok) {
    return null;
  }
  
  const data = await res.json();
  return data.blogPost;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const post = await getBlogPost(slug);
  
  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  const description = post.metaDescription || post.excerpt || post.description || 'Read this helpful plumbing article from Economy Plumbing Services';

  return {
    title: `${post.metaTitle || post.title} | Economy Plumbing Blog`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <article className="max-w-4xl mx-auto">
          {post.imageUrl && (
            <img 
              src={post.imageUrl} 
              alt={post.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}

          <h1 className="text-4xl font-bold mb-6">{post.title}</h1>
          
          {post.publishedDate && (
            <p className="text-muted-foreground mb-8">
              Published: {new Date(post.publishedDate).toLocaleDateString()}
            </p>
          )}

          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          <div className="mt-12 pt-8 border-t">
            <a 
              href="/blog"
              className="text-primary hover:underline"
            >
              ← Back to Blog
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
