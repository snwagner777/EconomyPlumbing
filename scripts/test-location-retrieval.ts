/**
 * Test Location Retrieval
 * 
 * Verify what locations are being fetched from ServiceTitan
 */

import { serviceTitanPortalService } from '../server/lib/servicetitan/portal-service';

const TEST_CUSTOMER_ID = 27881198;

async function testLocationRetrieval() {
  console.log('\n🧪 Testing Location Retrieval for Customer', TEST_CUSTOMER_ID);
  console.log('='.repeat(70));
  
  // Invalidate cache to get fresh data
  serviceTitanPortalService.invalidateCustomerCache(TEST_CUSTOMER_ID);
  
  // Fetch portal data
  const portalData = await serviceTitanPortalService.getCustomerPortalData(TEST_CUSTOMER_ID);
  
  console.log('\n📊 RESULTS:');
  console.log(`Customer: ${portalData.name}`);
  console.log(`Email: ${portalData.email}`);
  console.log(`Phone: ${portalData.phone}`);
  console.log(`\nLocations Found: ${portalData.locations.length}`);
  
  portalData.locations.forEach((location, index) => {
    console.log(`\n  [${index}] Location:`);
    console.log(`      ID: ${location.id}`);
    console.log(`      Name: ${location.name}`);
    console.log(`      Address: ${location.address}`);
  });
  
  // Check if locations have all the data the UI might need
  console.log('\n\n🔍 DATA COMPLETENESS CHECK:');
  console.log('-'.repeat(70));
  
  const firstLocation = portalData.locations[0];
  if (firstLocation) {
    console.log('\nFirst Location Fields:');
    Object.keys(firstLocation).forEach(key => {
      const value = (firstLocation as any)[key];
      console.log(`  ${key}: ${typeof value === 'string' ? `"${value}"` : value}`);
    });
  }
  
  console.log('\n✅ Test complete\n');
}

testLocationRetrieval()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
