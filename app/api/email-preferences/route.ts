/**
 * Public API - Email Preference Center
 * 
 * Manage email subscription preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { emailPreferences } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const preferencesSchema = z.object({
  token: z.string().uuid(),
  reviewRequests: z.boolean().optional(),
  referralNurture: z.boolean().optional(),
  quoteFollowup: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  transactionalOnly: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Find preferences by token
    const [prefs] = await db
      .select()
      .from(emailPreferences)
      .where(eq(emailPreferences.token, token));

    if (!prefs) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      preferences: {
        email: prefs.email,
        reviewRequests: prefs.reviewRequests,
        referralNurture: prefs.referralNurture,
        quoteFollowup: prefs.quoteFollowup,
        marketingEmails: prefs.marketingEmails,
        transactionalOnly: prefs.transactionalOnly,
      },
    });
  } catch (error) {
    console.error('[Email Preferences API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const result = preferencesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const { token, ...updates } = result.data;

    // Update preferences
    const [prefs] = await db
      .update(emailPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailPreferences.token, token))
      .returning();

    if (!prefs) {
      return NextResponse.json(
        { error: 'Preferences not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: prefs,
    });
  } catch (error) {
    console.error('[Email Preferences API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
