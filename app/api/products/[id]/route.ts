import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
