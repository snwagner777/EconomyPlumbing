/**
 * Scheduler Customer Contacts API (READ-ONLY)
 * 
 * PUBLIC ENDPOINT - No authentication required
 * Allows viewing existing contacts for a customer during booking flow
 * Does NOT allow mutations (add/edit/delete - those require portal authentication)
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';

/**
 * GET /api/scheduler/customer-contacts?customerId=123
 * Retrieve contacts for a customer (read-only, for contact selection during booking)
 * 
 * Security: Public endpoint, but requires valid ServiceTitan customer ID
 * Returns masked phone/email for privacy (e.g., "(512) ***-**34" or "j***@example.com")
 */
export async function GET(req: NextRequest) {
  try {
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

    console.log(`[Scheduler] Fetching contacts for customer ${customerId}`);

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
 * Mask contact values for privacy
 * Phone: (512) ***-**34
 * Email: j***@example.com
 */
function maskContactValue(value: string, type: string): string {
  if (type === 'Email') {
    const [localPart, domain] = value.split('@');
    if (!localPart || !domain) return value;
    
    // Show first character and domain
    const maskedLocal = localPart[0] + '***';
    return `${maskedLocal}@${domain}`;
  }
  
  if (type === 'MobilePhone' || type === 'Phone') {
    // Extract digits only
    const digits = value.replace(/\D/g, '');
    if (digits.length === 10) {
      // Show area code and last 2 digits: (512) ***-**34
      return `(${digits.slice(0, 3)}) ***-**${digits.slice(-2)}`;
    }
  }
  
  return value; // Return as-is if format doesn't match
}
