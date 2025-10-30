import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { customCampaignEmails } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; emailId: string } }
) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const campaignId = parseInt(params.id);
    const emailId = parseInt(params.emailId);
    const body = await req.json();
    
    // Verify email belongs to this campaign
    const [existing] = await db
      .select()
      .from(customCampaignEmails)
      .where(and(
        eq(customCampaignEmails.id, emailId),
        eq(customCampaignEmails.campaignId, campaignId)
      ));

    if (!existing) {
      return NextResponse.json(
        { error: "Email not found in this campaign" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(customCampaignEmails)
      .set(body)
      .where(eq(customCampaignEmails.id, emailId))
      .returning();

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating campaign email:", error);
    return NextResponse.json(
      { error: "Failed to update email" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; emailId: string } }
) {
  try {
    const session = await getIronSession(cookies(), sessionOptions);
    
    if (!session.userId) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const campaignId = parseInt(params.id);
    const emailId = parseInt(params.emailId);
    
    // Verify email belongs to this campaign before deleting
    const [existing] = await db
      .select()
      .from(customCampaignEmails)
      .where(and(
        eq(customCampaignEmails.id, emailId),
        eq(customCampaignEmails.campaignId, campaignId)
      ));

    if (!existing) {
      return NextResponse.json(
        { error: "Email not found in this campaign" },
        { status: 404 }
      );
    }

    await db.delete(customCampaignEmails).where(eq(customCampaignEmails.id, emailId));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting campaign email:", error);
    return NextResponse.json(
      { error: "Failed to delete email" },
      { status: 500 }
    );
  }
}
