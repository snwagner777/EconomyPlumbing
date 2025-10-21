import { Resend } from 'resend';
import type { ResendConnectionSettings, ResendCredentials } from './types/resend';

let connectionSettings: ResendConnectionSettings | undefined;

async function getCredentials(): Promise<ResendCredentials> {
  console.log('[Email Debug] Getting Resend credentials...');
  
  // Try Replit Connector first
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  console.log('[Email Debug] Connector hostname:', hostname ? 'set' : 'NOT SET');
  console.log('[Email Debug] REPL_IDENTITY:', process.env.REPL_IDENTITY ? 'set' : 'NOT SET');
  console.log('[Email Debug] WEB_REPL_RENEWAL:', process.env.WEB_REPL_RENEWAL ? 'set' : 'NOT SET');

  // Try connector if available
  if (xReplitToken && hostname) {
    try {
      const response = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      );
      
      const data: ResendConnectionSettings = await response.json();
      connectionSettings = data;

      const settings = data.items?.[0]?.settings;
      
      console.log('[Email Debug] Connector settings retrieved:', settings ? 'yes' : 'NO');
      console.log('[Email Debug] Connector API key exists:', settings?.api_key ? 'yes' : 'NO');
      console.log('[Email Debug] Connector from email:', settings?.from_email || 'NOT SET');

      if (settings?.api_key && settings?.from_email) {
        console.log('[Email] Using Replit Connector credentials');
        return {
          apiKey: settings.api_key, 
          fromEmail: settings.from_email
        };
      } else {
        console.warn('[Email] Connector available but not configured, falling back to environment secrets');
      }
    } catch (error) {
      console.warn('[Email] Connector fetch failed, falling back to environment secrets:', error);
    }
  } else {
    console.log('[Email Debug] Connector not available, using environment secrets');
  }

  // Fallback to environment secrets
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  
  console.log('[Email Debug] Env RESEND_API_KEY:', apiKey ? 'set' : 'NOT SET');
  console.log('[Email Debug] Env RESEND_FROM_EMAIL:', fromEmail || 'NOT SET');

  if (!apiKey || !fromEmail) {
    console.error('[Email Error] Neither Replit Connector nor environment secrets are configured');
    throw new Error('Resend not configured: Please set up Resend connector or provide RESEND_API_KEY and RESEND_FROM_EMAIL environment secrets');
  }
  
  console.log('[Email] Using environment secret credentials');
  return {
    apiKey, 
    fromEmail
  };
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}) {
  console.log('[Email] Sending generic email to:', params.to);
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const result = await client.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
      tags: params.tags
    });
    
    console.log('[Email] Email sent successfully with ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('[Email] Failed to send email:', error);
    throw error;
  }
}

// Send a tracked campaign email and log it to the database
export async function sendCampaignEmail(params: {
  campaignId: string;
  campaignEmailId: string;
  serviceTitanCustomerId: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  html: string;
  mergeTagData: Record<string, any>;
}) {
  console.log('[Email] Sending campaign email to:', params.recipientEmail);
  
  try {
    // Check suppression list first
    const { db } = await import('./db');
    const { emailSuppressionList, emailSendLog, campaignEmails } = await import('@shared/schema');
    const { eq, sql } = await import('drizzle-orm');
    
    const suppressedEmail = await db.query.emailSuppressionList.findFirst({
      where: eq(emailSuppressionList.email, params.recipientEmail),
    });
    
    if (suppressedEmail) {
      console.warn('[Email] Email suppressed:', params.recipientEmail, 'Reason:', suppressedEmail.reason);
      throw new Error(`Email address is suppressed: ${suppressedEmail.reason}`);
    }
    
    const { client, fromEmail } = await getUncachableResendClient();
    
    // Send email with campaign tags for tracking
    const result = await client.emails.send({
      from: fromEmail,
      to: params.recipientEmail,
      subject: params.subject,
      html: params.html,
      tags: [
        { name: 'campaign_id', value: params.campaignId },
        { name: 'campaign_email_id', value: params.campaignEmailId },
        { name: 'customer_id', value: params.serviceTitanCustomerId.toString() }
      ]
    });
    
    if (!result.data?.id) {
      throw new Error('No email ID returned from Resend');
    }
    
    // Log the email send to database
    
    await db.insert(emailSendLog).values({
      campaignId: params.campaignId,
      campaignEmailId: params.campaignEmailId,
      serviceTitanCustomerId: params.serviceTitanCustomerId,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      mergeTagData: params.mergeTagData,
      resendEmailId: result.data.id,
      resendStatus: 'queued',
      sentAt: new Date(),
    });
    
    // Update campaign email sent count
    await db.update(campaignEmails)
      .set({ totalSent: sql`${campaignEmails.totalSent} + 1` })
      .where(sql`${campaignEmails.id} = ${params.campaignEmailId}`);
    
    console.log('[Email] Campaign email sent and logged with ID:', result.data.id);
    return result;
  } catch (error) {
    console.error('[Email] Failed to send campaign email:', error);
    throw error;
  }
}

