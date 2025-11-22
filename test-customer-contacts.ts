/**
 * Test Script: ServiceTitan Customer Contacts API
 */

async function testCustomerContactsAPI() {
  const TEST_CUSTOMER_ID = 27881198;

  console.log(`\n========================================`);
  console.log(`[TEST] Testing ServiceTitan Customer Contacts API`);
  console.log(`[TEST] Customer ID: ${TEST_CUSTOMER_ID}`);
  console.log(`========================================\n`);

  try {
    const { serviceTitanCRM } = await import('./server/lib/servicetitan/crm');

    console.log(`[TEST] Fetching customer contacts...`);
    const contacts = await serviceTitanCRM.getCustomerContacts(TEST_CUSTOMER_ID);
    
    console.log(`[TEST] ✓ Found ${contacts.length} contacts\n`);
    console.log(`[TEST] RAW CUSTOMER CONTACTS DATA:`);
    console.log('='.repeat(80));
    console.log(JSON.stringify(contacts, null, 2));
    console.log('='.repeat(80));
    
    console.log(`\n[TEST] Summary:`);
    console.log(`  - Total contacts: ${contacts.length}`);
    
    // Break down by type
    const phones = contacts.filter(c => c.type?.includes('Phone'));
    const emails = contacts.filter(c => c.type === 'Email');
    
    console.log(`  - Phone numbers: ${phones.length}`);
    console.log(`  - Emails: ${emails.length}`);
    
    console.log(`\n========================================`);
    console.log(`[TEST] Test Complete!`);
    console.log(`========================================\n`);

  } catch (error: any) {
    console.error('\n[TEST] ✗ FATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testCustomerContactsAPI();
