/**
 * Public API - One-Click Unsubscribe
 * 
 * Handle one-click unsubscribe from all marketing emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { emailPreferences, emailSuppressionList } from '@shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Find preferences
    const [prefs] = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.token, token));

    if (!prefs) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Set transactional only (unsubscribe from all marketing)
    await db
      .update(emailPreferences)
      .set({
        reviewRequests: false,
        referralNurture: false,
        quoteFollowup: false,
        marketingEmails: false,
        transactionalOnly: true,
        updatedAt: new Date(),
      })
      .where(eq(emailPreferences.token, token));

    return NextResponse.json({
      success: true,
      message: 'You have been unsubscribed from marketing emails',
    });
  } catch (error) {
    console.error('[Unsubscribe API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Support GET for email client compatibility
  return POST(req);
}
