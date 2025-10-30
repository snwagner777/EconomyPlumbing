import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { generateReferrerSuccessEmail } from '@/server/lib/aiEmailGenerator';
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

    const { referralId, referrerName, refereeName, creditAmount, creditExpiresAt, currentBalance } = await req.json();

    if (!referralId || !referrerName || !refereeName || creditAmount === undefined || !creditExpiresAt) {
      return NextResponse.json({
        error: "Missing required fields: referralId, referrerName, refereeName, creditAmount, creditExpiresAt"
      }, { status: 400 });
    }

    // Get referral nurture phone number from settings
    const dbSettings = await db.select().from(systemSettings);
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
    const phoneNumber = settingsMap.get('referral_nurture_phone_number') || undefined;

    console.log(`[Referral Emails] Generating success email for ${referrerName}...`);
    
    const emailContent = await generateReferrerSuccessEmail({
      referrerName,
      refereeName,
      creditAmount: Number(creditAmount) / 100,
      creditExpiresAt: new Date(creditExpiresAt),
      currentBalance: currentBalance !== undefined ? Number(currentBalance) / 100 : undefined,
      phoneNumber
    });

    console.log(`[Referral Emails] Successfully generated: "${emailContent.subject}"`);
    
    // Add CAN-SPAM compliant unsubscribe footer for preview
    const baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'https://plumbersthatcare.com';
    const sampleUnsubscribeUrl = `${baseUrl}/email-preferences/sample-token-preview`;
    
    return NextResponse.json({
      subject: emailContent.subject,
      htmlContent: addUnsubscribeFooter(emailContent.bodyHtml, sampleUnsubscribeUrl),
      plainTextContent: addUnsubscribeFooterPlainText(emailContent.bodyPlain, sampleUnsubscribeUrl)
    });
  } catch (error: any) {
    console.error("[Referral Emails] Error generating success email:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate email' },
      { status: 500 }
    );
  }
}
