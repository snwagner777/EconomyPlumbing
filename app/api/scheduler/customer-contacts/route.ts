/**
 * Scheduler Customer Contacts API
 * 
 * GET: PUBLIC - View contacts (masked) for customer during booking
 * POST: AUTHENTICATED - Create new contact (requires scheduler session token)
 * 
 * Security: GET is rate-limited, POST requires valid scheduler session from 2FA
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { checkRateLimit } from '@/server/lib/rateLimit';
import { validateSchedulerSession } from '@/server/lib/schedulerSession';
import { logCustomerAction, extractTraceId } from '@/server/lib/auditLog';

/**
 * GET /api/scheduler/customer-contacts?customerId=123
 * Retrieve contacts for a customer
 * 
 * Security: 
 * - Public mode (no Authorization): Returns masked contacts for privacy
 * - Authenticated mode (Authorization: Bearer token): Returns full unmasked contacts if customer ID matches session
 * - NEVER accepts tokens in query strings (security vulnerability)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerIdParam = searchParams.get('customerId');
    
    // SECURITY: Refuse tokens in query string (would leak into logs/history)
    if (searchParams.get('token')) {
      console.error('[Scheduler] SECURITY: Token in query string rejected');
      return NextResponse.json(
        { error: 'Session tokens must be sent via Authorization header, not query string' },
        { status: 400 }
      );
    }

    if (!customerIdParam) {
      return NextResponse.json(
        { error: 'customerId query parameter is required' },
        { status: 400 }
      );
    }

    const customerId = parseInt(customerIdParam);
    if (isNaN(customerId) || customerId <= 0) {
      return NextResponse.json(
        { error: 'Invalid customerId' },
        { status: 400 }
      );
    }

    // Check if authenticated request via Authorization header
    let isAuthenticated = false;
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const session = validateSchedulerSession(token);
      if (session && session.customerId === customerId) {
        isAuthenticated = true;
        console.log(`[Scheduler] Authenticated contact fetch for customer ${customerId}`);
      }
    }

    // Rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimitKey = isAuthenticated ? `scheduler-contacts-auth:${customerId}` : `scheduler-contacts:${clientIp}`;
    const rateLimit = checkRateLimit(rateLimitKey, {
      maxRequests: isAuthenticated ? 50 : 20, // Higher limit for authenticated users
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      console.warn(`[Scheduler] Rate limit exceeded for ${rateLimitKey}`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Fetch contacts from ServiceTitan
    const contacts = await serviceTitanCRM.getCustomerContacts(customerId);

    // Filter to only show MobilePhone and Email (hide Fax/Landline)
    const displayContacts = contacts
      .map(contact => ({
        id: contact.id,
        name: contact.name,
        methods: contact.methods
          ?.filter(m => m.type === 'MobilePhone' || m.type === 'Email')
          .map(m => ({
            id: m.id,
            type: m.type,
            // Mask contacts only for public (unauthenticated) requests
            value: isAuthenticated ? m.value : maskContactValue(m.value, m.type),
            memo: m.memo,
          })) || [],
      }))
      .filter(contact => contact.methods.length > 0);

    return NextResponse.json({
      success: true,
      contacts: displayContacts,
    });

  } catch (error: any) {
    console.error('[Scheduler] Error fetching customer contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

/**
 * Mask contact values for privacy (HARDENED for security)
 * Phone: (512) ***-**34 (always masks, regardless of format)
 * Email: j***@example.com
 */
function maskContactValue(value: string, type: string): string {
  if (type === 'Email') {
    try {
      const [localPart, domain] = value.split('@');
      if (!localPart || !domain) {
        // Invalid email format - return generic placeholder
        return '***@***.com';
      }
      
      // Show first character and domain
      const maskedLocal = (localPart[0] || '*') + '***';
      return `${maskedLocal}@${domain}`;
    } catch {
      return '***@***.com';
    }
  }
  
  if (type === 'MobilePhone' || type === 'Phone') {
    try {
      // Extract digits only (handles country codes, extensions, any format)
      const digits = value.replace(/\D/g, '');
      
      // SECURITY: Always mask, never return raw value
      if (digits.length >= 10) {
        // Standard US format: Show area code and last 2 digits
        const areaCode = digits.slice(-10, -7); // Last 10 digits, first 3 = area code
        const lastTwo = digits.slice(-2);
        return `(${areaCode}) ***-**${lastTwo}`;
      } else if (digits.length >= 4) {
        // Short numbers: Show first digit and last 2
        return `${digits[0]}***${digits.slice(-2)}`;
      } else {
        // Too short - generic placeholder
        return '(***) ***-****';
      }
    } catch {
      return '(***) ***-****';
    }
  }
  
  // Fallback for unknown types - NEVER return raw value
  return '***';
}

