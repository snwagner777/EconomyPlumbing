/**
 * Customer Portal - Individual Contact Management API
 * 
 * AUTHENTICATED ENDPOINT - Requires customer login via phone-based SMS 2FA
 * Allows customers to update or delete individual contacts
 * 
 * Security: ServiceTitan v2 API as single source of truth, session-based authentication with ownership validation
 * Business Rule: Cannot delete last remaining contact (min 1 contact required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { SessionData, sessionOptions } from '@/lib/session';
import { serviceTitanCRM } from '@/server/lib/servicetitan/crm';
import { checkRateLimit } from '@/server/lib/rateLimit';
import { logCustomerAction, extractTraceId } from '@/server/lib/auditLog';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/customer-portal/contacts/[id]
 * Update contact person or contact method
 * 
 * Body can contain:
 * - name: Update contact person name
 * - phone: Update mobile phone number
 * - email: Update email address
 * 
 * Security: Validates contact belongs to authenticated customer
 */
export async function PATCH(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const contactId = id; // ServiceTitan contact IDs are GUIDs (strings)

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
    const { name, phone, email, phoneMethodId, emailMethodId } = body;

    // Validation
    if (!name && !phone && !email) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'At least one field (name, phone, or email) must be provided' },
        { status: 400 }
      );
    }

    // Validate phone if provided
    if (phone) {
      const phoneDigits = phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        return NextResponse.json(
          { code: 'VALIDATION_ERROR', message: 'Phone number must be 10 digits' },
          { status: 400 }
        );
      }
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

    // Verify ownership: contact must belong to authenticated customer OR their locations
    // First check customer-level contacts
    const customerIdNum = parseInt(customerId, 10); // ServiceTitan API requires numeric ID
    const customerContacts = await serviceTitanCRM.getCustomerContacts(customerId);
    let contactToUpdate = customerContacts.find(c => c.id === contactId);
    
    // If not found at customer level, check all location contacts
    if (!contactToUpdate) {
      const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      const locations = await serviceTitan.getAllCustomerLocations(customerIdNum);
      
      // Check each location's contacts
      for (const location of locations) {
        const locationContacts = await serviceTitanCRM.getLocationContacts(location.id);
        contactToUpdate = locationContacts.find(c => c.id === contactId);
        if (contactToUpdate) break; // Found it!
      }
    }

    if (!contactToUpdate) {
      console.warn(`[Customer Portal] Unauthorized access: customer ${customerId} tried to update contact ${contactId}`);
      return NextResponse.json(
        { code: 'FORBIDDEN', message: 'Unauthorized: Contact does not belong to your account' },
        { status: 403 }
      );
    }

    console.log(`[Customer Portal] Updating contact ${contactId} for customer ${customerId}`);

    // Update contact person name if provided
    if (name) {
      await serviceTitanCRM.updateContactPerson(contactId, { name });
    }

    // Update phone number if provided
    if (phone && phoneMethodId) {
      await serviceTitanCRM.updateContactMethod(contactId, phoneMethodId, {
        value: phone.replace(/\D/g, ''),
      });
    }

    // Update email if provided
    if (email && emailMethodId) {
      await serviceTitanCRM.updateContactMethod(contactId, emailMethodId, {
        value: email.trim(),
      });
    }

    console.log(`[Customer Portal] ✅ Contact ${contactId} updated for customer ${customerId}`);

    // Audit log
    const changes = [];
    if (name) changes.push(`name: ${name}`);
    if (phone) changes.push(`phone: ${phone.replace(/\D/g, '')}`);
    if (email) changes.push(`email: ${email.trim()}`);
    await logCustomerAction({
      customerId,
      action: 'update',
      entityType: 'contact',
      entityId: contactId,
      payloadSummary: `Updated contact: ${changes.join(', ')}`,
    });

    // Fetch updated contact
    const updatedContacts = await serviceTitanCRM.getCustomerContacts(customerId);
    const updatedContact = updatedContacts.find(c => c.id === contactId);

    return NextResponse.json({
      success: true,
      contact: updatedContact,
      message: 'Contact updated successfully',
    });

  } catch (error: any) {
    console.error('[Customer Portal] Update contact error:', error);
    const traceId = extractTraceId(error);
    if (traceId) {
      console.error(`[Customer Portal] ServiceTitan error traceId: ${traceId}`);
    }

    return NextResponse.json(
      { 
        code: 'UPDATE_FAILED',
        message: 'Failed to update contact', 
        details: error.message || 'Unknown error',
        traceId
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customer-portal/contacts/[id]
 * Delete a contact
 * 
 * Security: Validates contact belongs to authenticated customer
 * Business Rule: Cannot delete if this is the last remaining contact
 */
export async function DELETE(req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const contactId = id; // ServiceTitan contact IDs are GUIDs (strings)

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

    console.log(`[Customer Portal] Deleting contact ${contactId} for customer ${customerId}`);

    // Verify ownership: contact must belong to authenticated customer OR their locations
    // First check customer-level contacts
    const customerIdNum = parseInt(customerId, 10); // ServiceTitan API requires numeric ID
    const customerContacts = await serviceTitanCRM.getCustomerContacts(customerId);
    let contactToDelete = customerContacts.find(c => c.id === contactId);
    let allContacts = [...customerContacts];
    
    // If not found at customer level, check all location contacts
    if (!contactToDelete) {
      const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
      const serviceTitan = getServiceTitanAPI();
      const locations = await serviceTitan.getAllCustomerLocations(customerIdNum);
      
      // Check each location's contacts and aggregate for count
      for (const location of locations) {
        const locationContacts = await serviceTitanCRM.getLocationContacts(location.id);
        allContacts.push(...locationContacts);
        if (!contactToDelete) {
          contactToDelete = locationContacts.find(c => c.id === contactId);
        }
      }
    }

    if (!contactToDelete) {
      console.warn(`[Customer Portal] Unauthorized access: customer ${customerId} tried to delete contact ${contactId}`);
      return NextResponse.json(
        { code: 'FORBIDDEN', message: 'Unauthorized: Contact does not belong to your account' },
        { status: 403 }
      );
    }

    // Enforce minimum 1 contact rule
    // Count unique contacts with mobile phone or email (customer-facing contacts)
    // Deduplicate by contact ID since same contact can appear in multiple locations
    const uniqueContacts = Array.from(
      new Map(allContacts.map(c => [c.id, c])).values()
    );
    const customerFacingContacts = uniqueContacts.filter(contact => 
      contact.methods?.some(m => m.type.includes('Phone') || m.type === 'Email')
    );

    if (customerFacingContacts.length <= 1) {
      return NextResponse.json(
        { code: 'BUSINESS_RULE_VIOLATION', message: 'Cannot delete the last contact. Your account must have at least one contact method.' },
        { status: 400 }
      );
    }

    // Delete the contact
    await serviceTitanCRM.deleteContact(contactId);

    console.log(`[Customer Portal] ✅ Contact ${contactId} deleted for customer ${customerId}`);

    // Audit log
    await logCustomerAction({
      customerId,
      action: 'delete',
      entityType: 'contact',
      entityId: contactId,
      payloadSummary: 'Deleted contact',
    });

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully',
    });

  } catch (error: any) {
    console.error('[Customer Portal] Delete contact error:', error);
    const traceId = extractTraceId(error);
    if (traceId) {
      console.error(`[Customer Portal] ServiceTitan error traceId: ${traceId}`);
    }

    return NextResponse.json(
      { 
        code: 'DELETE_FAILED',
        message: 'Failed to delete contact', 
        details: error.message || 'Unknown error',
        traceId
      },
      { status: 500 }
    );
  }
}
