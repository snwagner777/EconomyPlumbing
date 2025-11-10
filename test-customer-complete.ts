/**
 * Complete test of customer's data in ServiceTitan
 * Run with: npx tsx test-customer-complete.ts
 */

import { serviceTitanAuth } from './server/lib/servicetitan/auth';

async function testCustomerComplete() {
  try {
    const customerId = 3153460;
    const tenantId = serviceTitanAuth.getTenantId();
    
    console.log(`=== Complete Data Test for Customer ${customerId} ===\n`);
    
    // 1. Get customer details
    console.log('👤 Customer Details:\n');
    const customer = await serviceTitanAuth.makeRequest<any>(
      `crm/v2/tenant/${tenantId}/customers/${customerId}`
    );
    console.log(`Name: ${customer.name}`);
    console.log(`ID: ${customer.id}`);
    console.log(`Type: ${customer.type || 'N/A'}`);
    console.log(`Balance: $${((customer.balance || 0) / 100).toFixed(2)}`);
    console.log('\n');
    
    // 2. Get customer's locations
    console.log('📍 Customer Locations:\n');
    try {
      const locationsParams = new URLSearchParams({
        customerId: customerId.toString(),
        page: '1',
        pageSize: '10',
      });
      const locations = await serviceTitanAuth.makeRequest<any>(
        `crm/v2/tenant/${tenantId}/locations?${locationsParams.toString()}`
      );
      console.log(`Found ${locations.data?.length || 0} locations`);
      if (locations.data && locations.data.length > 0) {
        locations.data.forEach((loc: any) => {
          console.log(`  - Location ${loc.id}: ${loc.address?.street || 'N/A'}`);
        });
      }
      console.log('\n');
    } catch (e: any) {
      console.log('Error fetching locations:', e.message, '\n');
    }
    
    // 3. Get jobs for this customer
    console.log('🔧 Customer Jobs:\n');
    try {
      const jobsParams = new URLSearchParams({
        customerId: customerId.toString(),
        page: '1',
        pageSize: '20',
      });
      const jobs = await serviceTitanAuth.makeRequest<any>(
        `jpm/v2/tenant/${tenantId}/jobs?${jobsParams.toString()}`
      );
      console.log(`Found ${jobs.data?.length || 0} jobs`);
      
      if (jobs.data && jobs.data.length > 0) {
        for (const job of jobs.data.slice(0, 3)) { // Show first 3
          console.log(`\n  Job ${job.jobNumber}:`);
          console.log(`  - ID: ${job.id}`);
          console.log(`  - Summary: ${job.summary || 'N/A'}`);
          console.log(`  - Status: ${job.jobStatus || 'N/A'}`);
          console.log(`  - Created: ${job.createdOn || 'N/A'}`);
          
          // For each job, check for estimates
          try {
            const estimatesParams = new URLSearchParams({
              jobId: job.id.toString(),
              page: '1',
              pageSize: '10',
            });
            const estimates = await serviceTitanAuth.makeRequest<any>(
              `sales/v2/tenant/${tenantId}/estimates?${estimatesParams.toString()}`
            );
            
            const jobEstimates = estimates.data?.filter((e: any) => e.jobId === job.id) || [];
            console.log(`  - Estimates: ${jobEstimates.length}`);
            
            if (jobEstimates.length > 0) {
              jobEstimates.forEach((est: any) => {
                console.log(`    • Estimate ${est.id}: ${est.status.name} - $${(est.subtotal / 100).toFixed(2)}`);
                console.log(`      External Links: ${JSON.stringify(est.externalLinks)}`);
                if (est.externalLinks && est.externalLinks.length > 0) {
                  console.log(`      🎉 FOUND EXTERNAL LINK!`);
                  console.log(JSON.stringify(est.externalLinks, null, 2));
                }
              });
            }
          } catch (e: any) {
            console.log(`  - Error fetching estimates: ${e.message}`);
          }
        }
      }
      console.log('\n');
    } catch (e: any) {
      console.log('Error fetching jobs:', e.message, '\n');
    }
    
    // 4. Get appointments
    console.log('📅 Customer Appointments:\n');
    try {
      // Get appointments by date range
      const now = new Date();
      const past30Days = new Date(now);
      past30Days.setDate(past30Days.getDate() - 30);
      const future30Days = new Date(now);
      future30Days.setDate(future30Days.getDate() + 30);
      
      const apptParams = new URLSearchParams({
        startsOnOrAfter: past30Days.toISOString(),
        startsOnOrBefore: future30Days.toISOString(),
        page: '1',
        pageSize: '50',
      });
      
      const appointments = await serviceTitanAuth.makeRequest<any>(
        `jpm/v2/tenant/${tenantId}/appointments?${apptParams.toString()}`
      );
      
      // Filter for customer's jobs
      const customerJobIds = jobs.data?.map((j: any) => j.id) || [];
      const customerAppointments = appointments.data?.filter((a: any) => 
        customerJobIds.includes(a.jobId)
      ) || [];
      
      console.log(`Found ${customerAppointments.length} appointments in last 60 days`);
      
      if (customerAppointments.length > 0) {
        customerAppointments.slice(0, 3).forEach((apt: any) => {
          console.log(`  - Appointment ${apt.id}:`);
          console.log(`    Job: ${apt.jobId}`);
          console.log(`    Start: ${apt.start}`);
          console.log(`    Status: ${apt.status || 'N/A'}`);
        });
      }
      console.log('\n');
    } catch (e: any) {
      console.log('Error fetching appointments:', e.message, '\n');
    }
    
    console.log('=== Test Complete ===');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testCustomerComplete();
