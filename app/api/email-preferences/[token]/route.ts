import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { emailPreferences, emailSuppressionList } from '@shared/schema';
import { sql, eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const [prefs] = await db
      .select()
      .from(emailPreferences)
      .where(sql`${emailPreferences.unsubscribeToken} = ${token}`)
      .limit(1);
    
    if (!prefs) {
      return NextResponse.json(
        { message: "Preferences not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ preferences: prefs });
  } catch (error: any) {
    console.error('[Email Preferences] Error fetching preferences:', error);
    return NextResponse.json(
      { message: "Error fetching preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { marketingEmails, reviewRequests, referralEmails, serviceReminders, transactionalOnly } = await req.json();
    
    // Find existing preferences
    const [existing] = await db
      .select()
      .from(emailPreferences)
      .where(sql`${emailPreferences.unsubscribeToken} = ${token}`)
      .limit(1);
    
    if (!existing) {
      return NextResponse.json(
        { message: "Preferences not found" },
        { status: 404 }
      );
    }
    
    // Check if they're opting out of everything
    const optingOutCompletely = transactionalOnly === true;
    
    // Update preferences
    await db
      .update(emailPreferences)
      .set({
        marketingEmails: marketingEmails ?? false,
        reviewRequests: reviewRequests ?? false,
        referralEmails: referralEmails ?? false,
        serviceReminders: serviceReminders ?? false,
        transactionalOnly: transactionalOnly ?? false,
        updatedAt: new Date()
      })
      .where(eq(emailPreferences.id, existing.id));
    
    // If opting out completely, add to suppression list
    if (optingOutCompletely && existing.email) {
      await db
        .insert(emailSuppressionList)
        .values({
          email: existing.email.toLowerCase(),
          reason: 'unsubscribe',
          source: 'preference_center'
        })
        .onConflictDoNothing();
      
      console.log(`[Email Preferences] User ${existing.email} opted out of all emails`);
    }
    
    return NextResponse.json({ 
      success: true,
      message: optingOutCompletely 
        ? "You've been unsubscribed from all emails."
        : "Preferences updated successfully."
    });
  } catch (error: any) {
    console.error('[Email Preferences] Error updating preferences:', error);
    return NextResponse.json(
      { message: "Error updating preferences" },
      { status: 500 }
    );
  }
}
