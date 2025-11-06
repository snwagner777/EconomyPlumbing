import { NextRequest, NextResponse } from 'next/server';

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

    console.log(`[ServiceTitan] Fetching customer data: ${customerId}`);

    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();
    
    const customerIdNum = parseInt(customerId, 10);
    
    if (Number.isNaN(customerIdNum)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    // Fetch customer tags from local database
    const { db } = await import('@/server/storage');
    const { serviceTitanCustomers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const localCustomer = await db
      .select({ customerTags: serviceTitanCustomers.customerTags })
      .from(serviceTitanCustomers)
      .where(eq(serviceTitanCustomers.id, customerIdNum))
      .limit(1)
      .then(rows => rows[0]);

    // Fetch all customer data in parallel from ServiceTitan APIs
    const [customer, appointments, invoices, memberships, estimates] = await Promise.all([
      serviceTitan.getCustomer(customerIdNum),
      serviceTitan.getCustomerAppointments(customerIdNum).catch(() => []),
      serviceTitan.getCustomerInvoices(customerIdNum).catch(() => []),
      serviceTitan.getCustomerMemberships(customerIdNum).catch(() => []),
      serviceTitan.getCustomerEstimates(customerIdNum).catch(() => [])
    ]);
    
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    console.log(`[ServiceTitan] Fetched data for customer ${customerId}:`, {
      appointments: (appointments || []).length,
      invoices: (invoices || []).length,
      memberships: (memberships || []).length,
      estimates: (estimates || []).length
    });

    // Return comprehensive customer data with tags from local database
    return NextResponse.json({ 
      customer: {
        ...customer,
        customerTags: localCustomer?.customerTags || [],
        appointments,
        invoices,
        memberships,
        estimates
      }
    });
  } catch (error: any) {
    console.error('[ServiceTitan] Error fetching customer:', error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}
