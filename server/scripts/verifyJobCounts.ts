#!/usr/bin/env tsx
/**
 * Verify job counts in database are accurate by comparing with live API data
 */

async function verifyJobCounts() {
  console.log('[Verify Job Counts] Starting verification...');
  
  try {
    // Import required modules
    const { getServiceTitanAPI } = await import('../lib/serviceTitan');
    const { db } = await import('../db');
    const { serviceTitanCustomers } = await import('@shared/schema');
    const { sql } = await import('drizzle-orm');
    
    // Get ServiceTitan API instance
    const serviceTitan = getServiceTitanAPI();
    
    // Get customers with job counts from database
    const customersToVerify = await db.select()
      .from(serviceTitanCustomers)
      .where(sql`job_count > 0`)
      .orderBy(sql`job_count DESC`)
      .limit(5);
    
    console.log(`[Verify Job Counts] Verifying ${customersToVerify.length} customers with highest job counts...\n`);
    
    let matchCount = 0;
    let mismatchCount = 0;
    const mismatches: any[] = [];
    
    for (const dbCustomer of customersToVerify) {
      try {
        // Fetch current job count from API with pagination
        let apiJobCount = 0;
        const jobsBaseUrl = `https://api.servicetitan.io/jpm/v2/tenant/${serviceTitan.config.tenantId}`;
        let page = 1;
        let hasMore = true;
        const pageSize = 100;
        
        while (hasMore) {
          const response = await fetch(
            `${jobsBaseUrl}/jobs?customerId=${dbCustomer.id}&jobStatus=Completed&page=${page}&pageSize=${pageSize}`,
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
              apiJobCount += jobsResult.data.length;
            }
            
            hasMore = jobsResult.hasMore || false;
            page++;
            
            // Safety limit
            if (page > 50) {
              console.log(`[Verify Job Counts] ⚠️ Customer ${dbCustomer.id} has over 5000 jobs, stopping`);
              break;
            }
          } else {
            hasMore = false;
          }
        }
        
        // Compare counts
        const match = apiJobCount === dbCustomer.jobCount;
        if (match) {
          matchCount++;
          console.log(`✅ ${dbCustomer.name}: Database=${dbCustomer.jobCount}, API=${apiJobCount} - MATCH`);
        } else {
          mismatchCount++;
          mismatches.push({
            id: dbCustomer.id,
            name: dbCustomer.name,
            dbCount: dbCustomer.jobCount,
            apiCount: apiJobCount,
            difference: apiJobCount - dbCustomer.jobCount
          });
          console.log(`❌ ${dbCustomer.name}: Database=${dbCustomer.jobCount}, API=${apiJobCount} - MISMATCH (diff: ${apiJobCount - dbCustomer.jobCount})`);
        }
        
      } catch (error) {
        console.error(`[Verify Job Counts] Error verifying customer ${dbCustomer.id}:`, error);
      }
    }
    
    // Summary
    console.log('\n[Verify Job Counts] Verification Summary:');
    console.log(`  ✅ Matches: ${matchCount}/${customersToVerify.length}`);
    console.log(`  ❌ Mismatches: ${mismatchCount}/${customersToVerify.length}`);
    
    if (mismatches.length > 0) {
      console.log('\n[Verify Job Counts] Mismatches found - these need to be resynced:');
      mismatches.forEach(m => {
        console.log(`  • ${m.name} (ID: ${m.id}): DB=${m.dbCount}, API=${m.apiCount}, Diff=${m.difference}`);
      });
      
      // Update mismatched records
      console.log('\n[Verify Job Counts] Updating mismatched records...');
      for (const mismatch of mismatches) {
        await db.update(serviceTitanCustomers)
          .set({ 
            jobCount: mismatch.apiCount,
            lastSyncedAt: new Date()
          })
          .where(sql`id = ${mismatch.id}`);
      }
      console.log('[Verify Job Counts] ✅ Updated all mismatched records');
    } else {
      console.log('\n[Verify Job Counts] ✅ All job counts are accurate!');
    }
    
    // Show final database state
    const finalTopCustomers = await db.select()
      .from(serviceTitanCustomers)
      .orderBy(sql`job_count DESC`)
      .limit(5);
    
    console.log('\n[Verify Job Counts] Final top 5 customers by job count:');
    finalTopCustomers.forEach(c => {
      console.log(`  • ${c.name}: ${c.jobCount} jobs`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('[Verify Job Counts] ❌ Error:', error);
    process.exit(1);
  }
}

// Run verification
verifyJobCounts();