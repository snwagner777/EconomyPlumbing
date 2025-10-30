import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { generateEmail } from '@/server/lib/aiEmailGenerator';
import { addUnsubscribeFooter, addUnsubscribeFooterPlainText } from '@/server/lib/emailPreferenceEnforcer';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { campaignType, emailNumber, jobDetails, phoneNumber, referralLink, strategy } = await req.json();

    // Validate required fields
    if (!campaignType || !emailNumber || !jobDetails) {
      return NextResponse.json({
        error: "Missing required fields: campaignType, emailNumber, jobDetails"
      }, { status: 400 });
    }

    // Validate campaign type
    if (!['review_request', 'referral_nurture', 'quote_followup'].includes(campaignType)) {
      return NextResponse.json({
        error: "Invalid campaignType. Must be 'review_request', 'referral_nurture', or 'quote_followup'"
      }, { status: 400 });
    }

    // Validate email number
    if (![1, 2, 3, 4].includes(emailNumber)) {
      return NextResponse.json({
        error: "Invalid emailNumber. Must be 1, 2, 3, or 4"
      }, { status: 400 });
    }

    console.log(`[AI Email Generator] Generating ${campaignType} email #${emailNumber}...`);
    
    const generatedEmail = await generateEmail({
      campaignType,
      emailNumber,
      jobDetails,
      phoneNumber,
      referralLink,
      strategy
    });

    console.log(`[AI Email Generator] Successfully generated email: "${generatedEmail.subject}"`);
    
    // Add CAN-SPAM compliant unsubscribe footer for preview
    const baseUrl = process.env.REPL_SLUG 
      ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
      : 'https://plumbersthatcare.com';
    const sampleUnsubscribeUrl = `${baseUrl}/email-preferences/sample-token-preview`;
    
    // Map field names: AI returns bodyHtml/bodyPlain, frontend expects htmlContent/plainTextContent
    return NextResponse.json({
      subject: generatedEmail.subject,
      preheader: generatedEmail.preheader,
      htmlContent: addUnsubscribeFooter(generatedEmail.bodyHtml, sampleUnsubscribeUrl),
      plainTextContent: addUnsubscribeFooterPlainText(generatedEmail.bodyPlain, sampleUnsubscribeUrl),
      strategy: generatedEmail.strategy,
      seasonalContext: generatedEmail.seasonalContext
    });
  } catch (error: any) {
    console.error("[AI Email Generator] Error:", error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate email' },
      { status: 500 }
    );
  }
}
