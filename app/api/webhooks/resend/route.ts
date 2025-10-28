/**
 * Resend Webhook Handler - Email Engagement Tracking
 * 
 * Handles email events: delivered, opened, clicked, bounced, complained
 * Updates emailSendLog and campaign engagement counters
 * Manages emailSuppressionList for CAN-SPAM compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { storage } from '@/server/storage';

const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    if (!webhookSecret) {
      console.error('[Resend Webhook] RESEND_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    // Get raw body and headers for signature verification
    const body = await req.text();
    const svixId = req.headers.get('svix-id');
    const svixTimestamp = req.headers.get('svix-timestamp');
    const svixSignature = req.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      console.error('[Resend Webhook] Missing required headers');
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    // Verify webhook signature with Svix
    const wh = new Webhook(webhookSecret);
    let event: any;

    try {
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err: any) {
      console.error('[Resend Webhook] Signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('[Resend Webhook] Event received:', event.type);

    const emailId = event.data.email_id;
    const emailAddress = event.data.to?.[0] || event.data.email;

    // Handle different event types
    switch (event.type) {
      case 'email.sent':
        await handleEmailSent(emailId, emailAddress, event.data);
        break;
      
      case 'email.delivered':
        await handleEmailDelivered(emailId);
        break;
      
      case 'email.opened':
        await handleEmailOpened(emailId);
        break;
      
      case 'email.clicked':
        await handleEmailClicked(emailId, event.data.click?.link);
        break;
      
      case 'email.bounced':
        await handleEmailBounced(emailId, emailAddress, event.data.bounce?.type);
        break;
      
      case 'email.complained':
        await handleEmailComplained(emailId, emailAddress);
        break;
      
      default:
        console.log(`[Resend Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleEmailSent(emailId: string, emailAddress: string, data: any) {
  console.log('[Resend] Email sent:', emailId);
  
  // Log email send
  await storage.logEmailSend({
    emailId,
    recipientEmail: emailAddress,
    subject: data.subject,
    campaignType: data.tags?.campaignType || 'unknown',
    sentAt: new Date(),
  });
}

async function handleEmailDelivered(emailId: string) {
  console.log('[Resend] Email delivered:', emailId);
  
  // Update delivery timestamp
  await storage.updateEmailLog(emailId, {
    deliveredAt: new Date(),
  });
}

async function handleEmailOpened(emailId: string) {
  console.log('[Resend] Email opened:', emailId);
  
  // Update opened timestamp
  const emailLog = await storage.getEmailLogByEmailId(emailId);
  
  if (!emailLog) {
    console.error('[Resend] Email log not found:', emailId);
    return;
  }

  await storage.updateEmailLog(emailId, {
    openedAt: new Date(),
  });

  // Update campaign engagement counters
  if (emailLog.campaignId) {
    await storage.incrementCampaignEngagement(
      emailLog.campaignId,
      emailLog.campaignType,
      'opened'
    );
  }
}

async function handleEmailClicked(emailId: string, link?: string) {
  console.log('[Resend] Email clicked:', emailId, link);
  
  // Update clicked timestamp
  const emailLog = await storage.getEmailLogByEmailId(emailId);
  
  if (!emailLog) {
    console.error('[Resend] Email log not found:', emailId);
    return;
  }

  await storage.updateEmailLog(emailId, {
    clickedAt: new Date(),
  });

  // Update campaign engagement counters
  if (emailLog.campaignId) {
    await storage.incrementCampaignEngagement(
      emailLog.campaignId,
      emailLog.campaignType,
      'clicked'
    );
  }
}

async function handleEmailBounced(emailId: string, emailAddress: string, bounceType?: string) {
  console.log('[Resend] Email bounced:', emailId, bounceType);
  
  // Update bounced timestamp
  await storage.updateEmailLog(emailId, {
    bouncedAt: new Date(),
  });

  // For hard bounces, add to suppression list
  if (bounceType === 'hard') {
    await storage.addToSuppressionList({
      email: emailAddress,
      reason: 'hard_bounce',
      source: 'resend_webhook',
    });
    
    console.log('[Resend] Added to suppression list (hard bounce):', emailAddress);
  }
}

async function handleEmailComplained(emailId: string, emailAddress: string) {
  console.log('[Resend] Spam complaint:', emailId);
  
  // Update complained timestamp
  await storage.updateEmailLog(emailId, {
    complainedAt: new Date(),
  });

  // Add to suppression list (CAN-SPAM compliance)
  await storage.addToSuppressionList({
    email: emailAddress,
    reason: 'spam_complaint',
    source: 'resend_webhook',
  });

  console.log('[Resend] Added to suppression list (spam complaint):', emailAddress);
}
