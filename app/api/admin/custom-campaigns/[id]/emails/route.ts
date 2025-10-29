import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { customCampaignEmails, insertCustomCampaignEmailSchema } from '@/shared/schema';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/server/lib/session';
import { cookies } from 'next/headers';

export async function POST(
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
    const body = await req.json();
    
    const validated = insertCustomCampaignEmailSchema.parse({
      ...body,
      campaignId
    });
    
    const [email] = await db.insert(customCampaignEmails).values(validated).returning();
    return NextResponse.json(email);
  } catch (error: any) {
    console.error("Error creating campaign email:", error);
    return NextResponse.json(
      { error: "Failed to create email" },
      { status: 500 }
    );
  }
}
