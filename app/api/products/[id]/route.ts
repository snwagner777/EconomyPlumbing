import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const updatedProduct = await storage.updateProduct(params.id, body);
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('[Products] Error updating product:', error);
    return NextResponse.json(
      { message: "Failed to update product" },
      { status: 500 }
    );
  }
}
