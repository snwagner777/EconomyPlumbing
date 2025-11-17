/**
 * Test Script: Customer Portal Locations API
 * 
 * Tests the actual portal endpoint to see what data it returns
 * 
 * Run with: npx tsx test-portal-locations.ts
 * DELETE THIS FILE after testing is complete
 */

import { cookies } from 'next/headers';

async function testPortalLocationsAPI() {
  const TEST_CUSTOMER_ID = 27881198;

  console.log(`\n========================================`);
  console.log(`[TEST] Testing Portal Locations API Endpoint`);
  console.log(`[TEST] Customer ID: ${TEST_CUSTOMER_ID}`);
  console.log(`========================================\n`);

  try {
    // Simulate the portal session
    const { getPortalSession, assertCustomerOwnership } = await import('./server/lib/customer-portal/portal-session');
    const { serviceTitanCRM } = await import('./server/lib/servicetitan/crm');
    const { getServiceTitanAPI } = await import('./server/lib/serviceTitan');
    
    console.log('[TEST] Step 1: Testing session validation...');
    // We can't actually test session here without cookies, so skip to API call
    console.log('[TEST] Skipping session check (would normally validate customer ownership)\n');

    const serviceTitan = getServiceTitanAPI();

    console.log('[TEST] Step 2: Fetching locations from ServiceTitan API...');
    const rawLocations = await serviceTitan.getAllCustomerLocations(TEST_CUSTOMER_ID);
    console.log(`[TEST] ✓ Found ${rawLocations.length} locations from ServiceTitan\n`);

    console.log('[TEST] Step 3: Enriching locations with contacts...');
    const locationsWithContacts = await Promise.all(
      rawLocations.map(async (location: any) => {
        try {
          console.log(`[TEST]   - Fetching contacts for location ${location.id}...`);
          const contacts = await serviceTitanCRM.getLocationContacts(location.id);
          console.log(`[TEST]     ✓ Got ${contacts.length} contacts`);
          
          const enrichedContacts = contacts.map((contact) => ({
            id: contact.id,
            name: contact.name,
            title: contact.title,
            methods: contact.methods.map((method) => ({
              id: method.id,
              type: method.type,
              value: method.value,
              memo: method.memo,
            })),
          }));

          return {
            ...location,
            contacts: enrichedContacts,
          };
        } catch (error) {
          console.error(`[TEST]     ✗ Error fetching contacts for location ${location.id}:`, error);
          return {
            ...location,
            contacts: [],
          };
        }
      })
    );

    console.log(`\n[TEST] Step 4: Final API response structure:`);
    const apiResponse = { locations: locationsWithContacts };
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log(`\n========================================`);
    console.log(`[TEST] Portal API Response Summary:`);
    console.log(`  - Total locations: ${locationsWithContacts.length}`);
    locationsWithContacts.forEach((loc, i) => {
      console.log(`  - Location ${i + 1}: ${loc.name || 'Unnamed'} (${loc.contacts?.length || 0} contacts)`);
    });
    console.log(`========================================\n`);

  } catch (error: any) {
    console.error('\n[TEST] ✗ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testPortalLocationsAPI();
