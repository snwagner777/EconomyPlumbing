/**
 * Email Preference Enforcer
 * 
 * Checks email preferences before sending and adds unsubscribe links/headers.
 * Ensures CAN-SPAM compliance for all outgoing emails.
 */

import { db } from '../db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

interface EmailCategory {
  type: 'marketing' | 'review' | 'referral' | 'service_reminder' | 'transactional';
}

interface UnsubscribeInfo {
  canSend: boolean;
  reason?: string;
  unsubscribeUrl?: string;
  listUnsubscribeHeader?: string;
  token?: string;
}

/**
 * Check if we can send an email to a recipient based on their preferences
 */
export async function canSendEmail(
  email: string,
  category: EmailCategory,
  customerId?: number
): Promise<UnsubscribeInfo> {
  const { emailPreferences } = await import('@shared/schema');
  
  // Get or create preferences
  const prefs = await getOrCreateEmailPreferences(email, customerId);
  
  // Transactional emails always go through
  if (category.type === 'transactional') {
    return {
      canSend: true,
      unsubscribeUrl: `${getBaseUrl()}/email-preferences/${prefs.unsubscribeToken}`,
      listUnsubscribeHeader: `<${getBaseUrl()}/email-preferences/${prefs.unsubscribeToken}>`,
      token: prefs.unsubscribeToken,
    };
  }
  
  // Check if they've opted out of everything
  if (prefs.transactionalOnly) {
    return {
      canSend: false,
      reason: 'Recipient has unsubscribed from all non-transactional emails',
    };
  }
  
  // Check specific category preferences
  let canSend = true;
  let reason = '';
  
  switch (category.type) {
    case 'marketing':
      canSend = prefs.marketingEmails;
      reason = 'Recipient has opted out of marketing emails';
      break;
    case 'review':
      canSend = prefs.reviewRequests;
      reason = 'Recipient has opted out of review requests';
      break;
    case 'referral':
      canSend = prefs.referralEmails;
      reason = 'Recipient has opted out of referral emails';
      break;
    case 'service_reminder':
      canSend = prefs.serviceReminders;
      reason = 'Recipient has opted out of service reminders';
      break;
  }
  
  if (!canSend) {
    return { canSend: false, reason };
  }
  
  // Generate unsubscribe URLs and headers
  const unsubscribeUrl = `${getBaseUrl()}/email-preferences/${prefs.unsubscribeToken}`;
  const listUnsubscribeHeader = `<${unsubscribeUrl}>`;
  
  return {
    canSend: true,
    unsubscribeUrl,
    listUnsubscribeHeader,
    token: prefs.unsubscribeToken,
  };
}

/**
 * Get or create email preferences for an email address
 */
async function getOrCreateEmailPreferences(email: string, customerId?: number): Promise<any> {
  const { emailPreferences } = await import('@shared/schema');
  
  // Try to find existing preferences
  const [existing] = await db
    .select()
    .from(emailPreferences)
    .where(sql`${emailPreferences.email} = ${email.toLowerCase()}`)
    .limit(1);
  
  if (existing) {
    return existing;
  }
  
  // Create new preferences with unique token
  const token = crypto.randomBytes(32).toString('hex');
  
  const [created] = await db.insert(emailPreferences).values({
    email: email.toLowerCase(),
    customerId: customerId || null,
    unsubscribeToken: token,
    marketingEmails: true,
    reviewRequests: true,
    referralEmails: true,
    serviceReminders: true,
    transactionalOnly: false,
  }).returning();
  
  return created;
}

/**
 * Add unsubscribe footer to HTML email
 */
export function addUnsubscribeFooter(htmlBody: string, unsubscribeUrl: string): string {
  const footer = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p style="margin: 0 0 8px 0;">
        You're receiving this email because you're a valued customer of Economy Plumbing Services.
      </p>
      <p style="margin: 0;">
        <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: underline;">Manage your email preferences</a> or 
        <a href="${unsubscribeUrl}" style="color: #3b82f6; text-decoration: underline;">unsubscribe</a>
      </p>
      <p style="margin: 8px 0 0 0; font-size: 11px;">
        Economy Plumbing Services | Serving Austin & Central Texas<br/>
        © ${new Date().getFullYear()} All rights reserved
      </p>
    </div>
  `;
  
  // Insert footer before closing </body> tag or at the end
  if (htmlBody.includes('</body>')) {
    return htmlBody.replace('</body>', `${footer}</body>`);
  }
  
  return htmlBody + footer;
}

/**
 * Add unsubscribe footer to plain text email
 */
export function addUnsubscribeFooterPlainText(plainText: string, unsubscribeUrl: string): string {
  const footer = `

---
You're receiving this email because you're a valued customer of Economy Plumbing Services.

Manage your email preferences: ${unsubscribeUrl}
Unsubscribe: ${unsubscribeUrl}

Economy Plumbing Services | Serving Austin & Central Texas
© ${new Date().getFullYear()} All rights reserved
`;
  
  return plainText + footer;
}

/**
 * Get base URL for unsubscribe links
 */
function getBaseUrl(): string {
  // Production URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://economyplumbingtx.com';
  }
  
  // Development - use replit.dev domain if available
  const replitDomain = process.env.REPLIT_DEV_DOMAIN;
  if (replitDomain) {
    return `https://${replitDomain}`;
  }
  
  // Fallback to localhost
  return 'http://localhost:5000';
}
