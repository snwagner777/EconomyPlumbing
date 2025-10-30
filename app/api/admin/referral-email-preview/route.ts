import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { generateReferrerThankYouEmail, generateReferrerSuccessEmail } from '@/server/lib/aiEmailGenerator';
import { addUnsubscribeFooter, addUnsubscribeFooterPlainText } from '@/server/lib/emailPreferenceEnforcer';
import { db } from '@/server/db';
import { systemSettings } from '@shared/schema';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { emailType, customPrompt, brandGuidelines } = await req.json();
    
    if (!emailType || !['thank_you', 'success'].includes(emailType)) {
      return NextResponse.json(
        { error: "Invalid emailType. Must be 'thank_you' or 'success'" },
        { status: 400 }
      );
    }
    
    // Get tracking phone numbers from database
    const dbSettings = await db.select().from(systemSettings);
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
    
    // Use sample data for preview (with {{trackingNumber}} placeholder)
    let emailContent;
    if (emailType === 'thank_you') {
      emailContent = await generateReferrerThankYouEmail({
        referrerName: 'John Smith',
        refereeName: 'Jane Doe',
      }, customPrompt, brandGuidelines);
      
      // Replace {{trackingNumber}} with actual tracking phone number from admin panel
      const trackingPhoneNumber = settingsMap.get('referral_nurture_phone_formatted');
      if (!trackingPhoneNumber) {
        throw new Error('Referral Nurture tracking phone number not configured in admin panel. Please configure it in Marketing Automation settings before previewing referral emails.');
      }
      emailContent.bodyHtml = emailContent.bodyHtml.replace(/\{\{trackingNumber\}\}/g, trackingPhoneNumber);
      emailContent.bodyPlain = emailContent.bodyPlain.replace(/\{\{trackingNumber\}\}/g, trackingPhoneNumber);
    } else {
      emailContent = await generateReferrerSuccessEmail({
        referrerName: 'John Smith',
        refereeName: 'Jane Doe',
        creditAmount: 25,
        creditExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        currentBalance: 75,
      }, customPrompt, brandGuidelines);
      
      // Replace {{trackingNumber}} with actual tracking phone number from admin panel
      const trackingPhoneNumber = settingsMap.get('referral_nurture_phone_formatted');
      if (!trackingPhoneNumber) {
        throw new Error('Referral Nurture tracking phone number not configured in admin panel. Please configure it in Marketing Automation settings before previewing referral emails.');
      }
      emailContent.bodyHtml = emailContent.bodyHtml.replace(/\{\{trackingNumber\}\}/g, trackingPhoneNumber);
      emailContent.bodyPlain = emailContent.bodyPlain.replace(/\{\{trackingNumber\}\}/g, trackingPhoneNumber);
    }
    
    // Add CAN-SPAM compliant unsubscribe footer to preview
    const baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'https://plumbersthatcare.com';
    const sampleUnsubscribeUrl = `${baseUrl}/email-preferences/sample-token-preview`;
    
    const htmlWithFooter = addUnsubscribeFooter(emailContent.bodyHtml, sampleUnsubscribeUrl);
    const plainWithFooter = addUnsubscribeFooterPlainText(emailContent.bodyPlain, sampleUnsubscribeUrl);
    
    return NextResponse.json({
      subject: emailContent.subject,
      bodyHtml: htmlWithFooter,
      bodyPlain: plainWithFooter,
    });
  } catch (error: any) {
    console.error("[Referral Email Preview] Error generating preview:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
