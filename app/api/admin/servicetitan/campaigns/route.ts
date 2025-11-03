/**
 * ServiceTitan Campaigns API
 * 
 * Syncs campaigns from ServiceTitan and provides campaign list for admin mapping.
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanSettings } from '@/server/lib/servicetitan/settings';

export async function GET(req: NextRequest) {
  try {
    // Fetch all active campaigns from ServiceTitan
    const campaigns = await serviceTitanSettings.getCampaigns();
    
    return NextResponse.json({
      success: true,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        number: c.number,
        status: c.status,
        channel: c.channel,
        source: c.source,
        externalId: c.externalId,
      })),
    });
  } catch (error: any) {
    console.error('[ServiceTitan Campaigns API] Error fetching campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch ServiceTitan campaigns',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Force refresh campaigns cache
    serviceTitanSettings.clearCache();
    const campaigns = await serviceTitanSettings.getCampaigns();
    
    return NextResponse.json({
      success: true,
      message: `Refreshed ${campaigns.length} campaigns from ServiceTitan`,
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        number: c.number,
        status: c.status,
        channel: c.channel,
        source: c.source,
      })),
    });
  } catch (error: any) {
    console.error('[ServiceTitan Campaigns API] Error refreshing campaigns:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to refresh ServiceTitan campaigns',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
