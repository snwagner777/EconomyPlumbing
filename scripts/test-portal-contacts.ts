/**
 * Portal Contact Fix Verification
 * 
 * Tests that portal service now correctly fetches and returns contact data
 * 
 * Usage: npx tsx scripts/test-portal-contacts.ts
 */

import { serviceTitanPortalService } from '../server/lib/servicetitan/portal-service';

const TEST_CUSTOMER_ID = 27881198;

async function testPortalContacts() {
  console.log('\n🧪 Testing Portal Contact Fixes\n');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Fetch portal data
    console.log(`\n📋 Fetching portal data for customer ${TEST_CUSTOMER_ID}...`);
    const portalData = await serviceTitanPortalService.getCustomerPortalData(TEST_CUSTOMER_ID);
    
    console.log('\n✓ Portal data fetched successfully!\n');
    console.log('Customer Info:');
    console.log(`  ID: ${portalData.id}`);
    console.log(`  Name: ${portalData.name}`);
    console.log(`  Email: ${portalData.email || '(empty)'}`);
    console.log(`  Phone: ${portalData.phone || '(empty)'}`);
    console.log(`  Address: ${portalData.address || '(empty)'}`);
    console.log(`  Locations: ${portalData.locations.length}`);
    console.log(`  Referrals: ${portalData.referrals.length}`);
    
    // Verify contacts are populated
    console.log('\n📊 VERIFICATION:');
    if (portalData.email) {
      console.log('  ✅ Email is populated:', portalData.email);
    } else {
      console.log('  ❌ Email is EMPTY - fix failed!');
    }
    
    if (portalData.phone) {
      console.log('  ✅ Phone is populated:', portalData.phone);
    } else {
      console.log('  ❌ Phone is EMPTY - fix failed!');
    }
    
    // Test 2: Verify cache invalidation works
    console.log('\n\n🔄 Testing cache invalidation...');
    serviceTitanPortalService.invalidateCustomerCache(TEST_CUSTOMER_ID);
    console.log('  ✓ Cache invalidated');
    
    // Fetch again to test fresh data
    const freshData = await serviceTitanPortalService.getCustomerPortalData(TEST_CUSTOMER_ID);
    console.log('  ✓ Fresh data fetched');
    
    if (freshData.email === portalData.email && freshData.phone === portalData.phone) {
      console.log('  ✅ Data consistency verified');
    } else {
      console.log('  ⚠️  Data changed between fetches - possible race condition');
    }
    
    // Summary
    console.log('\n\n📊 TEST SUMMARY');
    console.log('='.repeat(70));
    
    const success = portalData.email && portalData.phone;
    
    if (success) {
      console.log('✅ PASSED: Portal now correctly fetches and displays contact data!');
      console.log('\nWhat was fixed:');
      console.log('  • Portal now calls getCustomerContacts() separately');
      console.log('  • Contacts are mapped to primaryEmail and primaryPhone');
      console.log('  • No longer tries to read non-existent customer.email/phoneNumber fields');
    } else {
      console.log('❌ FAILED: Contact data still not showing');
      console.log('\nPossible issues:');
      console.log('  • Customer may not have contacts in ServiceTitan');
      console.log('  • Contact creation may have failed during customer setup');
      console.log('  • Check createCustomer() logs for contact creation errors');
    }
    
  } catch (error: any) {
    console.error('\n❌ Error during portal testing:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    throw error;
  }
}

// Run test
testPortalContacts()
  .then(() => {
    console.log('\n✅ Portal contact test complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Portal contact test failed:', error);
    process.exit(1);
  });
