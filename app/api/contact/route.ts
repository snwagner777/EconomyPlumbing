/**
 * Contact Form Submission API
 * 
 * Handles contact form submissions from the website
 * Stores in database and sends notification email to admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { z } from 'zod';

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  message: z.string().min(1, 'Message is required').max(1000),
  service: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high']).optional(),
});

// Rate limiting map (in-memory, could be Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + 60 * 60 * 1000, // 1 hour
    });
    return true;
  }

  if (limit.count >= 5) {
    // Max 5 submissions per hour
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await req.json();

    // Validate input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Save to database
    const submission = await storage.createContactSubmission({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      message: data.message,
      service: data.service || null,
      urgency: data.urgency || 'medium',
      submittedAt: new Date(),
      ipAddress: ip,
    });

    console.log('[Contact] New submission:', submission.id);

    // Send notification email to admin (async, don't wait)
    sendAdminNotification(submission).catch(err => {
      console.error('[Contact] Failed to send admin notification:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      submissionId: submission.id,
    });
  } catch (error) {
    console.error('[Contact] Error processing submission:', error);
    return NextResponse.json(
      { error: 'Failed to process submission. Please try again.' },
      { status: 500 }
    );
  }
}

async function sendAdminNotification(submission: any) {
  try {
    const { getResendClient } = await import('@/server/lib/resendClient');
    const { client, fromEmail } = await getResendClient();

    const emailHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #0ea5e9;">New Contact Form Submission</h2>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${submission.name}</p>
            <p><strong>Email:</strong> <a href="mailto:${submission.email}">${submission.email}</a></p>
            ${submission.phone ? `<p><strong>Phone:</strong> <a href="tel:${submission.phone}">${submission.phone}</a></p>` : ''}
            ${submission.service ? `<p><strong>Service:</strong> ${submission.service}</p>` : ''}
            <p><strong>Urgency:</strong> ${submission.urgency || 'medium'}</p>
            <p><strong>Submitted:</strong> ${submission.submittedAt.toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap;">${submission.message}</p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            This notification was sent from Economy Plumbing Services contact form.
          </p>
        </body>
      </html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: process.env.NOTIFICATION_EMAIL || fromEmail,
      subject: `New Contact: ${submission.name} - ${submission.service || 'General Inquiry'}`,
      html: emailHtml,
      tags: [
        { name: 'type', value: 'contact_form' },
        { name: 'urgency', value: submission.urgency || 'medium' },
      ],
    });

    console.log('[Contact] Admin notification sent');
  } catch (error) {
    console.error('[Contact] Error sending admin notification:', error);
    throw error;
  }
}
