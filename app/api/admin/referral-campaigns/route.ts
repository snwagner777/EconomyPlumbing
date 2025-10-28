/**
 * Admin API - Referral Nurture Campaigns
 * 
 * Manage 6-month referral nurture email campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await storage.getActiveReferralCampaigns();

    return NextResponse.json({
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('[Admin Referral Campaigns API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const campaign = await storage.createReferralNurture(data);

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('[Admin Referral Campaigns API] Error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
