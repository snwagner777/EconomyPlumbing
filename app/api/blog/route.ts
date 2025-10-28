/**
 * Blog Posts API - Get All Posts
 * 
 * Returns all published blog posts for display
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const posts = await storage.getBlogPosts();
    
    // Sort by publish date (newest first)
    const sortedPosts = posts.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
    
    return NextResponse.json({
      posts: sortedPosts,
      count: sortedPosts.length,
    });
  } catch (error) {
    console.error('[Blog API] Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
