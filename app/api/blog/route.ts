/**
 * Blog Posts API
 * 
 * GET: Returns all published blog posts
 * POST: Creates a new blog post with automatic H1 generation and sitemap notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { generateH1FromTitle } from '@/server/lib/generateH1';
import { notifySearchEnginesNewPage } from '@/server/lib/sitemapPing';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const category = searchParams.get('category');
    
    let posts = await storage.getBlogPosts();
    
    // Filter by category if specified
    if (category && category !== 'All') {
      posts = posts.filter(post => post.category === category);
    }
    
    // Sort by publish date (newest first)
    const sortedPosts = posts.sort((a, b) => 
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
    
    // Calculate pagination
    const total = sortedPosts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPosts = sortedPosts.slice(start, end);
    
    return NextResponse.json({
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Blog API] Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Automatically generate H1 if not provided
    const postData = {
      ...body,
      h1: body.h1 || generateH1FromTitle(body.title)
    };
    
    const newPost = await storage.createBlogPost(postData);
    
    // Notify search engines about new page
    notifySearchEnginesNewPage('blog post');
    
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('[Blog API] Error creating blog post:', error);
    return NextResponse.json(
      { message: "Failed to create blog post" },
      { status: 500 }
    );
  }
}
