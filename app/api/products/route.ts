/**
 * Products API
 * 
 * GET: Returns all active products/memberships
 * POST: Creates a new product with sitemap notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { notifySearchEnginesNewPage } from '@/server/lib/sitemapPing';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newProduct = await storage.createProduct(body);
    
    // Notify search engines about new product page
    notifySearchEnginesNewPage('product');
    
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('[Products API] Error creating product:', error);
    return NextResponse.json(
      { message: "Failed to create product" },
      { status: 500 }
    );
  }
}
