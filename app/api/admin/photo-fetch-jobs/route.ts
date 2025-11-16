import { NextResponse } from 'next/server';
import { db } from '../../../../server/db';
import { serviceTitanPhotoJobs } from '../../../../shared/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Fetch recent photo fetch jobs (last 50)
    const jobs = await db
      .select()
      .from(serviceTitanPhotoJobs)
      .orderBy(desc(serviceTitanPhotoJobs.createdAt))
      .limit(50);

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('[Photo Fetch Jobs API] Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photo fetch jobs' },
      { status: 500 }
    );
  }
}
