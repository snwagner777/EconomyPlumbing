/**
 * Verify Location Contacts Fix
 * 
 * Quick test to verify location details now include contacts
 */

import { serviceTitanPortalService } from '../server/lib/servicetitan/portal-service';

const TEST_CUSTOMER_ID = 27881198;
const TEST_LOCATION_ID = 27881201;

async function verifyFix() {
  console.log('\n🧪 Verifying Location Contacts Fix\n');
  
  // Invalidate cache first
  serviceTitanPortalService.invalidateCustomerCache(TEST_CUSTOMER_ID);
  
  const locationDetails = await serviceTitanPortalService.getLocationDetails(
    TEST_CUSTOMER_ID,
    TEST_LOCATION_ID
  );
  
  console.log('Location Details Fields:');
  Object.keys(locationDetails).forEach(key => {
    const value = (locationDetails as any)[key];
    const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
    console.log(`  ${key}: ${type}`);
  });
  
  if (locationDetails.contacts) {
    console.log('\n✅ SUCCESS: contacts field is present!');
    console.log(`  Found ${locationDetails.contacts.length} contacts`);
    locationDetails.contacts.forEach((contact: any, i: number) => {
      console.log(`    [${i}] ${contact.type}: ${contact.value}`);
    });
  } else {
    console.log('\n❌ FAILED: contacts field is MISSING');
  }
}

verifyFix()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
