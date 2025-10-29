import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customCampaignSendLog } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/server/lib/session';
import { cookies } from 'next/headers';

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
