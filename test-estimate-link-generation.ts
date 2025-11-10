/**
 * Test different methods to generate external links for estimates
 * Run with: npx tsx test-estimate-link-generation.ts
 */

import { serviceTitanAuth } from './server/lib/servicetitan/auth';

async function testLinkGeneration() {
  try {
    const tenantId = serviceTitanAuth.getTenantId();
    const testEstimateId = 52863041; // Customer 3153460's estimate
    
    console.log('=== Testing External Link Generation Methods ===\n');
    console.log(`Estimate ID: ${testEstimateId}\n`);
    
    // Method 1: Try POST to create external link
    console.log('1️⃣ Testing POST to /estimates/{id}/external-links\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `sales/v2/tenant/${tenantId}/estimates/${testEstimateId}/external-links`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: 'View Estimate Online',
          }),
        }
      );
      console.log('✅ SUCCESS! Created external link:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // Method 2: Try POST to share endpoint
    console.log('2️⃣ Testing POST to /estimates/{id}/share\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `sales/v2/tenant/${tenantId}/estimates/${testEstimateId}/share`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      console.log('✅ SUCCESS! Share response:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // Method 3: Try communications/email endpoint
    console.log('3️⃣ Testing communications endpoint\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `sales/v2/tenant/${tenantId}/estimates/${testEstimateId}/send`,
        {
          method: 'POST',
          body: JSON.stringify({
            generateLink: true,
          }),
        }
      );
      console.log('✅ SUCCESS! Send response:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // Method 4: Check if there's a separate Online Estimates API
    console.log('4️⃣ Testing online-estimates endpoint\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `sales/v2/tenant/${tenantId}/online-estimates/${testEstimateId}`,
        { method: 'GET' }
      );
      console.log('✅ SUCCESS! Online estimate:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // Method 5: Try to create/get a link with POST
    console.log('5️⃣ Testing POST to create link\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `sales/v2/tenant/${tenantId}/estimates/${testEstimateId}/link`,
        {
          method: 'POST',
          body: JSON.stringify({
            type: 'customer-view',
            expiresInDays: 30,
          }),
        }
      );
      console.log('✅ SUCCESS! Link created:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // Method 6: Check communications API module
    console.log('6️⃣ Testing communications API for estimate emails\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `communications/v2/tenant/${tenantId}/estimates/${testEstimateId}/email`,
        {
          method: 'POST',
          body: JSON.stringify({
            to: 'test@example.com',
            includeOnlineLink: true,
          }),
        }
      );
      console.log('✅ SUCCESS! Email sent with link:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // Method 7: PATCH estimate to enable external link
    console.log('7️⃣ Testing PATCH to enable online estimate\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `sales/v2/tenant/${tenantId}/estimates/${testEstimateId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            enableOnlineEstimate: true,
          }),
        }
      );
      console.log('✅ SUCCESS! Estimate updated:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // Method 8: Check if there's a customer-portal module
    console.log('8️⃣ Testing customer-portal API\n');
    try {
      const result = await serviceTitanAuth.makeRequest(
        `customer-portal/v2/tenant/${tenantId}/estimates/${testEstimateId}/link`,
        { method: 'GET' }
      );
      console.log('✅ SUCCESS! Portal link:');
      console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
      console.log('❌ Error:', error.message.substring(0, 150));
    }
    console.log('\n');
    
    // After all tests, check if externalLinks was populated
    console.log('9️⃣ Re-checking estimate for externalLinks\n');
    try {
      const estimate = await serviceTitanAuth.makeRequest<any>(
        `sales/v2/tenant/${tenantId}/estimates/${testEstimateId}`
      );
      console.log('Current externalLinks:', JSON.stringify(estimate.externalLinks, null, 2));
      
      if (estimate.externalLinks && estimate.externalLinks.length > 0) {
        console.log('\n🎉 External links populated!');
      } else {
        console.log('\n❌ Still no external links after all attempts');
      }
    } catch (error: any) {
      console.log('❌ Error fetching estimate:', error.message);
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
  }
}

testLinkGeneration();
