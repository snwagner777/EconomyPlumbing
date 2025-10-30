import { NextRequest, NextResponse } from 'next/server';
import { sendSMS } from '@/server/lib/sms';

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();
    
    if (!to) {
      return NextResponse.json(
        { error: "Phone number required" },
        { status: 400 }
      );
    }
    
    const testMessage = message || "Test message from Economy Plumbing Services - Zoom Phone SMS integration is working! 🎉";
    
    await sendSMS({ to, message: testMessage });
    
    return NextResponse.json({ success: true, message: "SMS sent successfully" });
  } catch (error: any) {
    console.error("[Test SMS] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send SMS" },
      { status: 500 }
    );
  }
}
