/**
 * Admin API - Review Request Campaigns
 * 
 * Manage review request email campaigns
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const campaigns = status
      ? await storage.getReviewRequestsByStatus(status)
      : await storage.getActiveReviewRequests();

    return NextResponse.json({
      campaigns,
      count: campaigns.length,
    });
  } catch (error) {
    console.error('[Admin Review Requests API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}
