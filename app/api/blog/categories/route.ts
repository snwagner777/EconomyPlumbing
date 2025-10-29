import { NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET() {
  try {
    const allPosts = await storage.getBlogPosts();
    
    // Extract unique categories from all published posts
    const categoriesSet = new Set<string>();
    allPosts.forEach(post => {
      if (post.category) {
        categoriesSet.add(post.category);
      }
    });
    
    // Convert to sorted array (alphabetically)
    const categories = Array.from(categoriesSet).sort();
    
    // Cache categories for 1 hour
    return NextResponse.json({ categories }, {
      headers: {
        'Cache-Control': 'public, max-age=3600, must-revalidate'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
