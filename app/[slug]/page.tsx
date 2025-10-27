import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// ISR configuration: Revalidate every 3600 seconds (1 hour)
// Individual posts change less frequently than the listing
export const revalidate = 3600;

interface BlogPost {
  id: string;
  title: string;
  h1?: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  publishDate: string;
  published: boolean;
  imageId?: string;
  metaTitle?: string;
  metaDescription?: string;
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Use internal server URL to avoid CDN loops in production
    const baseUrl = process.env.NEXT_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/blog/${slug}`, {
      next: { revalidate: 3600 }, // ISR: Revalidate every hour
    });
    
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch blog post: ${res.status}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

// Generate static params for all published blog posts
// This enables static generation at build time + ISR updates
export async function generateStaticParams() {
  try {
    // Use internal server URL
    const baseUrl = process.env.NEXT_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/blog`);
    
    if (!res.ok) return [];
    
    const data = await res.json();
    const posts = data.blogPosts || [];
    
    // Only generate static pages for published posts
    return posts
      .filter((post: BlogPost) => post.published)
      .map((post: BlogPost) => ({
        slug: post.slug,
      }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPost(params.slug);
  
  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      type: 'article',
      publishedTime: post.publishDate,
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug);
  
  // Show 404 if post doesn't exist or isn't published
  if (!post || !post.published) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-12">
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
              {post.category}
            </span>
            <time dateTime={post.publishDate}>
              {new Date(post.publishDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            {post.h1 || post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground">
              {post.excerpt}
            </p>
          )}
        </header>

        <div 
          className="prose prose-lg max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </main>
  );
}
