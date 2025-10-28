/**
 * Referral Click Tracking API
 * 
 * Tracks clicks on referral links for analytics
 * Logs to console for now (can be extended to database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const clickSchema = z.object({
  referralCode: z.string().optional(),
  referrerCustomerId: z.number().optional(),
  source: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = clickSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const referer = req.headers.get('referer') || 'direct';

    // Log click (TODO: Store in database if referralClicks table is created)
    console.log(`[Referral Click] ${data.referralCode || `customer ${data.referrerCustomerId}`}`, {
      ipAddress,
      userAgent,
      referer,
      source: data.source || 'unknown',
      utmSource: data.utmSource,
      utmMedium: data.utmMedium,
      utmCampaign: data.utmCampaign,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('[Referral Click API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
