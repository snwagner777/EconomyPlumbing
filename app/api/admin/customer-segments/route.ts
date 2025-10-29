import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customerSegments, segmentMembership, insertCustomerSegmentSchema } from '@/shared/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/server/lib/session';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const segments = await db.select().from(customerSegments).orderBy(desc(customerSegments.createdAt));
    
    // Get member counts for each segment
    const segmentsWithCounts = await Promise.all(segments.map(async (segment) => {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(segmentMembership)
        .where(eq(segmentMembership.segmentId, segment.id));
      
      return {
        ...segment,
        memberCount: countResult?.count || 0
      };
    }));

    return NextResponse.json(segmentsWithCounts);
  } catch (error: any) {
    console.error("Error fetching customer segments:", error);
    return NextResponse.json(
      { error: "Failed to fetch segments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = insertCustomerSegmentSchema.parse(body);
    
    const [segment] = await db.insert(customerSegments).values(validated).returning();
    return NextResponse.json(segment);
  } catch (error: any) {
    console.error("Error creating customer segment:", error);
    return NextResponse.json(
      { error: "Failed to create segment" },
      { status: 500 }
    );
  }
}
