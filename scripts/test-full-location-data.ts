/**
 * Test Full Location Data
 * 
 * Verify locations now include full address objects and contacts
 */

import { serviceTitanPortalService } from '../server/lib/servicetitan/portal-service';

const TEST_CUSTOMER_ID = 27881198;

async function testFullLocationData() {
  console.log('\n🧪 Testing Full Location Data Retrieval\n');
  console.log('='.repeat(70));
  
  // Invalidate cache
  serviceTitanPortalService.invalidateCustomerCache(TEST_CUSTOMER_ID);
  
  // Fetch portal data
  const portalData = await serviceTitanPortalService.getCustomerPortalData(TEST_CUSTOMER_ID);
  
  console.log(`\n✅ Found ${portalData.locations.length} locations\n`);
  
  portalData.locations.forEach((location, index) => {
    console.log(`📍 Location [${index}]:`);
    console.log(`   ID: ${location.id}`);
    console.log(`   Name: ${location.name}`);
    console.log(`   Address:`);
    console.log(`     street: "${location.address.street}"`);
    console.log(`     city: "${location.address.city}"`);
    console.log(`     state: "${location.address.state}"`);
    console.log(`     zip: "${location.address.zip}"`);
    console.log(`   Contacts: ${location.contacts.length} found`);
    location.contacts.forEach((contact: any, ci: number) => {
      console.log(`     [${ci}] ${contact.type}: ${contact.value}`);
    });
    console.log('');
  });
  
  // Check if UI will work
  const firstLocation = portalData.locations[0];
  console.log('🔍 UI Compatibility Check:');
  console.log(`   Can access location.address.street? ${typeof firstLocation.address.street === 'string' ? '✅ YES' : '❌ NO'}`);
  console.log(`   Can access location.address.city? ${typeof firstLocation.address.city === 'string' ? '✅ YES' : '❌ NO'}`);
  console.log(`   Can access location.contacts? ${Array.isArray(firstLocation.contacts) ? '✅ YES' : '❌ NO'}`);
  
  console.log('\n✅ Test complete\n');
}

testFullLocationData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
