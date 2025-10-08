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
