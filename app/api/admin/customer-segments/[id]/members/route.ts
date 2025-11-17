import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { segmentMembership } from '@shared/schema';
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { db } = await import('@/server/db');
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const segmentId = parseInt(params.id);
    const { customerIds } = await req.json();
    
    if (!Array.isArray(customerIds)) {
      return NextResponse.json(
        { error: "customerIds must be an array" },
        { status: 400 }
      );
    }

    // Batch insert memberships
    const memberships = customerIds.map(customerId => ({
      segmentId,
      customerId
    }));

    await db.insert(segmentMembership).values(memberships).onConflictDoNothing();
    
    return NextResponse.json({ success: true, added: customerIds.length });
  } catch (error: any) {
    console.error("Error adding segment members:", error);
    return NextResponse.json(
      { error: "Failed to add members" },
      { status: 500 }
    );
  }
}
