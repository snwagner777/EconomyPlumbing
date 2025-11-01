import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { customerSegments, segmentMembership } from '@shared/schema';
import { eq } from 'drizzle-orm';
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const segmentId = parseInt(params.id);
    
    const [segment] = await db.select().from(customerSegments).where(eq(customerSegments.id, segmentId));
    if (!segment) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    // Get members
    const members = await db.select().from(segmentMembership).where(eq(segmentMembership.segmentId, segmentId));
    
    return NextResponse.json({ ...segment, members });
  } catch (error: any) {
    console.error("Error fetching customer segment:", error);
    return NextResponse.json(
      { error: "Failed to fetch segment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const segmentId = parseInt(params.id);
    const body = await req.json();
    
    const [updated] = await db
      .update(customerSegments)
      .set(body)
      .where(eq(customerSegments.id, segmentId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Segment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating customer segment:", error);
    return NextResponse.json(
      { error: "Failed to update segment" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const segmentId = parseInt(params.id);
    
    // Delete memberships first
    await db.delete(segmentMembership).where(eq(segmentMembership.segmentId, segmentId));
    
    // Delete segment
    await db.delete(customerSegments).where(eq(customerSegments.id, segmentId));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting customer segment:", error);
    return NextResponse.json(
      { error: "Failed to delete segment" },
      { status: 500 }
    );
  }
}
