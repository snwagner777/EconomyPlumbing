/**
 * SimpleTexting Unsubscribe Webhook Handler
 * 
 * POST: Receive unsubscribe events from SimpleTexting
 * 
 * SimpleTexting Webhook Format:
 * {
 *   "phone": "9545551234"  // Numeric digits only, no formatting
 * }
 * 
 * Triggers when:
 * - Contact replies with STOP/CANCEL/UNSUBSCRIBE/END/QUIT
 * - Contact is manually unsubscribed in SimpleTexting UI
 * 
 * SimpleTexting automatically handles STOP keywords.
 * This webhook syncs opt-out status to our database for TCPA compliance tracking.
 * 
 * Setup: Configure webhook URL in SimpleTexting > API > Webhooks tab
 * URL: https://yourdomain.com/api/webhooks/sms
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { smsContacts } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface SimpleTextingUnsubscribeWebhook {
  phone: string; // Phone number (numeric only, e.g., "9545551234")
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SimpleTextingUnsubscribeWebhook;
    
    console.log('[SMS Webhook] Unsubscribe event received:', body);

    const phone = body.phone;
    if (!phone) {
      console.warn('[SMS Webhook] No phone number in webhook payload');
      return NextResponse.json({ success: true, note: 'No phone to process' });
    }

    // Update contact to opted-out status
    const result = await db
      .update(smsContacts)
      .set({
        optedOut: true,
        optedOutAt: new Date(),
        optOutMethod: 'keyword_reply',
        updatedAt: new Date(),
      })
      .where(eq(smsContacts.phone, phone))
      .returning();

    if (result.length === 0) {
      console.warn('[SMS Webhook] Contact not found for phone:', phone);
      // Still return 200 to acknowledge webhook
      return NextResponse.json({
        success: true,
        message: 'Contact not found in database',
        phone,
      });
    }

    console.log('[SMS Webhook] Contact opted out successfully:', phone);

    return NextResponse.json({
      success: true,
      message: 'Contact opted out successfully',
      phone,
    });
  } catch (error) {
    console.error('[SMS Webhook] Error processing webhook:', error);
    
    // Return 200 to prevent SimpleTexting from retrying
    // Log the error internally instead
    return NextResponse.json({ 
      success: false, 
      error: 'Internal error' 
    }, { status: 200 });
  }
}
