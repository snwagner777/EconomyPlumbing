import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Sorry, we couldn't find the blog post you're looking for.
        </p>
        <Link 
          href="/blog" 
          className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          View All Posts
        </Link>
      </div>
    </main>
  );
}
