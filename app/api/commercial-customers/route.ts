import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const customers = await storage.getActiveCommercialCustomers();
    return NextResponse.json(customers);
  } catch (error: any) {
    console.error("[Commercial Customers] Error fetching customers:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
