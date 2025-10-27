import type { Metadata } from 'next';
import Link from 'next/link';

// ISR configuration: Revalidate every 60 seconds
// This ensures new AI-generated posts appear within 1 minute
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Plumbing Blog',
  description: 'Expert plumbing tips, guides, and insights from Economy Plumbing Services. Learn about water heaters, drain cleaning, leak repair, and more.',
  openGraph: {
    title: 'Plumbing Blog | Economy Plumbing Services',
    description: 'Expert plumbing tips, guides, and insights from Economy Plumbing Services.',
  },
};

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  publishDate: string;
  published: boolean;
  imageId?: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    // Fetch from Express API using internal server URL
    // In production, this should be set to the internal service URL, not the public domain
    const baseUrl = process.env.NEXT_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const res = await fetch(`${baseUrl}/api/blog`, {
      next: { revalidate: 60 }, // ISR: Revalidate every 60 seconds
    });
    
    if (!res.ok) {
      console.error('Failed to fetch blog posts:', res.status);
      return [];
    }
    
    const data = await res.json();
    return data.blogPosts || [];
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  
  // Filter only published posts
  const publishedPosts = posts.filter(post => post.published);

  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Plumbing Blog</h1>
        <p className="text-xl text-muted-foreground mb-12">
          Expert plumbing tips, guides, and insights from Economy Plumbing Services
        </p>

        {publishedPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No blog posts available yet.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {publishedPosts.map((post) => (
              <article key={post.id} className="border-b pb-8">
                <Link href={`/${post.slug}`} className="group">
                  <h2 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
                  <p className="text-muted-foreground line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 text-primary font-medium group-hover:underline">
                    Read more →
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
