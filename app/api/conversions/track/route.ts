import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { conversionEvents } from '@shared/schema';

export async function POST(req: NextRequest) {
  try {
    const { eventType, source, utm, metadata, customerId, email } = await req.json();
    
    if (!eventType || !['scheduler_open', 'phone_click', 'form_submission'].includes(eventType)) {
      return NextResponse.json(
        { error: "Invalid event type" },
        { status: 400 }
      );
    }

    const [event] = await db.insert(conversionEvents).values({
      eventType,
      source,
      utmSource: utm?.source,
      utmMedium: utm?.medium,
      utmCampaign: utm?.campaign,
      utmContent: utm?.content,
      metadata,
      customerId,
      email,
    }).returning();

    return NextResponse.json({ success: true, event });
  } catch (error: any) {
    console.error("Error tracking conversion:", error);
    return NextResponse.json(
      { error: "Failed to track conversion" },
      { status: 500 }
    );
  }
}
