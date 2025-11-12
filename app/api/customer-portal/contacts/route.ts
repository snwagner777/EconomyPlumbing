/**
 * Customer Portal - Contact Management API
 * 
 * AUTHENTICATED ENDPOINT - Requires customer login via phone-based SMS 2FA
 * Allows customers to add new contacts (MobilePhone + Email only)
 * Customers cannot manage Fax or Landline contacts (office-managed)
 * 
 * Security: ServiceTitan v2 API as single source of truth, session-based authentication with ownership validation
 * Business Rule: Must maintain at least 1 active contact at all times
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { checkRateLimit } from '@/server/lib/rateLimit';
import { logCustomerAction, extractTraceId } from '@/server/lib/auditLog';

/**
 * GET /api/customer-portal/contacts
 * Retrieve all contacts for authenticated customer
 * 
 * Security: Returns only contacts linked to session.customerPortalAuth.customerId
 */
export async function GET(req: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    console.log(`[Customer Portal] Fetching contacts for customer ${customerId}`);

    // Fetch all contacts for customer from ServiceTitan
    const contacts = await serviceTitanCRM.getCustomerContacts(customerId);

    // Filter to only show MobilePhone and Email contact methods (hide Fax/Landline)
    const customerFacingContacts = contacts.map(contact => ({
      ...contact,
      methods: contact.methods?.filter(m => m.type === 'MobilePhone' || m.type === 'Email') || [],
    })).filter(contact => contact.methods.length > 0); // Only show contacts with mobile/email

    return NextResponse.json({
      success: true,
      contacts: customerFacingContacts,
    });

  } catch (error: any) {
    console.error('[Customer Portal] Error:', error);
    const traceId = extractTraceId(error);
    return NextResponse.json(
      { code: 'OPERATION_FAILED', message: 'Operation failed', traceId },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customer-portal/contacts
 * Create new contact for authenticated customer
 * 
 * Security: Contact is automatically linked to session.customerPortalAuth.customerId
 * Creates: Contact Person → Mobile Phone → Optional Email → Link to Customer
 */
export async function POST(req: NextRequest) {
  try {
    // Get session
    const cookieStore = await cookies();
    const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
    
    if (!session.customerPortalAuth?.customerId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const customerId = session.customerPortalAuth.customerId;
    const sessionId = session.customerPortalAuth.phone;

    // Rate limiting
    const rateLimit = checkRateLimit(sessionId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.', retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { phone, email, locationId } = body;

    // Validation
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Validate phone format (10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Phone number must be 10 digits' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && typeof email === 'string' && email.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return NextResponse.json(
          { code: 'VALIDATION_ERROR', message: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    // Verify customer exists and owns the location (if specified)
    if (locationId) {
      const location = await serviceTitanCRM.getLocation(locationId);
      if (!location || location.customerId !== customerId) {
        return NextResponse.json(
          { code: 'FORBIDDEN', message: 'Unauthorized: Location does not belong to your account' },
          { status: 403 }
        );
      }
    }

    console.log(`[Customer Portal] Creating contact for customer ${customerId}`);

    // Create complete contact using v2 workflow
    const contactData = {
      phone: phoneDigits,
      email: email && email.trim().length > 0 ? email.trim() : undefined,
    };

    const newContact = await serviceTitanCRM.createCompleteContact(
      customerId,
      contactData,
      locationId || undefined
    );

    console.log(`[Customer Portal] ✅ Contact created: ${newContact.id}`);

    // Audit log
    await logCustomerAction({
      customerId,
      action: 'create',
      entityType: 'contact',
      entityId: newContact.id,
      payloadSummary: `Created contact: phone ${phoneDigits}${email ? ', email ' + email.trim() : ''}`,
    });

    return NextResponse.json({
      success: true,
      contact: newContact,
      message: 'Contact added successfully',
    });

  } catch (error: any) {
    console.error('[Customer Portal] Create contact error:', error);
    const traceId = extractTraceId(error);
    if (traceId) {
      console.error(`[Customer Portal] ServiceTitan error traceId: ${traceId}`);
    }

    return NextResponse.json(
      { 
        code: 'CREATE_FAILED',
        message: 'Failed to create contact', 
        details: error.message || 'Unknown error',
        traceId
      },
      { status: 500 }
    );
  }
}
