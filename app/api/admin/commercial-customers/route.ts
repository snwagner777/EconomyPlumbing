import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { insertCommercialCustomerSchema } from '@shared/schema';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const customers = await storage.getAllCommercialCustomers();
    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error("[Commercial Customers] Error fetching all customers:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const body = await req.json();
    const data = insertCommercialCustomerSchema.parse(body);
    
    const customer = await storage.createCommercialCustomer(data);
    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("[Commercial Customers] Error creating customer:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
