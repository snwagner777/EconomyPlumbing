/**
 * Admin API - AI Blog Post Generation
 * 
 * Trigger AI-powered blog post generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { z } from 'zod';

const generateSchema = z.object({
  topic: z.string().optional(),
  photoId: z.number().int().optional(),
  seasonalAware: z.boolean().optional(),
  targetKeywords: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    const result = generateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // TODO: AI blog generation not yet migrated to Next.js
    // Will use autoBlogGenerator.ts logic
    return NextResponse.json(
      { error: 'AI blog generation temporarily unavailable during migration' },
      { status: 503 }
    );
  } catch (error) {
    console.error('[Admin AI Blog Generation API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate blog post', details: (error as Error).message },
      { status: 500 }
    );
  }
}
