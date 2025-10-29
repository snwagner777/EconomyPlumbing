import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customEmailCampaigns, insertCustomEmailCampaignSchema } from '@/shared/schema';
import { desc } from 'drizzle-orm';
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

    const campaigns = await db.select().from(customEmailCampaigns).orderBy(desc(customEmailCampaigns.createdAt));
    
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error("Error fetching custom campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
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
    const validated = insertCustomEmailCampaignSchema.parse(body);
    
    const [campaign] = await db.insert(customEmailCampaigns).values(validated).returning();
    return NextResponse.json(campaign);
  } catch (error: any) {
    console.error("Error creating custom campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
