import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { customCampaignSendLog } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
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

    const campaignId = parseInt(params.id);
    
    const logs = await db
      .select()
      .from(customCampaignSendLog)
      .where(eq(customCampaignSendLog.campaignId, campaignId))
      .orderBy(desc(customCampaignSendLog.sentAt));
    
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Error fetching campaign send logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch send logs" },
      { status: 500 }
    );
  }
}
