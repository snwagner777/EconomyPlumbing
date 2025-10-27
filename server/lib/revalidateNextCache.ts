/**
 * Helper function to trigger Next.js ISR revalidation from Express backend
 * 
 * Call this function when:
 * - A new blog post is published
 * - A blog post is updated
 * - A blog post is deleted
 * 
 * This ensures the Next.js cache is updated immediately instead of waiting
 * for the time-based revalidation (60s for /blog, 3600s for individual posts)
 */

export async function revalidateNextCache(options: {
  path?: '/blog';
  slug?: string;
}): Promise<boolean> {
  try {
    // Use internal URL to call Next.js revalidation endpoint directly
    // In production: NEXT_INTERNAL_URL should point to the internal Next.js server (e.g., http://localhost:5000)
    // In development: Falls back to localhost:5000
    const baseUrl = process.env.NEXT_INTERNAL_URL || 'http://localhost:5000';
    const revalidationSecret = process.env.REVALIDATION_SECRET || 'dev-secret-change-in-production';

    const response = await fetch(`${baseUrl}/_revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: revalidationSecret,
        path: options.path,
        slug: options.slug,
      }),
    });

    if (!response.ok) {
      console.error('[Revalidation] Failed:', response.status, await response.text());
      return false;
    }

    const data = await response.json();
    console.log('[Revalidation] Success:', data);
    return true;
  } catch (error) {
    console.error('[Revalidation] Error:', error);
    return false;
  }
}

// Example usage in Express routes:
// 
// After creating a new blog post:
// await revalidateNextCache({ path: '/blog', slug: newPost.slug });
//
// After updating a blog post:
// await revalidateNextCache({ slug: updatedPost.slug });
//
// After deleting a blog post:
// await revalidateNextCache({ path: '/blog' });