/**
 * POST /api/scheduler/customer-contacts
 * Create new contact for authenticated scheduler session
 * 
 * Headers:
 * - Authorization: Bearer <session_token>
 * 
 * Body:
 * - phone: Phone number (required)
 * - email: Email address (optional)
 * - locationId: Location to link contact to (optional)
 * - name: Contact name (optional)
 * 
 * Security: Requires valid scheduler session token via Authorization header
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Extract token from Authorization header only (not body)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authorization header with Bearer token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Validate scheduler session
    const session = validateSchedulerSession(token);
    if (!session) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { phone, email, locationId, name } = body;

    if (!session.customerId) {
      return NextResponse.json(
        { code: 'BAD_REQUEST', message: 'No customer associated with session' },
        { status: 400 }
      );
    }

    const customerId = session.customerId;
    const sessionKey = session.sessionId;

    // Rate limiting (10 mutations per 5 minutes)
    const rateLimit = checkRateLimit(`scheduler-mutation:${sessionKey}`, {
      maxRequests: 10,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.', retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

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

    console.log(`[Scheduler] Creating contact for customer ${customerId}`);

    // Create contact via ServiceTitan CRM (full workflow: person + methods + links)
    const contact = await serviceTitanCRM.createCompleteContact(
      customerId,
      {
        name: name?.trim() || undefined,
        phone: phoneDigits,
        email: email?.trim() || undefined,
      },
      locationId || undefined
    );

    // Audit log mutation (CRITICAL: actually log the action)
    await logCustomerAction({
      customerId,
      action: 'create',
      entityType: 'contact',
      entityId: contact.id.toString(),
      payloadSummary: `Created contact via scheduler: phone=${phoneDigits}, email=${email || 'none'}`,
    });

    console.log(`[Scheduler] Contact created successfully: ${contact.id} for customer ${customerId}`);

    return NextResponse.json({
      success: true,
      message: 'Contact created successfully',
      contactId: contact.id,
    });

  } catch (error: any) {
    console.error('[Scheduler] Error creating contact:', error);
    const traceId = extractTraceId(error);
    
    // Handle specific ServiceTitan errors
    if (error.message?.includes('duplicate')) {
      return NextResponse.json(
        { code: 'DUPLICATE_CONTACT', message: 'This contact already exists', traceId },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { code: 'OPERATION_FAILED', message: 'Failed to create contact', traceId },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/scheduler/customer-contacts
 * Update existing contact method (phone/email)
 * 
 * Headers:
 * - Authorization: Bearer <session_token>
 * 
 * Body:
 * - contactId: ServiceTitan contact ID
 * - contactMethodId: ServiceTitan contact method ID to update
 * - value: New phone/email value
 * - memo: Optional memo/label
 * 
 * Security: Requires valid scheduler session via Authorization header
 */
export async function PATCH(req: NextRequest) {
  try {
    // SECURITY: Extract token from Authorization header only (not body)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authorization header with Bearer token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Validate scheduler session
    const session = validateSchedulerSession(token);
    if (!session || !session.customerId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { contactId, contactMethodId, value, memo } = body;

    const customerId = session.customerId;
    const sessionKey = session.sessionId;

    // Rate limiting
    const rateLimit = checkRateLimit(`scheduler-mutation:${sessionKey}`, {
      maxRequests: 10,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.', retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // Validation
    if (!contactId || !contactMethodId || !value) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'contactId, contactMethodId, and value are required' },
        { status: 400 }
      );
    }

    console.log(`[Scheduler] Updating contact method ${contactMethodId} for customer ${customerId}`);

    // Update contact method via ServiceTitan CRM
    await serviceTitanCRM.updateContactMethod(contactId, contactMethodId, {
      value: value.trim(),
      memo: memo?.trim() || undefined,
    });

    // Audit log
    await logCustomerAction({
      customerId,
      action: 'update',
      entityType: 'contact_method',
      entityId: contactMethodId,
      payloadSummary: `Updated contact method via scheduler: ${value}`,
    });

    console.log(`[Scheduler] Contact method updated successfully: ${contactMethodId}`);

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
    });

  } catch (error: any) {
    console.error('[Scheduler] Error updating contact:', error);
    const traceId = extractTraceId(error);
    
    return NextResponse.json(
      { code: 'OPERATION_FAILED', message: 'Failed to update contact', traceId },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/scheduler/customer-contacts
 * Delete contact method (phone/email)
 * 
 * Headers:
 * - Authorization: Bearer <session_token>
 * 
 * Body:
 * - contactId: ServiceTitan contact ID
 * - contactMethodId: ServiceTitan contact method ID to delete
 * 
 * Security: Requires valid scheduler session via Authorization header
 */
export async function DELETE(req: NextRequest) {
  try {
    // SECURITY: Extract token from Authorization header only (not body)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Authorization header with Bearer token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Validate scheduler session
    const session = validateSchedulerSession(token);
    if (!session || !session.customerId) {
      return NextResponse.json(
        { code: 'UNAUTHORIZED', message: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { contactId, contactMethodId } = body;

    const customerId = session.customerId;
    const sessionKey = session.sessionId;

    // Rate limiting
    const rateLimit = checkRateLimit(`scheduler-mutation:${sessionKey}`, {
      maxRequests: 10,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.', retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );
    }

    // Validation
    if (!contactId || !contactMethodId) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'contactId and contactMethodId are required' },
        { status: 400 }
      );
    }

    console.log(`[Scheduler] Deleting contact method ${contactMethodId} for customer ${customerId}`);

    // Delete contact method via ServiceTitan CRM
    await serviceTitanCRM.deleteContactMethod(contactId, contactMethodId);

    // Audit log
    await logCustomerAction({
      customerId,
      action: 'delete',
      entityType: 'contact_method',
      entityId: contactMethodId,
      payloadSummary: `Deleted contact method via scheduler`,
    });

    console.log(`[Scheduler] Contact method deleted successfully: ${contactMethodId}`);

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });

  } catch (error: any) {
    console.error('[Scheduler] Error deleting contact:', error);
    const traceId = extractTraceId(error);
    
    return NextResponse.json(
      { code: 'OPERATION_FAILED', message: 'Failed to delete contact', traceId },
      { status: 500 }
    );
  }
}
