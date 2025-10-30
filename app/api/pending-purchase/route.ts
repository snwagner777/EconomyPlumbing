import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function POST(req: NextRequest) {
  try {
    const { paymentIntentId, productId, customerType, customerName, companyName, 
            contactPersonName, street, city, state, zip, phone, email } = await req.json();

    if (!paymentIntentId || !productId || !customerType || !street || !city || 
        !state || !zip || !phone || !email) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (customerType === 'residential' && !customerName) {
      return NextResponse.json(
        { message: "Customer name is required for residential" },
        { status: 400 }
      );
    }

    if (customerType === 'commercial' && (!companyName || !contactPersonName)) {
      return NextResponse.json(
        { message: "Company name and contact person are required for commercial" },
        { status: 400 }
      );
    }

    const pendingPurchase = await storage.createPendingPurchase({
      paymentIntentId,
      productId,
      customerType,
      customerName: customerType === 'residential' ? customerName : null,
      companyName: customerType === 'commercial' ? companyName : null,
      contactPersonName: customerType === 'commercial' ? contactPersonName : null,
      street,
      city,
      state,
      zip,
      phone,
      email,
    });

    return NextResponse.json({ success: true, purchase: pendingPurchase });
  } catch (error: any) {
    console.error("[Pending Purchase] Error creating pending purchase:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create pending purchase" },
      { status: 500 }
    );
  }
}
