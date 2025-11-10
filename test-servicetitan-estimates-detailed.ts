/**
 * Detailed test to explore externalLinks in estimates
 * Run with: npx tsx test-servicetitan-estimates-detailed.ts
 */

import { serviceTitanAuth } from './server/lib/servicetitan/auth';

async function testExternalLinks() {
  try {
    console.log('=== Testing ServiceTitan Estimate External Links ===\n');
    
    const tenantId = serviceTitanAuth.getTenantId();
    
    // Get more estimates to find ones with external links
    console.log('📋 Fetching estimates (looking for externalLinks)...\n');
    
    const queryParams = new URLSearchParams({
      page: '1',
      pageSize: '20', // Get more to increase chances of finding links
    });
    
    const response = await serviceTitanAuth.makeRequest<any>(
      `sales/v2/tenant/${tenantId}/estimates?${queryParams.toString()}`
    );
    
    const estimates = response.data || [];
    console.log(`Total estimates: ${estimates.length}\n`);
    
    // Check which estimates have external links
    const estimatesWithLinks = estimates.filter((e: any) => e.externalLinks && e.externalLinks.length > 0);
    
    console.log(`Estimates with external links: ${estimatesWithLinks.length}`);
    console.log(`Estimates without links: ${estimates.length - estimatesWithLinks.length}\n`);
    
    if (estimatesWithLinks.length > 0) {
      console.log('=== Example Estimate WITH External Links ===');
      const withLink = estimatesWithLinks[0];
      console.log(`Estimate ID: ${withLink.id}`);
      console.log(`Job Number: ${withLink.jobNumber}`);
      console.log(`Status: ${withLink.status.name}`);
      console.log(`External Links:`, JSON.stringify(withLink.externalLinks, null, 2));
      console.log('\n');
    } else {
      console.log('❌ No estimates found with external links.\n');
      console.log('Possible reasons:');
      console.log('  1. External links are generated when estimates are emailed');
      console.log('  2. Links might be created via a separate API endpoint');
      console.log('  3. Feature might not be enabled in this account\n');
    }
    
    // Show breakdown of estimate statuses
    const statusBreakdown = estimates.reduce((acc: any, e: any) => {
      const status = e.status.name;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('=== Estimate Status Breakdown ===');
    Object.entries(statusBreakdown).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    console.log('\n');
    
    // Check if there's an endpoint to create external links
    console.log('=== Testing External Link Creation ===');
    
    // Try the first estimate
    if (estimates.length > 0) {
      const testEstimate = estimates[0];
      console.log(`Testing with Estimate ID: ${testEstimate.id}\n`);
      
      // Check available operations in the API
      console.log('Attempting to find external link endpoint...\n');
      
      // Common patterns to try:
      const patterns = [
        `sales/v2/tenant/${tenantId}/estimates/${testEstimate.id}/external-link`,
        `sales/v2/tenant/${tenantId}/estimates/${testEstimate.id}/link`,
        `sales/v2/tenant/${tenantId}/estimates/${testEstimate.id}/share`,
      ];
      
      for (const endpoint of patterns) {
        try {
          console.log(`Trying: ${endpoint}`);
          const result = await serviceTitanAuth.makeRequest<any>(endpoint);
          console.log('✅ SUCCESS! Found endpoint:', endpoint);
          console.log('Response:', JSON.stringify(result, null, 2));
          break;
        } catch (error: any) {
          if (error.message.includes('404')) {
            console.log('❌ Not found');
          } else if (error.message.includes('405')) {
            console.log('⚠️  Method not allowed (endpoint might exist but need POST)');
          } else {
            console.log('❌ Error:', error.message.substring(0, 100));
          }
        }
      }
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

testExternalLinks();
