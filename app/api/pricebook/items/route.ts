/**
 * API Endpoint: Batch Fetch Pricebook Items with Images
 * 
 * Used by estimate/invoice viewers to get product images and details
 * from ServiceTitan pricebook for display.
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceTitanPricebook } from '@/server/lib/servicetitan/pricebook';
import { z } from 'zod';

const RequestSchema = z.object({
  items: z.array(
    z.object({
      skuId: z.number(),
      type: z.enum(['Material', 'Equipment', 'Service']),
    })
  ).min(1).max(100), // Limit to 100 items per request
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { items } = parsed.data;

    console.log(`[Pricebook API] Fetching ${items.length} pricebook items`);

    // Batch fetch all pricebook items
    const pricebookData = await serviceTitanPricebook.getPricebookItems(items);

    // Convert Map to object for JSON response
    const response: Record<string, any> = {};
    pricebookData.forEach((item, key) => {
      response[key] = {
        id: item.id,
        type: item.type,
        code: item.code,
        displayName: item.displayName,
        description: item.description,
        images: item.images,
        price: item.price,
        memberPrice: item.memberPrice,
      };
    });

    console.log(`[Pricebook API] Successfully fetched ${Object.keys(response).length} items`);

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('[Pricebook API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricebook items' },
      { status: 500 }
    );
  }
}
