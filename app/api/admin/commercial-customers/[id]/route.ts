import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';
import { insertCommercialCustomerSchema } from '@shared/schema';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const updates = insertCommercialCustomerSchema.partial().parse(body);
    
    const customer = await storage.updateCommercialCustomer(id, updates);
    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error("[Commercial Customers] Error updating customer:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    await storage.deleteCommercialCustomer(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Commercial Customers] Error deleting customer:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
