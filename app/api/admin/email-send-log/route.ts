import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { referrerThankYouEmails, referrerSuccessEmails, emailSendLog } from '@shared/schema';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    if (type === 'referral') {
      // Fetch from referrer-specific tables
      // Get thank you emails
      const thankYouEmails = await db.select({
        id: referrerThankYouEmails.id,
        emailType: referrerThankYouEmails.id, // dummy, will override below
        recipientEmail: referrerThankYouEmails.referrerEmail,
        recipientName: referrerThankYouEmails.referrerName,
        subject: referrerThankYouEmails.subject,
        sentAt: referrerThankYouEmails.sentAt,
      })
        .from(referrerThankYouEmails)
        .orderBy(desc(referrerThankYouEmails.sentAt))
        .limit(50);
      
      // Get success emails
      const successEmails = await db.select({
        id: referrerSuccessEmails.id,
        emailType: referrerSuccessEmails.id, // dummy, will override below
        recipientEmail: referrerSuccessEmails.referrerEmail,
        recipientName: referrerSuccessEmails.referrerName,
        subject: referrerSuccessEmails.subject,
        sentAt: referrerSuccessEmails.sentAt,
      })
        .from(referrerSuccessEmails)
        .orderBy(desc(referrerSuccessEmails.sentAt))
        .limit(50);
      
      // Combine and format
      const allEmails = [
        ...thankYouEmails.map(e => ({ ...e, emailType: 'referrer_thank_you' })),
        ...successEmails.map(e => ({ ...e, emailType: 'referrer_success' }))
      ]
        .sort((a, b) => {
          const dateA = a.sentAt ? new Date(a.sentAt).getTime() : 0;
          const dateB = b.sentAt ? new Date(b.sentAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 100);
      
      return NextResponse.json({ emails: allEmails, total: allEmails.length });
    }
    
    // Default: Fetch from email_send_log
    const allEmails = await db
      .select()
      .from(emailSendLog)
      .orderBy(desc(emailSendLog.sentAt))
      .limit(100);
    
    return NextResponse.json({ emails: allEmails, total: allEmails.length });
  } catch (error: any) {
    console.error("[Email Send Log] Error fetching logs:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
