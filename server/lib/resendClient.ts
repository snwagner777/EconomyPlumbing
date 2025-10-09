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
