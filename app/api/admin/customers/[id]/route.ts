/**
 * Admin API - Single Customer Management
 * 
 * Get, update, or delete individual customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';
import { z } from 'zod';

const customerUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(['Residential', 'Commercial']).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobilePhone: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
  active: z.boolean().optional(),
  preferredContactMethod: z.string().optional().nullable(),
  customerTags: z.array(z.string()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const customer = await storage.getCustomerByServiceTitanId(parseInt(id, 10));

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('[Admin Customer API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

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
    const body = await req.json();

    // Validate input
    const result = customerUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const customer = await storage.updateCustomerXlsx(parseInt(id, 10), result.data);

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('[Admin Customer API] Error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}
