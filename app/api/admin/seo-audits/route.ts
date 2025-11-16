import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { seoAuditJobs, seoAuditResults } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const createJobSchema = z.object({
  tool: z.enum(['lighthouse', 'site-audit-seo', 'seo-analyzer']),
  scope: z.enum(['single', 'batch', 'full-crawl']),
  targetUrl: z.string().url().optional(),
  batchId: z.string().optional(),
  config: z.object({
    preset: z.enum(['mobile', 'desktop']).optional(),
    maxDepth: z.number().optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createJobSchema.parse(body);

    if (validatedData.scope === 'single' && !validatedData.targetUrl) {
      return NextResponse.json(
        { error: 'targetUrl is required for single URL audits' },
        { status: 400 }
      );
    }

    if (validatedData.scope === 'batch' && !validatedData.batchId) {
      return NextResponse.json(
        { error: 'batchId is required for batch audits' },
        { status: 400 }
      );
    }

    const [job] = await db.insert(seoAuditJobs).values({
      tool: validatedData.tool,
      scope: validatedData.scope,
      targetUrl: validatedData.targetUrl,
      batchId: validatedData.batchId,
      config: validatedData.config,
      status: 'queued',
      triggeredBy: 'admin',
    }).returning();

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('[SEO Audits API] Error creating job:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create audit job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const tool = searchParams.get('tool');

    let query = db.select().from(seoAuditJobs);

    if (status) {
      query = query.where(eq(seoAuditJobs.status, status)) as any;
    }

    if (tool) {
      query = query.where(eq(seoAuditJobs.tool, tool)) as any;
    }

    const jobs = await query
      .orderBy(desc(seoAuditJobs.queuedAt))
      .limit(limit)
      .offset(offset);

    const jobsWithResults = await Promise.all(
      jobs.map(async (job) => {
        const [result] = await db
          .select()
          .from(seoAuditResults)
          .where(eq(seoAuditResults.jobId, job.id))
          .limit(1);

        return {
          ...job,
          result: result || null,
        };
      })
    );

    return NextResponse.json(jobsWithResults);
  } catch (error) {
    console.error('[SEO Audits API] Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit jobs' },
      { status: 500 }
    );
  }
}
