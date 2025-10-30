import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';

export async function PUT(req: NextRequest) {
  try {
    const { customerId, email, phone } = await req.json();

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    console.log(`[Portal] Updating contacts for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    await serviceTitan.updateCustomerContacts(parseInt(customerId), {
      email,
      phone
    });

    return NextResponse.json({ success: true, message: "Contact information updated successfully" });
  } catch (error: any) {
    console.error("[Portal] Update contacts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update contact information" },
      { status: 500 }
    );
  }
}
