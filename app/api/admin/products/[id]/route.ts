import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function PATCH(
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
    const updates = await req.json();
    const updatedProduct = await storage.updateProduct(id, updates);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('[Products] Error updating product:', error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 }
    );
  }
}
