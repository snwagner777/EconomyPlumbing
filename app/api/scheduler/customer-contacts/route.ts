/**
 * Scheduler Customer Contacts API (READ-ONLY)
 * 
 * PUBLIC ENDPOINT - No authentication required
 * Allows viewing existing contacts for a customer during booking flow
 * Does NOT allow mutations (add/edit/delete - those require portal authentication)
 * 
 * Security: Rate-limited to prevent enumeration attacks
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { checkRateLimit } from '@/server/lib/rateLimit';

/**
 * GET /api/scheduler/customer-contacts?customerId=123
 * Retrieve contacts for a customer (read-only, for contact selection during booking)
 * 
 * Security: Public endpoint, but requires valid ServiceTitan customer ID
 * Returns masked phone/email for privacy (e.g., "(512) ***-**34" or "j***@example.com")
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limiting to prevent enumeration attacks (use IP as key for public endpoint)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const rateLimit = checkRateLimit(`scheduler-contacts:${clientIp}`, {
      maxRequests: 20, // 20 lookups per 5 minutes (more generous than portal since public)
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      console.warn(`[Scheduler] Rate limit exceeded for IP: ${clientIp}`);
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

    const { searchParams } = new URL(req.url);
    const customerIdParam = searchParams.get('customerId');

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

    console.log(`[Scheduler] Fetching contacts for customer ${customerId} (IP: ${clientIp})`);

    // Fetch contacts from ServiceTitan
    const contacts = await serviceTitanCRM.getCustomerContacts(customerId);

    // Filter to only show MobilePhone and Email (hide Fax/Landline for privacy)
    // Mask sensitive data for display
    const displayContacts = contacts
      .map(contact => ({
        id: contact.id,
        name: contact.name,
        methods: contact.methods
          ?.filter(m => m.type === 'MobilePhone' || m.type === 'Email')
          .map(m => ({
            id: m.id,
            type: m.type,
            value: maskContactValue(m.value, m.type),
            memo: m.memo,
          })) || [],
      }))
      .filter(contact => contact.methods.length > 0); // Only show contacts with mobile/email

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
