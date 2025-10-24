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

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export async function send404AlertEmail(url: string, referrer: string | undefined, userAgent: string | undefined, ipAddress: string | undefined) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #dc2626;">404 Error Detected</h2>
          <p>A visitor encountered a broken link on your website:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Requested URL:</strong> ${url}</p>
            <p><strong>Referrer:</strong> ${referrer || 'Direct visit'}</p>
            <p><strong>User Agent:</strong> ${userAgent || 'Unknown'}</p>
            <p><strong>IP Address:</strong> ${ipAddress || 'Unknown'}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            This alert was sent from your Economy Plumbing Services 404 monitoring system.
          </p>
        </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: fromEmail, // Send to the same email configured in Resend
      subject: `404 Error: ${url}`,
      html: emailHtml,
    });

    return result;
  } catch (error) {
    console.error('[404 Monitor] Failed to send email alert:', error);
    throw error;
  }
}

export async function sendReferralCreditNotification(data: {
  referrerName: string;
  refereeName: string;
  creditAmount: number;
  creditDate: Date;
  jobNumber?: string;
}) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const dateStr = data.creditDate.toLocaleString('en-US', { 
      timeZone: 'America/Chicago',
      dateStyle: 'full',
      timeStyle: 'short'
    });
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-top: 0;">Referral Credit Issued</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
              A new referral credit has been issued in the Economy Plumbing Services system:
            </p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Referrer:</strong> ${data.referrerName}</p>
              <p style="margin: 8px 0;"><strong>New Customer (Referee):</strong> ${data.refereeName}</p>
              <p style="margin: 8px 0;"><strong>Credit Amount:</strong> <span style="color: #10b981; font-size: 18px; font-weight: bold;">$${data.creditAmount.toFixed(2)}</span></p>
              ${data.jobNumber ? `<p style="margin: 8px 0;"><strong>Qualifying Job:</strong> #${data.jobNumber}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Date Issued:</strong> ${dateStr}</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>Next Steps:</strong> The credit has been added to the referrer's ServiceTitan account and will expire in 180 days. A pinned note has been added to both customer accounts.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              This notification was sent by the Economy Plumbing Services referral tracking system.
            </p>
          </div>
        </body>
      </html>
    `;

    // Use NOTIFICATION_EMAIL if set, otherwise fall back to fromEmail
    const notificationEmail = process.env.NOTIFICATION_EMAIL || fromEmail;
    
    const result = await client.emails.send({
      from: fromEmail,
      to: notificationEmail,
      subject: `Referral Credit Issued: $${data.creditAmount.toFixed(2)} for ${data.referrerName}`,
      html: emailHtml,
    });

    console.log('[Resend] Referral credit notification sent to:', notificationEmail);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send referral credit notification:', error);
    throw error;
  }
}
