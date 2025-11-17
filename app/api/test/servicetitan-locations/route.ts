/**
 * TEST ENDPOINT - ServiceTitan Locations API Inspector
 * 
 * Tests the customer locations API with real customer data
 * to verify we're parsing the response correctly
 * 
 * DELETE THIS FILE after testing is complete
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';

export async function GET(request: NextRequest) {
  try {
    // Require admin auth for testing
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId query parameter required' },
        { status: 400 }
      );
    }

    console.log(`\n========================================`);
    console.log(`[TEST] Testing ServiceTitan Locations API`);
    console.log(`[TEST] Customer ID: ${customerId}`);
    console.log(`========================================\n`);

    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const { serviceTitanCRM } = await import('@/server/lib/servicetitan/crm');
    const serviceTitan = getServiceTitanAPI();

    // Test 1: Get all locations
    console.log(`[TEST] Step 1: Fetching all locations...`);
    const rawLocations = await serviceTitan.getAllCustomerLocations(parseInt(customerId));
    console.log(`[TEST] Found ${rawLocations.length} locations`);
    console.log(`[TEST] Raw locations response:`, JSON.stringify(rawLocations, null, 2));

    // Test 2: Get contacts for each location
    const locationsWithContacts = await Promise.all(
      rawLocations.map(async (location: any, index: number) => {
        console.log(`\n[TEST] Step 2.${index + 1}: Fetching contacts for location ${location.id}...`);
        
        try {
          const contacts = await serviceTitanCRM.getLocationContacts(location.id);
          console.log(`[TEST] Found ${contacts.length} contacts for location ${location.id}`);
          console.log(`[TEST] Raw contacts:`, JSON.stringify(contacts, null, 2));
          
          return {
            ...location,
            contacts,
            _testNotes: `Successfully fetched ${contacts.length} contacts`,
          };
        } catch (error: any) {
          console.error(`[TEST] ERROR fetching contacts for location ${location.id}:`, error.message);
          return {
            ...location,
            contacts: [],
            _testNotes: `Error: ${error.message}`,
          };
        }
      })
    );

    console.log(`\n========================================`);
    console.log(`[TEST] Final Result - Locations with Contacts:`);
    console.log(JSON.stringify(locationsWithContacts, null, 2));
    console.log(`========================================\n`);

    return NextResponse.json({
      success: true,
      customerId: parseInt(customerId),
      locationCount: rawLocations.length,
      locations: locationsWithContacts,
      _instructions: 'Check server logs for detailed API response inspection',
    });

  } catch (error: any) {
    console.error('[TEST] Error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed',
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
