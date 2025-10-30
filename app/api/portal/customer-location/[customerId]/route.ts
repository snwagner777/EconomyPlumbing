import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID required" },
        { status: 400 }
      );
    }

    console.log(`[Portal] Fetching location for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    const location = await serviceTitan.getCustomerPrimaryLocation(parseInt(customerId));

    if (!location) {
      return NextResponse.json(
        { error: "No location found for customer" },
        { status: 404 }
      );
    }

    return NextResponse.json({ location });
  } catch (error: any) {
    console.error("[Portal] Get location error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer location" },
      { status: 500 }
    );
  }
}
