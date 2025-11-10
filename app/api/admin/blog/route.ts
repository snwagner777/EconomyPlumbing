/**
 * Admin API - Blog Post Management
 * 
 * Create, update, and manage blog posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { storage } from '@/server/storage';
import { z } from 'zod';

const blogPostSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  content: z.string().min(1),
  metaDescription: z.string().max(160).optional(),
  publishDate: z.string().datetime().optional(),
  category: z.string().min(1), // Required field
  tags: z.array(z.string()).optional(),
  featuredImageUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const posts = await storage.getBlogPosts();

    return NextResponse.json({
      posts,
      count: posts.length,
    });
  } catch (error) {
    console.error('[Admin Blog API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = blogPostSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const post = await storage.createBlogPost(result.data);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('[Admin Blog API] Error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
