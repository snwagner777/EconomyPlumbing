/**
 * Admin API - Contact Form Submissions
 * 
 * View and manage contact form submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { contactSubmissions } from '@shared/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';

const submissionUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'resolved', 'spam']).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    let query = db.select().from(contactSubmissions);
    
    if (status) {
      query = query.where(eq(contactSubmissions.status, status));
    }

    const submissions = await query
      .orderBy(desc(contactSubmissions.submittedAt))
      .limit(limit)
      .offset(offset);

    // Get count with same filter
    let countQuery = db.select({ count: sql<number>`count(*)` }).from(contactSubmissions);
    if (status) {
      countQuery = countQuery.where(eq(contactSubmissions.status, status));
    }
    const [{ count }] = await countQuery;

    return NextResponse.json({
      submissions,
      total: Number(count),
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Admin Contact Submissions API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate ID is present and is a number
    if (!body.id || typeof body.id !== 'number') {
      return NextResponse.json(
        { error: 'Invalid or missing submission ID' },
        { status: 400 }
      );
    }

    const { id, ...updates } = body;

    // Validate input
    const result = submissionUpdateSchema.safeParse(updates);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const [submission] = await db
      .update(contactSubmissions)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(contactSubmissions.id, id as number))
      .returning();

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error('[Admin Contact Submissions API] Error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}
