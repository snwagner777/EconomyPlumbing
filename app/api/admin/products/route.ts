/**
 * Admin API - Product Management
 * 
 * Create and manage products/memberships
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string(),
  price: z.number().int().positive(),
  stripePriceId: z.string().optional(),
  stripeProductId: z.string().optional(),
  active: z.boolean().optional(),
  features: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const allProducts = await storage.getProducts();
    const products = includeInactive 
      ? allProducts 
      : allProducts.filter(p => p.active);

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error) {
    console.error('[Admin Products API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = productSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const product = await storage.createProduct(result.data);

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('[Admin Products API] Error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
