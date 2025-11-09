/**
 * Admin API - Individual SMS Contact Operations
 * 
 * PATCH: Update contact details, opt-in/opt-out
 * DELETE: Remove contact (TCPA-compliant hard delete)
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { db } from '@/server/db';
import { smsContacts } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  customFields: z.record(z.string()).optional(),
  providerListIds: z.array(z.string()).optional(),
  optedIn: z.boolean().optional(),
  optedOut: z.boolean().optional(),
  optOutMethod: z.enum(['keyword', 'manual', 'support_request', 'link']).optional(),
  optOutReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);
    
    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    const body = await req.json();
    
    // Validate input
    const result = updateContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Handle opt-out (TCPA-compliant: force optedIn=false when opted out)
    const updateData: any = { ...result.data };
    if (result.data.optedOut === true) {
      updateData.optedIn = false; // Critical: ensure contact can't receive messages
      updateData.optOutTimestamp = new Date();
      if (!result.data.optOutMethod) {
        updateData.optOutMethod = 'manual';
      }
    }

    // Update contact
    const [updated] = await db
      .update(smsContacts)
      .set(updateData)
      .where(eq(smsContacts.id, contactId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    console.log('[Admin SMS Contacts API] Updated contact:', contactId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Admin SMS Contacts API] Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const contactId = parseInt(id);
    
    if (isNaN(contactId)) {
      return NextResponse.json({ error: 'Invalid contact ID' }, { status: 400 });
    }

    // Delete contact (cascades to related records)
    const [deleted] = await db
      .delete(smsContacts)
      .where(eq(smsContacts.id, contactId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    console.log('[Admin SMS Contacts API] Deleted contact:', contactId, deleted.phone);

    return NextResponse.json({ success: true, deletedContact: deleted });
  } catch (error) {
    console.error('[Admin SMS Contacts API] Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
