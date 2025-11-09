/**
 * Admin API - SMS Contacts Management
 * 
 * CRUD operations for SMS marketing contacts
 * Includes TCPA compliance tracking and SimpleTexting sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, getSession } from '@/lib/session';
import { db } from '@/server/db';
import { smsContacts, insertSmsContactSchema } from '@shared/schema';
import { desc, eq, and, or, like, sql, count } from 'drizzle-orm';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');
    const optedIn = searchParams.get('optedIn');
    const providerListId = searchParams.get('providerListId');
    const offset = (page - 1) * limit;

    // Build filters
    const filters = [];
    if (search) {
      filters.push(
        or(
          like(smsContacts.phone, `%${search}%`),
          like(smsContacts.firstName, `%${search}%`),
          like(smsContacts.lastName, `%${search}%`),
          like(smsContacts.email, `%${search}%`)
        )
      );
    }
    if (optedIn === 'true') {
      filters.push(eq(smsContacts.optedIn, true));
    } else if (optedIn === 'false') {
      filters.push(eq(smsContacts.optedIn, false));
    }
    if (providerListId) {
      filters.push(sql`${smsContacts.providerListIds} @> ARRAY[${providerListId}]::text[]`);
    }

    // Get total count
    const [{ totalCount }] = await db
      .select({ totalCount: count() })
      .from(smsContacts)
      .where(filters.length > 0 ? and(...filters) : undefined);

    // Get paginated contacts
    const contacts = await db
      .select()
      .from(smsContacts)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(smsContacts.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      contacts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('[Admin SMS Contacts API] Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession();
    const body = await req.json();
    
    // Validate input
    const result = insertSmsContactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Normalize phone number
    let normalizedPhone = result.data.phone.replace(/\D/g, '');
    if (normalizedPhone.length === 11 && normalizedPhone.startsWith('1')) {
      normalizedPhone = normalizedPhone.substring(1);
    }

    // Check if contact already exists
    const existing = await db
      .select()
      .from(smsContacts)
      .where(eq(smsContacts.phone, normalizedPhone))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Contact with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create contact with audit trail
    const [contact] = await db
      .insert(smsContacts)
      .values({
        ...result.data,
        phone: normalizedPhone,
        createdBy: session?.user?.email || 'admin',
      })
      .returning();

    console.log('[Admin SMS Contacts API] Created contact:', contact.id, normalizedPhone);

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('[Admin SMS Contacts API] Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
