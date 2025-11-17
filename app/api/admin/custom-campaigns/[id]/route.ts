import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { customEmailCampaigns, customCampaignEmails, customCampaignSendLog } from '@shared/schema';
import { eq } from 'drizzle-orm';
export async function GET(
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

    const campaignId = parseInt(params.id);
    
    const [campaign] = await db.select().from(customEmailCampaigns).where(eq(customEmailCampaigns.id, campaignId));
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get emails in sequence
    const emails = await db
      .select()
      .from(customCampaignEmails)
      .where(eq(customCampaignEmails.campaignId, campaignId))
      .orderBy(customCampaignEmails.sequenceNumber);
    
    return NextResponse.json({ ...campaign, emails });
  } catch (error: any) {
    console.error("Error fetching custom campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const campaignId = parseInt(params.id);
    const body = await req.json();
    
    const [updated] = await db
      .update(customEmailCampaigns)
      .set(body)
      .where(eq(customEmailCampaigns.id, campaignId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Error updating custom campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const campaignId = parseInt(params.id);
    
    // Delete send logs first
    await db.delete(customCampaignSendLog).where(eq(customCampaignSendLog.campaignId, campaignId));
    
    // Delete emails
    await db.delete(customCampaignEmails).where(eq(customCampaignEmails.campaignId, campaignId));
    
    // Delete campaign
    await db.delete(customEmailCampaigns).where(eq(customEmailCampaigns.id, campaignId));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting custom campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
