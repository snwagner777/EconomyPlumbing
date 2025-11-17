import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { seoAuditBatches } from '@shared/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';

const createBatchSchema = z.object({
  label: z.string().min(1),
  description: z.string().optional(),
  pages: z.array(z.object({
    url: z.string().url(),
    label: z.string(),
  })),
});

export async function POST(request: NextRequest) {
  const { db } = await import('@/server/db');
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = createBatchSchema.parse(body);

    const [batch] = await db.insert(seoAuditBatches).values({
      label: validatedData.label,
      description: validatedData.description,
      pages: validatedData.pages,
      createdBy: 'admin',
    }).returning();

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('[SEO Audits Batches API] Error creating batch:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { db } = await import('@/server/db');
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const batches = await db
      .select()
      .from(seoAuditBatches)
      .orderBy(desc(seoAuditBatches.createdAt));

    return NextResponse.json(batches);
  } catch (error) {
    console.error('[SEO Audits Batches API] Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}
