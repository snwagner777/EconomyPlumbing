/**
 * Product API - Get/Update Single Product
 * 
 * GET: Returns product by slug (public)
 * PATCH: Updates product by ID (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await storage.getProductBySlug(slug);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Don't return inactive products to public
    if (!product.active) {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product });
  } catch (error) {
    console.error('[Products API] Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await req.json();
    
    // PATCH uses numeric ID from Express, so slug param is actually the ID
    const updatedProduct = await storage.updateProduct(slug, body);
    
    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error('[Products API] Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
