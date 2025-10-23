#!/usr/bin/env tsx
/**
 * Test script to verify complete job counting with pagination
 */

async function testCompleteJobCount() {
  console.log('[Test Complete Job Count] Starting test of complete job counting...');
  
  try {
    // Import required modules
    const { getServiceTitanAPI } = await import('../lib/serviceTitan');
    const { db } = await import('../db');
    const { customersXlsx } = await import('@shared/schema');
    const { sql, desc } = await import('drizzle-orm');
    
    // Get ServiceTitan API instance
    const serviceTitan = getServiceTitanAPI();
    
    // First, find a customer we know has jobs to test pagination
    const existingHighJobCustomers = await db.select()
      .from(customersXlsx)
      .where(sql`job_count > 50`)
      .orderBy(desc(customersXlsx.jobCount))
      .limit(3);
    
    console.log(`[Test Complete Job Count] Found ${existingHighJobCustomers.length} existing high-job customers to retest`);
    
    // Test fetching just a few customers including any high-job ones
    const result = await serviceTitan.request<{ data: any[]; hasMore: boolean }>('/customers?page=1&pageSize=5');
    const testCustomers = result.data || [];
    
    console.log(`[Test Complete Job Count] Testing with ${testCustomers.length} customers`);
    
    let customersWithJobs = 0;
    let totalJobsCounted = 0;
    let highValueCustomers: any[] = [];
    
    for (const customer of testCustomers) {
      try {
        // Fetch ALL jobs for this customer with pagination
        let jobCount = 0;
        const jobsBaseUrl = `https://api.servicetitan.io/jpm/v2/tenant/${serviceTitan.config.tenantId}`;
        let page = 1;
        let hasMore = true;
        const pageSize = 100;
        let pagesProcessed = 0;
        
        while (hasMore) {
          const response = await fetch(
            `${jobsBaseUrl}/jobs?customerId=${customer.id}&jobStatus=Completed&page=${page}&pageSize=${pageSize}`,
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
              jobCount += jobsResult.data.length;
              pagesProcessed++;
            }
            
            hasMore = jobsResult.hasMore || false;
            page++;
            
            // Safety limit
            if (page > 50) {
              console.log(`[Test Complete Job Count] ⚠️ Customer ${customer.id} has over 5000 jobs, stopping`);
              break;
            }
          } else {
            hasMore = false;
          }
        }
        
        if (jobCount > 0) {
          customersWithJobs++;
          totalJobsCounted += jobCount;
        }
        
        // Log details
        if (pagesProcessed > 1) {
          console.log(`[Test Complete Job Count] Customer ${customer.id} (${customer.name}): ${jobCount} jobs across ${pagesProcessed} pages`);
        } else {
          console.log(`[Test Complete Job Count] Customer ${customer.id} (${customer.name}): ${jobCount} jobs`);
        }
        
        if (jobCount > 100) {
          highValueCustomers.push({ id: customer.id, name: customer.name, jobCount });
        }
        
        // Update the customer in the database
        await db.insert(customersXlsx).values({
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
          target: customersXlsx.id,
          set: {
            jobCount: jobCount,
            lastSyncedAt: new Date(),
          },
        });
        
      } catch (error) {
        console.error(`[Test Complete Job Count] Error processing customer ${customer.id}:`, error);
      }
    }
    
    // Show summary
    console.log('\n[Test Complete Job Count] ✅ Test Summary:');
    console.log(`  - Customers tested: ${testCustomers.length}`);
    console.log(`  - Customers with jobs: ${customersWithJobs}`);
    console.log(`  - Total jobs counted: ${totalJobsCounted}`);
    console.log(`  - Average jobs per customer: ${customersWithJobs > 0 ? (totalJobsCounted / customersWithJobs).toFixed(1) : 0}`);
    
    if (highValueCustomers.length > 0) {
      console.log(`\n[Test Complete Job Count] 🌟 High-value customers found (100+ jobs):`);
      highValueCustomers.forEach(c => {
        console.log(`    • ${c.name}: ${c.jobCount} jobs`);
      });
    }
    
    // Check database for highest job counts
    const topCustomers = await db.select()
      .from(customersXlsx)
      .orderBy(desc(customersXlsx.jobCount))
      .limit(5);
    
    console.log('\n[Test Complete Job Count] 📊 Top 5 customers by job count in database:');
    topCustomers.forEach(c => {
      console.log(`    • ${c.name}: ${c.jobCount} jobs`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('[Test Complete Job Count] ❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testCompleteJobCount();