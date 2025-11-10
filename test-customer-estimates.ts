/**
 * Test ServiceTitan Estimates API with specific customer
 * Run with: npx tsx test-customer-estimates.ts
 */

import { serviceTitanAuth } from './server/lib/servicetitan/auth';

async function testCustomerEstimates() {
  try {
    const customerId = 3153460;
    console.log(`=== Testing Customer ID: ${customerId} ===\n`);
    
    const tenantId = serviceTitanAuth.getTenantId();
    
    // Get estimates for this customer
    console.log('📋 Fetching estimates for customer...\n');
    
    const queryParams = new URLSearchParams({
      page: '1',
      pageSize: '50',
    });
    
    const response = await serviceTitanAuth.makeRequest<any>(
      `sales/v2/tenant/${tenantId}/estimates?${queryParams.toString()}`
    );
    
    const allEstimates = response.data || [];
    const customerEstimates = allEstimates.filter((e: any) => e.customerId === customerId);
    
    console.log(`Total estimates in system: ${allEstimates.length}`);
    console.log(`Estimates for customer ${customerId}: ${customerEstimates.length}\n`);
    
    if (customerEstimates.length === 0) {
      console.log('❌ No estimates found for this customer.');
      console.log('Possible reasons:');
      console.log('  - Customer has no estimates yet');
      console.log('  - Customer ID might be incorrect');
      console.log('  - Estimates might be outside the default query range\n');
      
      // Try to get the customer info to verify ID
      console.log('🔍 Attempting to verify customer exists...\n');
      try {
        const customer = await serviceTitanAuth.makeRequest<any>(
          `crm/v2/tenant/${tenantId}/customers/${customerId}`
        );
        console.log('✅ Customer found!');
        console.log(`Name: ${customer.name || 'N/A'}`);
        console.log(`Email: ${customer.email || 'N/A'}`);
        console.log(`Phone: ${customer.phoneNumber || 'N/A'}`);
        console.log(`Customer ID: ${customer.id}`);
        console.log('\nCustomer exists but has no estimates.');
      } catch (e: any) {
        console.log('❌ Customer not found or error:', e.message);
      }
    } else {
      console.log('=== Customer Estimates ===\n');
      
      customerEstimates.forEach((estimate: any, index: number) => {
        console.log(`--- Estimate ${index + 1} ---`);
        console.log(`ID: ${estimate.id}`);
        console.log(`Job #: ${estimate.jobNumber}`);
        console.log(`Status: ${estimate.status.name}`);
        console.log(`Name: ${estimate.name || 'N/A'}`);
        console.log(`Summary: ${estimate.summary || 'N/A'}`);
        console.log(`Subtotal: $${(estimate.subtotal / 100).toFixed(2)}`);
        console.log(`Created: ${estimate.createdOn}`);
        console.log(`Modified: ${estimate.modifiedOn}`);
        console.log(`External Links: ${JSON.stringify(estimate.externalLinks)}`);
        
        if (estimate.externalLinks && estimate.externalLinks.length > 0) {
          console.log('\n🎉 FOUND EXTERNAL LINKS!');
          console.log(JSON.stringify(estimate.externalLinks, null, 2));
        }
        console.log('\n');
      });
      
      // Show full detail of first estimate
      if (customerEstimates.length > 0) {
        console.log('=== Full Detail of First Estimate ===');
        console.log(JSON.stringify(customerEstimates[0], null, 2));
      }
    }
    
    console.log('\n=== Test Complete ===');
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
  }
}

testCustomerEstimates();
