/**
 * Test script to explore ServiceTitan Estimates API
 * Run with: npx tsx test-servicetitan-estimates.ts
 */

import { serviceTitanAuth } from './server/lib/servicetitan/auth';

async function testEstimatesAPI() {
  try {
    console.log('=== ServiceTitan Estimates API Test ===\n');
    
    const tenantId = serviceTitanAuth.getTenantId();
    console.log(`Tenant ID: ${tenantId}\n`);
    
    // Test 1: Get list of estimates
    console.log('📋 Fetching recent estimates...\n');
    
    const queryParams = new URLSearchParams({
      page: '1',
      pageSize: '5', // Just get a few to start
      // active: 'true', // Uncomment to filter only active estimates
    });
    
    const response = await serviceTitanAuth.makeRequest<any>(
      `sales/v2/tenant/${tenantId}/estimates?${queryParams.toString()}`
    );
    
    console.log(`Total estimates found: ${response.data?.length || 0}\n`);
    
    if (response.data && response.data.length > 0) {
      console.log('=== First Estimate Details ===');
      console.log(JSON.stringify(response.data[0], null, 2));
      console.log('\n');
      
      // Check what fields are available
      const estimate = response.data[0];
      console.log('=== Available Fields ===');
      console.log('Keys:', Object.keys(estimate).join(', '));
      console.log('\n');
      
      // Look for external link field
      if (estimate.externalLink) {
        console.log('✅ FOUND externalLink field!');
        console.log('External Link:', JSON.stringify(estimate.externalLink, null, 2));
      } else {
        console.log('❌ No externalLink field in response');
        console.log('Checking for similar fields...');
        const linkFields = Object.keys(estimate).filter(k => 
          k.toLowerCase().includes('link') || 
          k.toLowerCase().includes('url') ||
          k.toLowerCase().includes('external')
        );
        if (linkFields.length > 0) {
          console.log('Found related fields:', linkFields);
          linkFields.forEach(field => {
            console.log(`  ${field}:`, estimate[field]);
          });
        }
      }
      
      // Test 2: Try to get a specific estimate with more details
      console.log('\n=== Fetching Single Estimate Details ===');
      const estimateId = estimate.id;
      console.log(`Estimate ID: ${estimateId}\n`);
      
      const singleEstimate = await serviceTitanAuth.makeRequest<any>(
        `sales/v2/tenant/${tenantId}/estimates/${estimateId}`
      );
      
      console.log('Single Estimate Response:');
      console.log(JSON.stringify(singleEstimate, null, 2));
      console.log('\n');
      
      // Check for external link in single estimate
      if (singleEstimate.externalLink) {
        console.log('✅ FOUND externalLink in single estimate!');
        console.log('External Link:', JSON.stringify(singleEstimate.externalLink, null, 2));
      }
    } else {
      console.log('No estimates found. Try creating one in ServiceTitan first.');
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error: any) {
    console.error('❌ Error testing Estimates API:');
    console.error('Message:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testEstimatesAPI();
