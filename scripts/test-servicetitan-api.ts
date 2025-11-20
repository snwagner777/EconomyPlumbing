/**
 * ServiceTitan API Diagnostic Script
 * 
 * Tests actual API responses to verify:
 * 1. Customer endpoint response structure
 * 2. Whether contacts are included or need separate fetch
 * 3. Contact fetch methods (customer-level vs location-level)
 * 
 * Usage: npx tsx scripts/test-servicetitan-api.ts
 */

import { serviceTitanAuth } from '../server/lib/servicetitan/auth';
import { serviceTitanCRM } from '../server/lib/servicetitan/crm';

const TEST_CUSTOMER_ID = 27881198; // Real test customer from database

async function testServiceTitanAPI() {
  console.log('\n🔍 ServiceTitan API Diagnostics\n');
  console.log('='.repeat(70));
  
  try {
    const tenantId = serviceTitanAuth.getTenantId();
    
    // ========================================
    // TEST 1: Direct Customer Fetch (Portal Pattern)
    // ========================================
    console.log('\n📋 TEST 1: Direct Customer API Call (Portal Pattern)');
    console.log('-'.repeat(70));
    console.log(`Endpoint: GET /crm/v2/tenant/${tenantId}/customers/${TEST_CUSTOMER_ID}`);
    
    const directCustomer = await serviceTitanAuth.makeRequest<any>(
      `crm/v2/tenant/${tenantId}/customers/${TEST_CUSTOMER_ID}`
    );
    
    console.log('\n✓ Response received');
    console.log('\nTop-level fields in response:');
    Object.keys(directCustomer).forEach(key => {
      const value = directCustomer[key];
      const type = Array.isArray(value) ? `array[${value.length}]` : typeof value;
      console.log(`  ${key}: ${type}`);
    });
    
    console.log('\nCustomer Info:');
    console.log(`  ID: ${directCustomer.id}`);
    console.log(`  Name: ${directCustomer.name}`);
    console.log(`  Type: ${directCustomer.type}`);
    
    console.log('\nContact Fields (what portal tries to read):');
    console.log(`  customer.email: ${directCustomer.email || '(undefined/null)'}`);
    console.log(`  customer.phoneNumber: ${directCustomer.phoneNumber || '(undefined/null)'}`);
    console.log(`  customer.contacts: ${directCustomer.contacts ? `array[${directCustomer.contacts.length}]` : '(undefined/null)'}`);
    
    if (directCustomer.contacts) {
      console.log('\nContacts array found in response:');
      directCustomer.contacts.forEach((contact: any, i: number) => {
        console.log(`  [${i}] type="${contact.type}" value="${contact.value}" memo="${contact.memo || '(none)'}"`);
      });
    }
    
    // ========================================
    // TEST 2: Separate Contact Fetch (Customer-Level)
    // ========================================
    console.log('\n\n📞 TEST 2: Separate Customer Contact Fetch');
    console.log('-'.repeat(70));
    console.log('Using: serviceTitanCRM.getCustomerContacts()');
    
    const customerContacts = await serviceTitanCRM.getCustomerContacts(TEST_CUSTOMER_ID);
    
    console.log(`\n✓ Found ${customerContacts.length} customer-level contacts`);
    if (customerContacts.length > 0) {
      customerContacts.forEach((contact, i) => {
        console.log(`  [${i}] type="${contact.type}" value="${contact.value}"`);
      });
    } else {
      console.log('  (No customer-level contacts)');
    }
    
    // ========================================
    // TEST 3: Location Data
    // ========================================
    console.log('\n\n🏠 TEST 3: Location Data');
    console.log('-'.repeat(70));
    
    const locations = await serviceTitanCRM.getCustomerLocations(TEST_CUSTOMER_ID);
    console.log(`\n✓ Found ${locations.length} locations`);
    
    for (const location of locations) {
      console.log(`\n  Location ${location.id}:`);
      console.log(`    Name: ${location.name}`);
      if (location.address) {
        console.log(`    Address: ${location.address.street}, ${location.address.city}, ${location.address.state} ${location.address.zip}`);
      }
      console.log(`    Has 'contacts' field: ${!!location.contacts}`);
      
      if (location.contacts) {
        console.log(`    Contacts in location object: ${location.contacts.length}`);
        location.contacts.forEach((contact: any, i: number) => {
          console.log(`      [${i}] type="${contact.type}" value="${contact.value}"`);
        });
      }
      
      // Try fetching location contacts separately
      console.log(`\n    Fetching location contacts separately...`);
      const locationContacts = await serviceTitanCRM.getLocationContacts(location.id);
      console.log(`    Location-level contacts: ${locationContacts.length}`);
      if (locationContacts.length > 0) {
        locationContacts.forEach((contact, i) => {
          console.log(`      [${i}] type="${contact.type}" value="${contact.value}"`);
        });
      } else {
        console.log('      (No location-level contacts)');
      }
    }
    
    // ========================================
    // SUMMARY & RECOMMENDATIONS
    // ========================================
    console.log('\n\n📊 SUMMARY & FINDINGS');
    console.log('='.repeat(70));
    
    const hasEmailField = !!directCustomer.email;
    const hasPhoneField = !!directCustomer.phoneNumber;
    const hasContactsArray = !!directCustomer.contacts;
    const hasSeparateContacts = customerContacts.length > 0;
    
    console.log('\n🔍 Customer Endpoint Response:');
    console.log(`  ✓ Has customer.email field: ${hasEmailField}`);
    console.log(`  ✓ Has customer.phoneNumber field: ${hasPhoneField}`);
    console.log(`  ✓ Has customer.contacts array: ${hasContactsArray}`);
    
    console.log('\n🔍 Separate Contact Fetch:');
    console.log(`  ✓ Customer-level contacts: ${customerContacts.length}`);
    console.log(`  ✓ Total locations: ${locations.length}`);
    
    console.log('\n⚠️  ISSUE IDENTIFICATION:');
    
    if (!hasEmailField && !hasPhoneField && !hasContactsArray) {
      console.log('  ❌ CONFIRMED: Direct customer fetch does NOT include contact fields');
      console.log('     Portal is trying to read customer.email/phoneNumber that don\'t exist!');
      console.log('     FIX: Portal must fetch contacts separately');
    }
    
    if (!hasContactsArray && hasSeparateContacts) {
      console.log('  ❌ CONFIRMED: Contacts must be fetched separately');
      console.log('     Customer endpoint doesn\'t include contacts array');
      console.log('     FIX: Call getCustomerContacts() and map to email/phone fields');
    }
    
    if (customerContacts.length === 0) {
      console.log('  ⚠️  WARNING: This customer has NO contacts in ServiceTitan');
      console.log('     This could indicate contact creation failed during customer setup');
      console.log('     FIX: Check createCustomer() error handling');
    }
    
    console.log('\n💡 RECOMMENDED FIXES:');
    console.log('  1. Portal: Call getCustomerContacts() separately and map results');
    console.log('  2. CRM: Propagate contact creation errors instead of swallowing them');
    console.log('  3. Add structured logging for all contact operations');
    
  } catch (error: any) {
    console.error('\n❌ Error during API testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    throw error;
  }
}

// Run diagnostics
testServiceTitanAPI()
  .then(() => {
    console.log('\n✅ Diagnostic complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic failed:', error);
    process.exit(1);
  });
