/**
 * Script to test different ServiceTitan Membership API endpoints
 * to find the correct way to update membership status
 */

import { getServiceTitanAPI } from './server/lib/serviceTitan';

async function testMembershipAPI() {
  try {
    const serviceTitanAPI = getServiceTitanAPI();
    
    console.log('🔍 Testing ServiceTitan Membership API endpoints...\n');
    
    // Get all memberships
    const allMemberships = await serviceTitanAPI.getAllMemberships();
    
    // Get a sample Silver membership
    const silverMembership = allMemberships.find(m => 
      m.membershipName && 
      m.membershipName.toLowerCase().includes('silver') &&
      (m.status.toLowerCase() === 'won' || m.status.toLowerCase() === 'active')
    );
    
    if (!silverMembership) {
      console.log('❌ No active Silver membership found for testing');
      return;
    }
    
    console.log('Found test membership:');
    console.log('  ID (recurring event):', silverMembership.id);
    console.log('  Membership ID:', silverMembership.membershipId);
    console.log('  Customer ID:', silverMembership.customerId);
    console.log('  Customer Name:', silverMembership.customerName);
    console.log('  Membership Name:', silverMembership.membershipName);
    console.log('  Status:', silverMembership.status);
    console.log('\nRaw data keys:', Object.keys(silverMembership.rawData));
    console.log('\n');
    
    // Test 1: Try GET on the customer-memberships endpoint to verify it exists
    console.log('=' .repeat(80));
    console.log('TEST 1: GET customer membership details');
    console.log('=' .repeat(80));
    
    const tenantId = process.env.SERVICETITAN_TENANT_ID;
    const testUrl1 = `https://api.servicetitan.io/memberships/v2/tenant/${tenantId}/customer-memberships/${silverMembership.membershipId}`;
    
    console.log('Testing URL:', testUrl1);
    
    try {
      // Use the private request method through reflection
      const api: any = serviceTitanAPI;
      const result1 = await api.request(testUrl1, {}, true);
      console.log('✅ GET customer-memberships SUCCESS');
      console.log('Response:', JSON.stringify(result1, null, 2).substring(0, 500));
    } catch (error: any) {
      console.log('❌ GET customer-memberships FAILED');
      console.log('Error:', error.message);
    }
    
    console.log('\n');
    
    // Test 2: Try alternate endpoint structure
    console.log('=' .repeat(80));
    console.log('TEST 2: GET from recurring-service-events endpoint');
    console.log('=' .repeat(80));
    
    const testUrl2 = `https://api.servicetitan.io/memberships/v2/tenant/${tenantId}/recurring-service-events/${silverMembership.id}`;
    
    console.log('Testing URL:', testUrl2);
    
    try {
      const api: any = serviceTitanAPI;
      const result2 = await api.request(testUrl2, {}, true);
      console.log('✅ GET recurring-service-events SUCCESS');
      console.log('Response:', JSON.stringify(result2, null, 2).substring(0, 500));
    } catch (error: any) {
      console.log('❌ GET recurring-service-events FAILED');
      console.log('Error:', error.message);
    }
    
    console.log('\n');
    
    // Test 3: List available endpoints by checking the API
    console.log('=' .repeat(80));
    console.log('TEST 3: Raw data analysis');
    console.log('=' .repeat(80));
    console.log('Full raw data for this membership:');
    console.log(JSON.stringify(silverMembership.rawData, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testMembershipAPI()
  .then(() => {
    console.log('\n✅ API testing complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ API testing failed:', error);
    process.exit(1);
  });
