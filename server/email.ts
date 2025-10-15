import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  console.log('[Email Debug] Getting Resend credentials...');
  console.log('[Email Debug] Hostname:', hostname ? 'set' : 'NOT SET');
  console.log('[Email Debug] REPL_IDENTITY:', process.env.REPL_IDENTITY ? 'set' : 'NOT SET');
  console.log('[Email Debug] WEB_REPL_RENEWAL:', process.env.WEB_REPL_RENEWAL ? 'set' : 'NOT SET');

  if (!xReplitToken) {
    console.error('[Email Error] X_REPLIT_TOKEN not found for repl/depl');
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  console.log('[Email Debug] Connection settings retrieved:', connectionSettings ? 'yes' : 'NO');
  console.log('[Email Debug] API key exists:', connectionSettings?.settings?.api_key ? 'yes' : 'NO');
  console.log('[Email Debug] From email:', connectionSettings?.settings?.from_email || 'NOT SET');

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    console.error('[Email Error] Resend not connected properly');
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
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

    console.log('[Email] Attempting to send email...');
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
