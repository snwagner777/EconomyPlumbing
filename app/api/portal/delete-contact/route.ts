import { NextRequest, NextResponse } from 'next/server';
import { getServiceTitanAPI } from '@/server/lib/serviceTitan';

export async function DELETE(req: NextRequest) {
  try {
    const { customerId, contactId } = await req.json();

    if (!customerId || !contactId) {
      return NextResponse.json(
        { error: "Customer ID and Contact ID required" },
        { status: 400 }
      );
    }

    console.log(`[Portal] Deleting contact ${contactId} for customer ${customerId}...`);

    const serviceTitan = getServiceTitanAPI();
    await serviceTitan.deleteCustomerContact(parseInt(customerId), parseInt(contactId));

    return NextResponse.json({ success: true, message: "Contact deleted successfully" });
  } catch (error: any) {
    console.error("[Portal] Delete contact error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete contact" },
      { status: 500 }
    );
  }
}
