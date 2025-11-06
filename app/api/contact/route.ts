/**
 * Contact Form Submission API
 * 
 * Handles contact form submissions from the website with ServiceTitan integration
 * 
 * WORKFLOW:
 * 1. Validates form data (honeypot, timing, schema)
 * 2. If complete address provided → Creates/finds ServiceTitan customer
 * 3. Syncs customer to LOCAL database (serviceTitanCustomers + serviceTitanContacts tables)
 * 4. Saves form submission to LOCAL database (contactSubmissions table with consent flags)
 * 5. Sends admin notification email with ServiceTitan ID + consent status
 * 
 * LOCAL DATABASE TABLES UPDATED:
 * - contactSubmissions: Form data + SMS/email consent preferences
 * - serviceTitanCustomers: Customer record synced from ServiceTitan
 * - serviceTitanContacts: Phone/email contacts for fast lookup
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { z } from 'zod';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { db } from '@/server/db';
import { serviceTitanCustomers, serviceTitanContacts } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(1000),
  service: z.string().optional(),
  urgency: z.string().optional(),
  location: z.string().optional(),
  // Address fields
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  // Consent fields
  smsConsent: z.boolean().optional().default(false),
  emailConsent: z.boolean().optional().default(false),
  // Anti-spam fields
  website: z.string().optional(),
  formStartTime: z.number().optional(),
  pageContext: z.string().optional(),
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

/**
 * Normalize contact value for database storage
 */
function normalizeContact(value: string, type: 'phone' | 'email'): string {
  if (type === 'phone') {
    return value.replace(/\D/g, ''); // Digits only
  }
  return value.toLowerCase().trim(); // Lowercase for email
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

    // Honeypot check - if website field is filled, it's a bot
    if (body.website) {
      console.log('[Contact] Honeypot triggered - likely spam');
      // Return success to bot but don't process
      return NextResponse.json({
        success: true,
        message: 'Thank you for contacting us!',
      });
    }

    // Timing check - submissions under 2 seconds are suspicious
    if (body.formStartTime && (Date.now() - body.formStartTime) < 2000) {
      console.log('[Contact] Form submitted too quickly - likely spam');
      return NextResponse.json({
        success: true,
        message: 'Thank you for contacting us!',
      });
    }

    // Validate input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = result.data;

    // Create/find ServiceTitan customer if we have complete address
    let serviceTitanCustomerId: number | null = null;
    
    if (data.address && data.city && data.state && data.zip) {
      try {
        console.log(`[Contact] Creating/finding ServiceTitan customer: ${data.name}`);
        
        const customerData = {
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
          customerType: 'Residential' as const, // Default for contact forms
          address: {
            street: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
          serviceLocation: {
            name: `${data.name} - Primary`,
            street: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
        };

        // Find existing or create new customer in ServiceTitan
        const customer = await serviceTitanCRM.ensureCustomer(customerData);
        serviceTitanCustomerId = customer.id;

        console.log(`[Contact] ServiceTitan customer ready: ${customer.id}`);

        // Sync to local database
        await db.insert(serviceTitanCustomers).values({
          id: customer.id,
          name: customer.name,
          type: customer.type || 'Residential',
          street: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          active: true,
        }).onConflictDoUpdate({
          target: serviceTitanCustomers.id,
          set: {
            name: customer.name,
            street: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
          },
        });

        // Sync contacts to local database
        if (data.phone) {
          const normalizedPhone = normalizeContact(data.phone, 'phone');
          const existingPhone = await db.select()
            .from(serviceTitanContacts)
            .where(eq(serviceTitanContacts.normalizedValue, normalizedPhone))
            .limit(1);
          
          if (existingPhone.length === 0) {
            await db.insert(serviceTitanContacts).values({
              customerId: customer.id,
              contactType: 'Phone',
              value: data.phone,
              normalizedValue: normalizedPhone,
            });
          }
        }

        if (data.email) {
          const normalizedEmail = normalizeContact(data.email, 'email');
          const existingEmail = await db.select()
            .from(serviceTitanContacts)
            .where(eq(serviceTitanContacts.normalizedValue, normalizedEmail))
            .limit(1);
          
          if (existingEmail.length === 0) {
            await db.insert(serviceTitanContacts).values({
              customerId: customer.id,
              contactType: 'Email',
              value: data.email,
              normalizedValue: normalizedEmail,
            });
          }
        }

        console.log(`[Contact] ✅ Customer ${customer.id} synced to local database`);
      } catch (error) {
        console.error('[Contact] Failed to create ServiceTitan customer:', error);
        // Continue with form submission even if ServiceTitan fails
      }
    }

    // Save to database (this captures form submission + consent preferences)
    const submission = await storage.createContactSubmission({
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      message: data.message,
      service: data.service || null,
      urgency: data.urgency || null,
      location: data.location || null,
      pageContext: data.pageContext || null,
      smsConsent: data.smsConsent || false,
      emailConsent: data.emailConsent || false,
    });

    console.log('[Contact] New submission:', submission.id);

    // Send notification email to admin (async, don't wait)
    sendAdminNotification({
      ...submission,
      serviceTitanCustomerId,
      smsConsent: data.smsConsent,
      emailConsent: data.emailConsent,
    }).catch(err => {
      console.error('[Contact] Failed to send admin notification:', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you soon.',
      submissionId: submission.id,
      serviceTitanCustomerId,
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
            <p><strong>Email:</strong> ${submission.email ? `<a href="mailto:${submission.email}">${submission.email}</a>` : 'Not provided'}</p>
            ${submission.phone ? `<p><strong>Phone:</strong> <a href="tel:${submission.phone}">${submission.phone}</a></p>` : ''}
            ${submission.service ? `<p><strong>Service:</strong> ${submission.service}</p>` : ''}
            ${submission.location ? `<p><strong>Location:</strong> ${submission.location}</p>` : ''}
            ${submission.urgency ? `<p><strong>Urgency:</strong> ${submission.urgency}</p>` : ''}
            <p><strong>Submitted:</strong> ${submission.submittedAt.toLocaleString('en-US', { timeZone: 'America/Chicago' })}</p>
            ${submission.serviceTitanCustomerId ? `<p><strong>ServiceTitan ID:</strong> ${submission.serviceTitanCustomerId}</p>` : ''}
          </div>

          ${submission.smsConsent || submission.emailConsent ? `
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="margin-top: 0; color: #065f46;">Marketing Consent</h3>
            ${submission.smsConsent ? '<p>✅ <strong>SMS/Text Messages:</strong> Opted in</p>' : ''}
            ${submission.emailConsent ? '<p>✅ <strong>Email Marketing:</strong> Opted in</p>' : ''}
          </div>
          ` : ''}
          
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
        { name: 'urgency', value: submission.urgency || 'normal' },
      ],
    });

    console.log('[Contact] Admin notification sent');
  } catch (error) {
    console.error('[Contact] Error sending admin notification:', error);
    throw error;
  }
}
