import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
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

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
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
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const contactEmail = process.env.CONTACT_EMAIL;

    if (!contactEmail) {
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

    const result = await client.emails.send({
      from: fromEmail,
      to: contactEmail,
      subject: `New Contact: ${data.name} - ${data.service || 'Inquiry'}`,
      html: emailHtml,
    });

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
