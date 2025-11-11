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
    const { db } = await import('@/server/db');
    const { serviceTitanCustomers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    
    const localCustomer = await db
      .select({ customerTags: serviceTitanCustomers.customerTags })
      .from(serviceTitanCustomers)
      .where(eq(serviceTitanCustomers.id, customerIdNum))
      .limit(1)
      .then(rows => rows[0]);

    // Import new services for estimates and pricebook
    const { serviceTitanEstimates } = await import('@/server/lib/servicetitan/estimates');
    const { serviceTitanAuth } = await import('@/server/lib/servicetitan/auth');
    
    // Fetch all customer data in parallel from ServiceTitan APIs
    const [customer, rawAppointments, rawInvoices, memberships, rawEstimates] = await Promise.all([
      serviceTitan.getCustomer(customerIdNum),
      serviceTitan.getCustomerAppointments(customerIdNum).catch(() => []),
      serviceTitan.getCustomerInvoices(customerIdNum).catch(() => []),
      serviceTitan.getCustomerMemberships(customerIdNum).catch(() => []),
      serviceTitanEstimates.getEstimates(customerIdNum).catch(() => [])
    ]);
    
    // Enrich appointments with locationId from jobs
    const tenantId = serviceTitanAuth.getTenantId();
    const jobCache = new Map<number, any>();
    
    // Helper to get job and extract locationId
    const getJobLocationId = async (jobId: number): Promise<number | null> => {
      if (jobCache.has(jobId)) {
        return jobCache.get(jobId)?.locationId || null;
      }
      
      try {
        const job = await serviceTitanAuth.makeRequest<any>(
          `jpm/v2/tenant/${tenantId}/jobs/${jobId}`
        );
        jobCache.set(jobId, job);
        return job?.locationId || null;
      } catch (error) {
        console.error(`[ServiceTitan] Error fetching job ${jobId}:`, error);
        return null;
      }
    };
    
    // Enrich appointments with locationId
    const appointments = await Promise.all(
      rawAppointments.map(async (apt: any) => {
        // Extract jobId from jobNumber if needed (format: "JOB-12345")
        const jobIdFromNumber = apt.jobNumber ? parseInt(apt.jobNumber.replace(/\D/g, ''), 10) : null;
        const jobId = apt.jobId || jobIdFromNumber;
        
        const locationId = jobId ? await getJobLocationId(jobId) : null;
        
        return {
          ...apt,
          locationId,
        };
      })
    );
    
    // Enrich estimates with locationId from jobs
    const enrichedEstimates = await Promise.all(
      rawEstimates.map(async (est: any) => {
        const locationId = est.jobId ? await getJobLocationId(est.jobId) : null;
        
        return {
          ...est,
          locationId,
        };
      })
    );
    
    // Enrich estimates with pricebook data (images, descriptions, etc.)
    const estimates = await serviceTitanEstimates.enrichEstimatesWithPricebook(enrichedEstimates);
    
    // Enrich invoices with locationId (try to extract from jobNumber or query per-location)
    // For now, invoices will remain without locationId since they don't have jobId
    // TODO: Query invoices per-location in future enhancement
    const invoices = rawInvoices;
    
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