export async function sendContactFormEmail(data: {
  name: string;
  phone: string;
  email?: string;
  service?: string;
  location?: string;
  urgency?: string;
  message?: string;
  pageContext?: string;
}) {
  console.log('[Email] Starting sendContactFormEmail for:', data.name);
  
  try {
    console.log('[Email] Getting Resend client...');
    const { client, fromEmail } = await getUncachableResendClient();
    const contactEmail = process.env.CONTACT_EMAIL;

    console.log('[Email] From email:', fromEmail || 'NOT SET');
    console.log('[Email] To email (CONTACT_EMAIL):', contactEmail || 'NOT SET');

    if (!contactEmail) {
      console.error('[Email Error] CONTACT_EMAIL not configured');
      throw new Error('CONTACT_EMAIL not configured');
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">New Contact Form Submission</h2>
        ${data.pageContext ? `<p><strong>Submitted from:</strong> ${data.pageContext}</p>` : ''}
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Contact Information</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
        </div>

        ${data.service || data.location || data.urgency ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Service Details</h3>
          ${data.service ? `<p><strong>Service Needed:</strong> ${data.service}</p>` : ''}
          ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ''}
          ${data.urgency ? `<p><strong>Urgency:</strong> ${data.urgency}</p>` : ''}
        </div>
        ` : ''}

        ${data.message ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Message</h3>
          <p style="white-space: pre-wrap;">${data.message}</p>
        </div>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This message was sent from the Economy Plumbing Services website contact form.
        </p>
      </div>
    `;

    console.log('[Email] Attempting to send contact form email...');
    console.log('[Email] Subject:', `New Contact: ${data.name} - ${data.service || 'Inquiry'}`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `New Contact: ${data.name} - ${data.service || 'Inquiry'}`,
      html: emailHtml,
    });

    console.log('[Email] ✓ Email sent successfully! Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[Email Error] ✗ Failed to send email:', error);
    console.error('[Email Error] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function sendReferralEmail(data: {
  referrerName: string;
  referrerPhone: string;
  refereeName: string;
  refereePhone: string;
  refereeEmail?: string;
}) {
  console.log('[Email] Starting sendReferralEmail for:', data.refereeName);
  
  try {
    console.log('[Email] Getting Resend client...');
    const { client, fromEmail } = await getUncachableResendClient();
    const contactEmail = process.env.CONTACT_EMAIL;

    console.log('[Email] From email:', fromEmail || 'NOT SET');
    console.log('[Email] To email (CONTACT_EMAIL):', contactEmail || 'NOT SET');

    if (!contactEmail) {
      console.error('[Email Error] CONTACT_EMAIL not configured');
      throw new Error('CONTACT_EMAIL not configured');
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">New Referral Submission</h2>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0ea5e9;">Referrer Information</h3>
          <p><strong>Name:</strong> ${data.referrerName}</p>
          <p><strong>Phone:</strong> ${data.referrerPhone}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">New Customer (Referee) Information</h3>
          <p><strong>Name:</strong> ${data.refereeName}</p>
          <p><strong>Phone:</strong> ${data.refereePhone}</p>
          ${data.refereeEmail ? `<p><strong>Email:</strong> ${data.refereeEmail}</p>` : ''}
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <h3 style="margin-top: 0; color: #f59e0b;">Action Required</h3>
          <p>Contact <strong>${data.refereeName}</strong> and offer them:</p>
          <ul>
            <li>$25 off their first service (minimum $200 job)</li>
            <li>Priority scheduling</li>
          </ul>
          <p>After they complete their first service, apply a $25 credit to <strong>${data.referrerName}</strong>'s account.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This referral was submitted from the Economy Plumbing Services website.
        </p>
      </div>
    `;

    console.log('[Email] Attempting to send referral email...');
    console.log('[Email] Subject:', `New Referral: ${data.refereeName} (from ${data.referrerName})`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `New Referral: ${data.refereeName} (from ${data.referrerName})`,
      html: emailHtml,
    });

    console.log('[Email] ✓ Referral email sent successfully! Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[Email Error] ✗ Failed to send referral email:', error);
    console.error('[Email Error] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function sendReviewRequestEmail(data: {
  to: string;
  customerName: string;
  subject: string;
  body: string;
}) {
  console.log('[Email] Sending review request to:', data.to);
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">How was your service?</h2>
        <div style="white-space: pre-wrap; line-height: 1.6;">
          ${data.body.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This message was sent from Economy Plumbing Services.
        </p>
      </div>
    `;
    
    const result = await client.emails.send({
      from: fromEmail,
      to: data.to,
      subject: data.subject,
      html: emailHtml,
    });
    
    console.log('[Email] Review request email sent successfully');
    return result;
  } catch (error) {
    console.error('[Email] Failed to send review request email:', error);
    throw error;
  }
}

export async function sendSalesNotificationEmail(data: {
  productName: string;
  productPrice: number;
  customerType: 'residential' | 'commercial';
  customerName?: string;
  companyName?: string;
  contactPersonName?: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  stripePaymentIntentId: string;
}) {
  console.log('[Email] Starting sendSalesNotificationEmail for product:', data.productName);
  
  try {
    console.log('[Email] Getting Resend client...');
    const { client, fromEmail } = await getUncachableResendClient();
    const contactEmail = process.env.CONTACT_EMAIL;

    console.log('[Email] From email:', fromEmail || 'NOT SET');
    console.log('[Email] To email (CONTACT_EMAIL):', contactEmail || 'NOT SET');

    if (!contactEmail) {
      console.error('[Email Error] CONTACT_EMAIL not configured');
      throw new Error('CONTACT_EMAIL not configured');
    }

    const customerDisplayName = data.customerType === 'residential' 
      ? data.customerName 
      : `${data.companyName} (Contact: ${data.contactPersonName})`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">🎉 New Sale!</h2>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="margin-top: 0; color: #0369a1;">Product Purchased</h3>
          <p style="font-size: 18px; margin: 10px 0;"><strong>${data.productName}</strong></p>
          <p style="font-size: 20px; color: #0ea5e9; margin: 10px 0;"><strong>$${(data.productPrice / 100).toFixed(2)}</strong></p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Type:</strong> ${data.customerType === 'residential' ? 'Residential' : 'Commercial'}</p>
          <p><strong>Name:</strong> ${customerDisplayName}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Address:</strong> ${data.street}, ${data.city}, ${data.state} ${data.zip}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <p><strong>Payment Intent ID:</strong> ${data.stripePaymentIntentId}</p>
          <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">✓ Paid</span></p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This is an automated notification from the Economy Plumbing Services online store.
        </p>
      </div>
    `;

    console.log('[Email] Attempting to send sales notification email...');
    console.log('[Email] Subject:', `New Sale: ${data.productName} - $${(data.productPrice / 100).toFixed(2)}`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `New Sale: ${data.productName} - $${(data.productPrice / 100).toFixed(2)}`,
      html: emailHtml,
    });

    console.log('[Email] ✓ Sales notification sent successfully! Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[Email Error] ✗ Failed to send sales notification:', error);
    console.error('[Email Error] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function sendSuccessStoryNotificationEmail(data: {
  customerName: string;
  email?: string;
  phone?: string;
  story: string;
  serviceCategory: string;
  location: string;
  beforePhotoUrl: string;
  afterPhotoUrl: string;
  storyId: string;
}) {
  console.log('[Email] Starting sendSuccessStoryNotificationEmail for:', data.customerName);
  
  try {
    console.log('[Email] Getting Resend client...');
    const { client, fromEmail } = await getUncachableResendClient();
    const contactEmail = process.env.CONTACT_EMAIL;

    console.log('[Email] From email:', fromEmail || 'NOT SET');
    console.log('[Email] To email (CONTACT_EMAIL):', contactEmail || 'NOT SET');

    if (!contactEmail) {
      console.error('[Email Error] CONTACT_EMAIL not configured');
      throw new Error('CONTACT_EMAIL not configured');
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">New Customer Success Story Submission</h2>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${data.customerName}</p>
          ${data.email ? `<p><strong>Email:</strong> ${data.email}</p>` : ''}
          ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ''}
          <p><strong>Location:</strong> ${data.location}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Service Details</h3>
          <p><strong>Service Category:</strong> ${data.serviceCategory}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Story</h3>
          <p style="white-space: pre-wrap;">${data.story}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Photos</h3>
          <p><strong>Before Photo:</strong> <a href="${data.beforePhotoUrl}">${data.beforePhotoUrl}</a></p>
          <p><strong>After Photo:</strong> <a href="${data.afterPhotoUrl}">${data.afterPhotoUrl}</a></p>
        </div>

        <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Action Required:</strong> Please review and approve this success story in the admin panel.</p>
          <p style="margin: 10px 0 0 0;"><a href="${process.env.REPL_URL || 'https://www.plumbersthatcare.com'}/admin" style="color: #0ea5e9; text-decoration: none;">Go to Admin Panel →</a></p>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This submission was received through the Success Stories page.
          Story ID: ${data.storyId}
        </p>
      </div>
    `;

    console.log('[Email] Attempting to send success story notification...');
    console.log('[Email] Subject:', `New Success Story: ${data.customerName} - ${data.serviceCategory}`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `New Success Story: ${data.customerName} - ${data.serviceCategory}`,
      html: emailHtml,
    });

    console.log('[Email] ✓ Success story notification sent successfully! Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[Email Error] ✗ Failed to send success story notification:', error);
    console.error('[Email Error] Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
}

export async function sendMembershipPurchaseNotification(data: {
  productName: string;
  productSlug: string;
  amount: number;
  customerType: string;
  customerName?: string;
  companyName?: string;
  contactPersonName?: string;
  locationName?: string;
  email: string;
  phone: string;
  locationPhone?: string;
  extension?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  billingName?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  sku?: string;
  serviceTitanMembershipTypeId?: string;
  durationBillingId?: string;
  paymentIntentId: string;
  testMode?: boolean;
}) {
  console.log('[Email] Starting sendMembershipPurchaseNotification for:', data.productName);
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!contactEmail) {
      console.error('[Email Error] CONTACT_EMAIL not configured');
      throw new Error('CONTACT_EMAIL not configured');
    }

    const priceDisplay = `$${(data.amount / 100).toFixed(2)}`;
    const displayName = data.customerType === 'residential' 
      ? data.customerName || data.locationName 
      : data.companyName;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">🎉 New VIP Membership Purchase!</h2>
        ${data.testMode ? `<div style="background-color: #fef3c7; padding: 10px; border-radius: 8px; margin-bottom: 20px;"><strong>⚠️ TEST MODE:</strong> This is a test transaction</div>` : ''}
        
        <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Membership Details</h3>
          <p><strong>Product:</strong> ${data.productName}</p>
          <p><strong>Amount:</strong> ${priceDisplay}</p>
          ${data.sku ? `<p><strong>SKU:</strong> ${data.sku}</p>` : ''}
          ${data.serviceTitanMembershipTypeId ? `<p><strong>ServiceTitan Membership Type:</strong> ${data.serviceTitanMembershipTypeId}</p>` : ''}
          ${data.durationBillingId ? `<p><strong>Duration Billing ID:</strong> ${data.durationBillingId}</p>` : ''}
        </div>

        ${data.customerType === 'residential' ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Type:</strong> 🏠 Residential</p>
          <p><strong>Name:</strong> ${data.locationName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
          <p><strong>Phone:</strong> ${data.phone}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Location Address</h3>
          <p style="margin: 5px 0;">${data.street}</p>
          <p style="margin: 5px 0;">${data.city}, ${data.state} ${data.zip}</p>
        </div>

        ${data.billingStreet ? `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Billing Address</h3>
          ${data.billingName ? `<p><strong>Billing Name:</strong> ${data.billingName}</p>` : ''}
          <p style="margin: 5px 0;">${data.billingStreet}</p>
          <p style="margin: 5px 0;">${data.billingCity}, ${data.billingState} ${data.billingZip}</p>
        </div>
        ` : ''}
        ` : `
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Company Information</h3>
          <p><strong>Type:</strong> 🏢 Commercial</p>
          <p><strong>Company:</strong> ${data.companyName}</p>
          <p><strong>Location Name:</strong> ${data.locationName}</p>
          <p><strong>Contact Person:</strong> ${data.contactPersonName}</p>
          <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Location Contact</h3>
          <p><strong>Location Phone:</strong> ${data.locationPhone}${data.extension ? ` ext. ${data.extension}` : ''}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Location Address</h3>
          <p style="margin: 5px 0;">${data.street}</p>
          <p style="margin: 5px 0;">${data.city}, ${data.state} ${data.zip}</p>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Billing Information</h3>
          ${data.billingName ? `<p><strong>Billing Contact:</strong> ${data.billingName}</p>` : ''}
          <p><strong>Billing Phone:</strong> ${data.phone}</p>
          ${data.billingStreet ? `
          <p style="margin-top: 10px;"><strong>Billing Address:</strong></p>
          <p style="margin: 5px 0;">${data.billingStreet}</p>
          <p style="margin: 5px 0;">${data.billingCity}, ${data.billingState} ${data.billingZip}</p>
          ` : ''}
        </div>
        `}

        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>✅ Next Steps:</strong></p>
          <ul style="margin: 10px 0;">
            <li>Customer data has been saved to the database</li>
            <li>Zapier will sync this to ServiceTitan automatically</li>
            <li>Payment Intent ID: <code>${data.paymentIntentId}</code></li>
          </ul>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          This notification was triggered by a successful VIP membership purchase.
        </p>
      </div>
    `;

    console.log('[Email] Attempting to send membership purchase notification...');
    console.log('[Email] Subject:', `New VIP Membership: ${displayName} - ${priceDisplay}`);
    
    const result = await client.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `${data.testMode ? '[TEST] ' : ''}New VIP Membership: ${displayName} - ${priceDisplay}`,
      html: emailHtml,
    });

    console.log('[Email] ✓ Membership purchase notification sent successfully! Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('[Email Error] ✗ Failed to send membership purchase notification:', error);
    console.error('[Email Error] Error details:', JSON.stringify(error, null, 2));
    // Don't throw - we don't want to fail the purchase if email fails
    return null;
  }
}

export async function sendNegativeReviewAlert(data: {
  customerName: string;
  rating: number;
  reviewText: string;
  email?: string | null;
  phone?: string | null;
  serviceDate?: string | null;
  reviewId: string;
}) {
  console.log(`[Email] Sending negative review alert for ${data.customerName} (${data.rating} stars)`);
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!contactEmail) {
      console.error('[Email Error] CONTACT_EMAIL not configured for negative review alerts');
      throw new Error('CONTACT_EMAIL not configured');
    }

    const stars = '⭐'.repeat(data.rating) + '☆'.repeat(5 - data.rating);
    const urgencyColor = data.rating === 1 ? '#dc2626' : '#f59e0b';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; color: white;">🚨 Negative Review Alert</h2>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; margin-top: 0;">
            <strong>A customer just submitted a ${data.rating}-star review.</strong> Immediate attention recommended.
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
            <h3 style="margin-top: 0; color: ${urgencyColor};">Rating: ${stars}</h3>
            <p style="font-size: 18px; margin: 0;"><strong>${data.rating} out of 5 stars</strong></p>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Customer Information</h3>
            <p><strong>Name:</strong> ${data.customerName}</p>
            ${data.phone ? `<p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>` : ''}
            ${data.email ? `<p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>` : ''}
            ${data.serviceDate ? `<p><strong>Service Date:</strong> ${new Date(data.serviceDate).toLocaleDateString()}</p>` : ''}
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Review Text</h3>
            <p style="font-style: italic; color: #374151; line-height: 1.6;">"${data.reviewText}"</p>
          </div>

          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0;"><strong>⚡ Recommended Actions:</strong></p>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Contact the customer immediately to resolve their concerns</li>
              <li>Document the issue in your CRM system</li>
              <li>Prepare a thoughtful response before the review goes public</li>
              <li>Review internal processes to prevent similar issues</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.REPLIT_DEV_DOMAIN || process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPLIT_CLUSTER}.repl.co` : 'http://localhost:5000'}/admin/reviews" 
               style="display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View in Admin Dashboard
            </a>
          </div>
        </div>

        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Review ID: ${data.reviewId}
          </p>
        </div>
      </div>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `🚨 ${data.rating}-Star Review Alert: ${data.customerName}`,
      html: emailHtml,
    });

    console.log('[Email] ✓ Negative review alert sent successfully');
    return result;
  } catch (error) {
    console.error('[Email Error] ✗ Failed to send negative review alert:', error);
    throw error;
  }
}
