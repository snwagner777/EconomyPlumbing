/**
 * Blog Listing Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plumbing Blog | Economy Plumbing Services Austin TX',
  description: 'Expert plumbing tips, guides, and advice from Austin\'s trusted plumbers. Learn about maintenance, repairs, and plumbing best practices.',
  openGraph: {
    title: 'Plumbing Blog - Economy Plumbing Services',
    description: 'Expert plumbing tips and advice from Austin plumbers',
  },
};

async function getBlogPosts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/blog-posts`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    return { blogPosts: [] };
  }
  
  return res.json();
}

export default async function BlogPage() {
  const { blogPosts } = await getBlogPosts();

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Plumbing Blog</h1>
          <p className="text-xl text-muted-foreground mb-12">
            Expert tips, guides, and advice from Austin's trusted plumbers
          </p>

          {blogPosts && blogPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post: any) => (
                <a 
                  key={post.id}
                  href={`/${post.slug}`}
                  className="block bg-card hover:bg-accent rounded-lg overflow-hidden transition"
                >
                  {post.imageUrl && (
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt || post.description}
                    </p>
                    <p className="text-sm text-primary">
                      Read more →
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Blog posts coming soon!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
