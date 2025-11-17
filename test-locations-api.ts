/**
 * Test Script: ServiceTitan Locations API
 * 
 * Tests the customer locations API with real customer data
 * to verify we're parsing the response correctly
 * 
 * Run with: npx tsx test-locations-api.ts
 * DELETE THIS FILE after testing is complete
 */

async function testLocationsAPI() {
  const TEST_CUSTOMER_ID = 27881198;

  console.log(`\n========================================`);
  console.log(`[TEST] Testing ServiceTitan Locations API`);
  console.log(`[TEST] Customer ID: ${TEST_CUSTOMER_ID}`);
  console.log(`========================================\n`);

  try {
    // Import the ServiceTitan API
    const { getServiceTitanAPI } = await import('./server/lib/serviceTitan');
    const { serviceTitanCRM } = await import('./server/lib/servicetitan/crm');
    const serviceTitan = getServiceTitanAPI();

    // Test 1: Get all locations
    console.log(`[TEST] Step 1: Fetching all locations...`);
    const rawLocations = await serviceTitan.getAllCustomerLocations(TEST_CUSTOMER_ID);
    console.log(`[TEST] ✓ Found ${rawLocations.length} locations\n`);
    console.log(`[TEST] Raw locations response:`);
    console.log(JSON.stringify(rawLocations, null, 2));
    console.log(`\n`);

    // Test 2: Get contacts for each location
    if (rawLocations.length > 0) {
      for (let i = 0; i < rawLocations.length; i++) {
        const location = rawLocations[i];
        console.log(`[TEST] Step 2.${i + 1}: Fetching contacts for location ${location.id}...`);
        
        try {
          const contacts = await serviceTitanCRM.getLocationContacts(location.id);
          console.log(`[TEST] ✓ Found ${contacts.length} contacts`);
          console.log(`[TEST] Raw contacts for location ${location.id}:`);
          console.log(JSON.stringify(contacts, null, 2));
          console.log(`\n`);
        } catch (error: any) {
          console.error(`[TEST] ✗ ERROR fetching contacts for location ${location.id}:`, error.message);
          console.log(`\n`);
        }
      }
    }

    console.log(`========================================`);
    console.log(`[TEST] Test Complete!`);
    console.log(`[TEST] Summary:`);
    console.log(`  - Locations found: ${rawLocations.length}`);
    console.log(`========================================\n`);

  } catch (error: any) {
    console.error('\n[TEST] ✗ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testLocationsAPI();
