import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { upsertCampaignPhoneNumber } from '@/server/lib/trackingPhoneNumbers';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const { cleaned, formatted } = await upsertCampaignPhoneNumber(
      'review_request',
      'Review Request Emails',
      phoneNumber,
      {
        utm_source: 'review_request',
        utm_medium: 'email',
        utm_campaign: 'review_drip',
        description: 'Automatically created for review request email campaigns'
      },
      100
    );

    return NextResponse.json({
      success: true,
      phoneNumber: cleaned,
      phoneFormatted: formatted,
      message: "Phone number updated and tracking number created with UTM parameters"
    });
  } catch (error: any) {
    console.error("[Review Requests] Error updating phone number:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
