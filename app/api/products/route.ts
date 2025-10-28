/**
 * Products API - Get All Products
 * 
 * Returns all active products/memberships for store
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const products = await storage.getProducts();
    
    // Filter for active products only
    const activeProducts = products.filter(p => p.active);
    
    return NextResponse.json({
      products: activeProducts,
      count: activeProducts.length,
    });
  } catch (error) {
    console.error('[Products API] Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
