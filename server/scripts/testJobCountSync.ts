#!/usr/bin/env tsx
/**
 * Test script to sync a few customers with job counts
 */

async function testJobCountSync() {
  console.log('[Test Job Count Sync] Starting test of job count sync...');
  
  try {
    // Import required modules
    const { getServiceTitanAPI } = await import('../lib/serviceTitan');
    const { db } = await import('../db');
    const { serviceTitanCustomers } = await import('@shared/schema');
    const { sql } = await import('drizzle-orm');
    
    // Get ServiceTitan API instance
    const serviceTitan = getServiceTitanAPI();
    
    console.log('[Test Job Count Sync] Fetching first 5 customers...');
    
    // Fetch just the first 5 customers to test
    const result = await serviceTitan.request<{ data: any[]; hasMore: boolean }>('/customers?page=1&pageSize=5');
    const customers = result.data || [];
    
    console.log(`[Test Job Count Sync] Found ${customers.length} customers to test`);
    
    for (const customer of customers) {
      try {
        // Fetch job count for this customer using the correct endpoint
        let jobCount = 0;
        
        // Jobs API uses different base path (jpm/v2 instead of crm/v2)
        const jobsBaseUrl = `https://api.servicetitan.io/jpm/v2/tenant/${serviceTitan.config.tenantId}`;
        
        // First check if customer has any completed jobs
        const response = await fetch(
          `${jobsBaseUrl}/jobs?customerId=${customer.id}&jobStatus=Completed&pageSize=1`,
          {
            headers: {
              'Authorization': `Bearer ${serviceTitan.config.accessToken}`,
              'ST-App-Key': serviceTitan.config.appKey,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const jobsResult = await response.json();
          
          if (jobsResult.data && jobsResult.data.length > 0) {
            // Customer has at least one completed job
            // Fetch up to 100 to get a more accurate count
            const fullResponse = await fetch(
              `${jobsBaseUrl}/jobs?customerId=${customer.id}&jobStatus=Completed&pageSize=100`,
              {
                headers: {
                  'Authorization': `Bearer ${serviceTitan.config.accessToken}`,
                  'ST-App-Key': serviceTitan.config.appKey,
                  'Content-Type': 'application/json',
                },
              }
            );
            
            if (fullResponse.ok) {
              const fullJobsResult = await fullResponse.json();
              jobCount = fullJobsResult.data?.length || 0;
              // If there are more than 100, cap at 100 for display
              if (fullJobsResult.hasMore) {
                jobCount = 100;
              }
            }
          }
        }
        
        console.log(`[Test Job Count Sync] Customer ${customer.id} (${customer.name}): ${jobCount} completed jobs`);
        
        // Update the customer in the database
        await db.insert(serviceTitanCustomers).values({
          id: customer.id,
          name: customer.name || 'Unknown',
          type: customer.type || 'Residential',
          street: customer.address?.street || null,
          city: customer.address?.city || null,
          state: customer.address?.state || null,
          zip: customer.address?.zip || null,
          active: customer.active ?? true,
          balance: customer.balance?.toString() || '0.00',
          jobCount: jobCount,
        }).onConflictDoUpdate({
          target: serviceTitanCustomers.id,
          set: {
            name: customer.name || 'Unknown',
            type: customer.type || 'Residential',
            street: customer.address?.street || null,
            city: customer.address?.city || null,
            state: customer.address?.state || null,
            zip: customer.address?.zip || null,
            active: customer.active ?? true,
            balance: customer.balance?.toString() || '0.00',
            jobCount: jobCount,
            lastSyncedAt: new Date(),
          },
        });
        
      } catch (error) {
        console.error(`[Test Job Count Sync] Error processing customer ${customer.id}:`, error);
      }
    }
    
    // Check the results in the database
    const stats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN job_count > 0 THEN 1 END) as customers_with_jobs,
        MIN(job_count) as min_jobs,
        MAX(job_count) as max_jobs,
        AVG(job_count) as avg_jobs
      FROM service_titan_customers
      WHERE id IN (${sql.raw(customers.map(c => c.id).join(','))})
    `);
    
    console.log('[Test Job Count Sync] ✅ Test complete! Database stats for test customers:', stats.rows[0]);
    
    process.exit(0);
  } catch (error) {
    console.error('[Test Job Count Sync] ❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testJobCountSync();