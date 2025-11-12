/**
 * Send Cron Documentation Email
 * Temporary endpoint to email cron instructions to Sean
 */

import { NextRequest, NextResponse } from 'next/server';
import { getResendClient } from '@/server/lib/resendClient';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    // Read the cron documentation
    const cronDocPath = path.join(process.cwd(), 'CRON_ENDPOINTS.md');
    const cronDoc = fs.readFileSync(cronDocPath, 'utf-8');
    
    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0284c7;">Cron Endpoint Configuration Instructions</h2>
          <p>Hi Sean,</p>
          <p>Here are the complete cron endpoint configuration instructions for plumbersthatcare.com:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; line-height: 1.5;">${cronDoc.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
          
          <p><strong>Quick Summary:</strong></p>
          <ul>
            <li>10 working cron endpoints ready to configure</li>
            <li>Use cron-job.org (free tier supports 50 jobs)</li>
            <li>All endpoints require Bearer token authentication using CRON_SECRET</li>
            <li>Recommended service: <a href="https://cron-job.org">cron-job.org</a></li>
          </ul>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Sign up at <a href="https://cron-job.org">cron-job.org</a></li>
            <li>Create a cron job for each endpoint using the schedules in the document</li>
            <li>Add these custom headers to each cron job:
              <ul>
                <li><code>Authorization: Bearer YOUR_CRON_SECRET</code></li>
                <li><code>Content-Type: application/json</code></li>
              </ul>
            </li>
            <li>Test each endpoint manually first before enabling the scheduled jobs</li>
          </ol>
          
          <p><strong>Important Note:</strong> The Membership Sync cron job (runs every 5 minutes) is currently DEAD CODE and can be removed - it processes zero records because the serviceTitanMemberships table is never populated. Your current membership purchase flow creates ServiceTitan jobs directly, which works fine.</p>
          
          <p>Let me know if you have any questions!</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Sent from your Economy Plumbing Services development system.
          </p>
        </body>
      </html>
    `;

    const result = await client.emails.send({
      from: fromEmail,
      to: 'sean@plumbersthatcare.com',
      subject: 'Cron Endpoint Configuration Instructions - plumbersthatcare.com',
      html: emailHtml,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Email sent successfully',
      result 
    });
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}
