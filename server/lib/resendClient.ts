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

export async function sendRefereeWelcomeEmail(data: {
  refereeName: string;
  refereeEmail: string;
  referrerName: string;
  voucherCode: string;
  voucherQRCode: string; // base64 data URL
  discountAmount: number; // in cents
  expiresAt: Date;
}) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const expiryDate = data.expiresAt.toLocaleDateString('en-US', { 
      dateStyle: 'full'
    });
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #0284c7; margin-top: 0;">Welcome to Economy Plumbing Services!</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hi ${data.refereeName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Great news! ${data.referrerName} has referred you to Economy Plumbing Services, and we're excited to help you with your plumbing needs.
            </p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid: #0284c7; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Your Welcome Gift:</strong> <span style="color: #0284c7; font-size: 20px; font-weight: bold;">$${(data.discountAmount / 100).toFixed(2)} OFF</span></p>
              <p style="margin: 8px 0; font-size: 14px;">Use this voucher on your first service call of $200 or more</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Your QR Code Voucher</p>
              <img src="${data.voucherQRCode}" alt="Voucher QR Code" style="width: 250px; height: 250px; margin: 10px auto; display: block;" />
              <p style="font-family: monospace; font-size: 16px; font-weight: bold; color: #0284c7; margin-top: 10px;">${data.voucherCode}</p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0; font-size: 14px; color: #92400e;">
                <strong>How to Use:</strong>
              </p>
              <ol style="margin: 8px 0; padding-left: 20px; color: #92400e;">
                <li>Schedule your service appointment</li>
                <li>Show this QR code to your technician at time of service</li>
                <li>Save $${(data.discountAmount / 100).toFixed(2)} on jobs of $200 or more!</li>
              </ol>
              <p style="margin: 8px 0; font-size: 12px; font-style: italic; color: #92400e;">
                Expires: ${expiryDate}
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:+15125551234" style="display: inline-block; background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Call Us to Schedule: (512) 555-1234
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; font-style: italic;">
                <strong>Important:</strong> This voucher has no cash value and cannot be exchanged for cash. Voucher must be presented at time of service. One voucher per customer. Cannot be combined with other offers.
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
              We look forward to serving you!
            </p>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Economy Plumbing Services<br/>
              Licensed & Insured • Family Owned • Serving Austin Since 1995
            </p>
          </div>
        </body>
      </html>
    `;
    
    const result = await client.emails.send({
      from: fromEmail,
      to: data.refereeEmail,
      subject: `Welcome! You've Got $${(data.discountAmount / 100).toFixed(2)} OFF from ${data.referrerName}`,
      html: emailHtml,
    });
    
    console.log(`[Resend] Referee welcome email sent to ${data.refereeEmail}`);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send referee welcome email:', error);
    throw error;
  }
}

export async function sendReferrerRewardEmail(data: {
  referrerName: string;
  referrerEmail: string;
  refereeName: string;
  voucherCode: string;
  voucherQRCode: string; // base64 data URL
  discountAmount: number; // in cents
  expiresAt: Date;
}) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const expiryDate = data.expiresAt.toLocaleDateString('en-US', { 
      dateStyle: 'full'
    });
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-top: 0;">🎉 Thank You for Your Referral!</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hi ${data.referrerName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Great news! ${data.refereeName} just used their referral voucher for their first service with Economy Plumbing Services.
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              As a thank you for spreading the word about our services, we've created your reward voucher!
            </p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 8px 0;"><strong>Your Reward:</strong> <span style="color: #10b981; font-size: 20px; font-weight: bold;">$${(data.discountAmount / 100).toFixed(2)} OFF</span></p>
              <p style="margin: 8px 0; font-size: 14px;">Use on your next service call of $200 or more</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Your Reward QR Code</p>
              <img src="${data.voucherQRCode}" alt="Reward Voucher QR Code" style="width: 250px; height: 250px; margin: 10px auto; display: block;" />
              <p style="font-family: monospace; font-size: 16px; font-weight: bold; color: #10b981; margin-top: 10px;">${data.voucherCode}</p>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 8px 0; font-size: 14px; color: #0c4a6e;">
                <strong>How to Use Your Reward:</strong>
              </p>
              <ol style="margin: 8px 0; padding-left: 20px; color: #0c4a6e;">
                <li>Schedule your next service appointment</li>
                <li>Show this QR code to your technician</li>
                <li>Save $${(data.discountAmount / 100).toFixed(2)} on jobs of $200 or more!</li>
              </ol>
              <p style="margin: 8px 0; font-size: 12px; font-style: italic; color: #0c4a6e;">
                Expires: ${expiryDate}
              </p>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                <strong>💡 Keep Earning Rewards!</strong><br/>
                Refer more friends and family to earn additional vouchers. Every successful referral gets you $${(data.discountAmount / 100).toFixed(2)} off your next service!
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="tel:+15125551234" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Schedule Your Next Service
              </a>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="margin: 0; font-size: 12px; color: #6b7280; font-style: italic;">
                <strong>Important:</strong> This voucher has no cash value and cannot be exchanged for cash. Voucher must be presented at time of service. One voucher per customer. Cannot be combined with other offers.
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
              Thank you for being a valued customer and for referring ${data.refereeName}!
            </p>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Economy Plumbing Services<br/>
              Licensed & Insured • Family Owned • Serving Austin Since 1995
            </p>
          </div>
        </body>
      </html>
    `;
    
    const result = await client.emails.send({
      from: fromEmail,
      to: data.referrerEmail,
      subject: `🎉 Your Referral Reward: $${(data.discountAmount / 100).toFixed(2)} OFF Your Next Service!`,
      html: emailHtml,
    });
    
    console.log(`[Resend] Referrer reward email sent to ${data.referrerEmail}`);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send referrer reward email:', error);
    throw error;
  }
}

export async function sendReferrerThankYouEmail(data: {
  referrerName: string;
  referrerEmail: string;
  refereeName: string;
}) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-top: 0;">Thank You for Your Referral!</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Hi ${data.referrerName},
            </p>
            
            <p style="font-size: 16px; line-height: 1.6;">
              Thank you for referring ${data.refereeName} to Economy Plumbing Services! We truly appreciate you spreading the word about our services.
            </p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
              <p style="margin: 8px 0; font-size: 16px;">
                <strong>What happens next?</strong>
              </p>
              <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.8;">
                <li>We've sent ${data.refereeName} a $25 welcome voucher</li>
                <li>When they complete their first $200+ job, you'll receive your own $25 reward voucher!</li>
                <li>There's no limit to how many people you can refer</li>
              </ol>
            </div>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
                <strong>💡 Keep Referring & Earning!</strong><br/>
                Share your unique referral link with more friends and family to earn $25 for each successful referral. You can find your referral link anytime in your customer portal.
              </p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">
              Thank you for being a valued customer!
            </p>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              Economy Plumbing Services<br/>
              Licensed & Insured • Family Owned • Serving Austin Since 1995
            </p>
          </div>
        </body>
      </html>
    `;
    
    const result = await client.emails.send({
      from: fromEmail,
      to: data.referrerEmail,
      subject: `Thank you for referring ${data.refereeName}!`,
      html: emailHtml,
    });
    
    console.log(`[Resend] Referrer thank you email sent to ${data.referrerEmail}`);
    return result;
  } catch (error) {
    console.error('[Resend] Failed to send referrer thank you email:', error);
    throw error;
  }
}
