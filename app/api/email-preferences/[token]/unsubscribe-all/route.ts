import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { emailPreferences } from '@shared/schema';
import { sql } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const [updated] = await db
      .update(emailPreferences)
      .set({
        marketingEmails: false,
        reviewRequests: false,
        referralEmails: false,
        serviceReminders: false,
        transactionalOnly: true,
        optedOutAt: new Date(),
        fullyUnsubscribedAt: new Date(),
        lastUpdated: new Date(),
      })
      .where(sql`${emailPreferences.unsubscribeToken} = ${token}`)
      .returning();
    
    if (!updated) {
      return NextResponse.json(
        { message: "Preferences not found" },
        { status: 404 }
      );
    }
    
    console.log(`[Email Preferences] Unsubscribed ${updated.email} from all emails`);
    return NextResponse.json({ 
      success: true,
      message: "You've been unsubscribed from all emails"
    });
  } catch (error: any) {
    console.error('[Email Preferences] Error unsubscribing:', error);
    return NextResponse.json(
      { message: "Error unsubscribing" },
      { status: 500 }
    );
  }
}
