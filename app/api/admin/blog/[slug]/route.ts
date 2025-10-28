/**
 * Admin API - Single Blog Post Management
 * 
 * Update or delete individual blog post
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const updates = await req.json();
    
    const existingPost = await storage.getBlogPostBySlug(slug);
    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = await storage.updateBlogPost(existingPost.id, updates);

    return NextResponse.json({ post });
  } catch (error) {
    console.error('[Admin Blog API] Error:', error);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
