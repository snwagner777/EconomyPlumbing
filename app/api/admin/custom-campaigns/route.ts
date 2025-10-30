import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customEmailCampaigns, insertCustomEmailCampaignSchema } from '@/shared/schema';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
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
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
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
