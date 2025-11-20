/**
 * Location Data Requirements Test
 * 
 * Analyzes what the customer portal UI expects from location data
 * and what the API is actually providing
 * 
 * Usage: npx tsx scripts/test-location-data-requirements.ts
 */

import { serviceTitanPortalService } from '../server/lib/servicetitan/portal-service';
import { serviceTitanCRM } from '../server/lib/servicetitan/crm';

const TEST_CUSTOMER_ID = 27881198;

async function testLocationDataRequirements() {
  console.log('\n🔍 Location Data Requirements Analysis\n');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Get portal data (what gets sent to frontend)
    console.log('\n📋 STEP 1: Fetch Portal Data');
    console.log('-'.repeat(70));
    const portalData = await serviceTitanPortalService.getCustomerPortalData(TEST_CUSTOMER_ID);
    
    console.log(`Customer: ${portalData.name}`);
    console.log(`Locations found: ${portalData.locations.length}\n`);
    
    console.log('Location Summary Structure:');
    if (portalData.locations.length > 0) {
      const firstLocation = portalData.locations[0];
      Object.keys(firstLocation).forEach(key => {
        console.log(`  ${key}: ${typeof (firstLocation as any)[key]}`);
      });
    }
    
    // Step 2: Get detailed location data
    console.log('\n\n📋 STEP 2: Fetch Location Details');
    console.log('-'.repeat(70));
    
    for (const locationSummary of portalData.locations) {
      console.log(`\nLocation: ${locationSummary.name} (ID: ${locationSummary.id})`);
      
      const locationDetails = await serviceTitanPortalService.getLocationDetails(
        TEST_CUSTOMER_ID,
        locationSummary.id
      );
      
      console.log('  Fields in location details:');
      Object.keys(locationDetails).forEach(key => {
        const value = (locationDetails as any)[key];
        const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
        console.log(`    ${key}: ${type}`);
      });
      
      // Check for contacts field
      if (!(locationDetails as any).contacts) {
        console.log('  ⚠️  WARNING: No "contacts" field in location details!');
      }
    }
    
    // Step 3: Fetch contacts separately to see what's available
    console.log('\n\n📞 STEP 3: Test Separate Contact Fetching');
    console.log('-'.repeat(70));
    
    for (const locationSummary of portalData.locations) {
      console.log(`\nLocation: ${locationSummary.name} (ID: ${locationSummary.id})`);
      
      const locationContacts = await serviceTitanCRM.getLocationContacts(locationSummary.id);
      console.log(`  Contacts available: ${locationContacts.length}`);
      
      if (locationContacts.length > 0) {
        locationContacts.forEach((contact, i) => {
          console.log(`    [${i}] ${contact.type}: ${contact.value}`);
        });
      } else {
        console.log('    (No contacts found)');
      }
    }
    
    // Step 4: Summary and Recommendations
    console.log('\n\n📊 ANALYSIS & FINDINGS');
    console.log('='.repeat(70));
    
    console.log('\n🎯 What UI Expects (from AuthenticatedPortal.tsx line 156):');
    console.log('  • location.contacts[] - array of contact objects');
    console.log('  • Used for "Manage Location Contacts" dialog');
    console.log('  • Maps over contacts to display them in UI');
    
    console.log('\n📦 What API Currently Provides:');
    console.log('  LocationSummary (from getCustomerPortalData):');
    console.log('    • id: number');
    console.log('    • name: string');
    console.log('    • address: string');
    console.log('    • ❌ contacts: MISSING');
    
    console.log('\n  PortalLocationDetails (from getLocationDetails):');
    console.log('    • id: number');
    console.log('    • name: string');
    console.log('    • address: string');
    console.log('    • appointments: array');
    console.log('    • invoices: array');
    console.log('    • memberships: array');
    console.log('    • ❌ contacts: MISSING');
    
    console.log('\n✅ What ServiceTitan API Provides:');
    console.log('  • serviceTitanCRM.getLocationContacts(locationId)');
    console.log('  • Returns array of contact objects with type/value');
    console.log('  • Available but NOT currently fetched by portal service');
    
    console.log('\n💡 RECOMMENDED FIX:');
    console.log('  1. Add contacts[] field to PortalLocationDetails interface');
    console.log('  2. Update getLocationDetails() to fetch location contacts');
    console.log('  3. Call serviceTitanCRM.getLocationContacts(locationId)');
    console.log('  4. Include contacts in the returned location data');
    
    console.log('\n⚡ IMPACT:');
    console.log('  • "Manage Location Contacts" dialog will work correctly');
    console.log('  • Location contact display will populate properly');
    console.log('  • Same fix pattern as customer-level contacts');
    
  } catch (error: any) {
    console.error('\n❌ Error during analysis:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    throw error;
  }
}

// Run analysis
testLocationDataRequirements()
  .then(() => {
    console.log('\n✅ Analysis complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  });
