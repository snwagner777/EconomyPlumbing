import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

/**
 * On-demand revalidation endpoint for blog posts
 * 
 * This route can be called from the Express backend when:
 * - A new blog post is published
 * - A blog post is updated
 * - A blog post is deleted
 * 
 * Usage from Express:
 * ```
 * await fetch('http://localhost:5000/api/revalidate', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     secret: process.env.REVALIDATION_SECRET,
 *     path: '/blog',
 *     slug: 'blog-post-slug' // optional
 *   })
 * });
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path, slug } = body;

    // Verify secret to prevent unauthorized revalidation
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalidate blog listing page
    if (path === '/blog' || !path) {
      revalidatePath('/blog');
    }

    // Revalidate specific blog post if slug provided
    if (slug) {
      revalidatePath(`/${slug}`);
    }

    return NextResponse.json(
      { 
        revalidated: true, 
        paths: [path === '/blog' || !path ? '/blog' : null, slug ? `/${slug}` : null].filter(Boolean)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      { error: 'Error revalidating' },
      { status: 500 }
    );
  }
}
