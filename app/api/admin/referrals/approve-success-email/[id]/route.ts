import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { referrerSuccessEmails, systemSettings } from '@shared/schema';
import { getResendClient } from '@/server/lib/resendClient';
import { canSendEmail, addUnsubscribeFooter, addUnsubscribeFooterPlainText } from '@/server/lib/emailPreferenceEnforcer';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { db } = await import('@/server/db');
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get the email record
    const [email] = await db
      .select()
      .from(referrerSuccessEmails)
      .where(eq(referrerSuccessEmails.id, id));

    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    if (email.status !== 'queued') {
      return NextResponse.json(
        { error: "Email already processed" },
        { status: 400 }
      );
    }

    // Check master email switch
    const dbSettings = await db.select().from(systemSettings);
    const settingsMap = new Map(dbSettings.map(s => [s.key, s.value]));
    const masterEmailEnabled = settingsMap.get('review_master_email_switch') === 'true';
    
    if (!masterEmailEnabled) {
      return NextResponse.json({ 
        error: "Master email switch is disabled. Enable it in Marketing Settings to send emails." 
      }, { status: 400 });
    }

    // Check email preferences
    const prefCheck = await canSendEmail(email.referrerEmail, { type: 'referral' });
    if (!prefCheck.canSend) {
      await db
        .update(referrerSuccessEmails)
        .set({
          status: 'failed',
          failureReason: `Cannot send: ${prefCheck.reason}`,
        })
        .where(eq(referrerSuccessEmails.id, id));

      return NextResponse.json(
        { error: prefCheck.reason },
        { status: 400 }
      );
    }

    // Add unsubscribe footer
    const htmlWithFooter = addUnsubscribeFooter(email.htmlContent, prefCheck.unsubscribeUrl!);
    const plainWithFooter = addUnsubscribeFooterPlainText(email.plainTextContent, prefCheck.unsubscribeUrl!);

    // Send email
    console.log(`[Referral Emails] Sending success email to ${email.referrerEmail}...`);
    
    const { client, fromEmail } = await getResendClient();
    await client.emails.send({
      from: fromEmail,
      to: email.referrerEmail,
      subject: email.subject,
      html: htmlWithFooter,
      text: plainWithFooter,
    });

    // Mark as approved and sent
    await db
      .update(referrerSuccessEmails)
      .set({
        status: 'sent',
        approvedAt: new Date(),
        approvedBy: 'admin',
        sentAt: new Date(),
      })
      .where(eq(referrerSuccessEmails.id, id));

    console.log(`[Referral Emails] Success email sent successfully to ${email.referrerEmail}`);
    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error: any) {
    console.error("[Referral Emails] Error sending success email:", error);
    
    // Update email status to failed
    try {
      const { id } = await params;
      await db
        .update(referrerSuccessEmails)
        .set({
          status: 'failed',
          failureReason: error.message,
        })
        .where(eq(referrerSuccessEmails.id, id));
    } catch (dbError) {
      console.error("[Referral Emails] Failed to update email status:", dbError);
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
