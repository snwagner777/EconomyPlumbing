const fetch = require('node-fetch');

// Test script to check membership API response
async function testMembershipAPI() {
  try {
    // First get customer data to trigger membership fetch
    const response = await fetch('http://localhost:5000/api/servicetitan/customer/27881198');
    
    if (!response.ok) {
      console.log('Failed to get customer data:', response.status);
      return;
    }
    
    const data = await response.json();
    
    console.log('=== MEMBERSHIP DATA FOR CUSTOMER 27881198 ===');
    console.log('Total memberships returned:', data.memberships?.length || 0);
    
    if (data.memberships && data.memberships.length > 0) {
      console.log('\n=== RAW MEMBERSHIP DATA ===');
      data.memberships.forEach((m, i) => {
        console.log(`\nMembership ${i + 1}:`);
        console.log('  ID:', m.id);
        console.log('  Type:', m.membershipType);
        console.log('  Status:', m.status);
        console.log('  Is Expired:', m.isExpired);
        console.log('  Start Date:', m.startDate);
        console.log('  Expiration Date:', m.expirationDate);
        console.log('  Raw Status:', m.rawStatus);
        console.log('  Balance:', m.balance);
        console.log('  Total Value:', m.totalValue);
        console.log('  Full object:', JSON.stringify(m, null, 2));
      });
    } else {
      console.log('\nNo memberships found for this customer');
    }
    
    // Also check customer data
    console.log('\n=== CUSTOMER DATA ===');
    console.log('Customer ID:', data.customer?.id);
    console.log('Customer Name:', data.customer?.name);
    console.log('Total Jobs:', data.appointments?.length || 0);
    console.log('Total Invoices:', data.invoices?.length || 0);
    console.log('Total Estimates:', data.estimates?.length || 0);
    
  } catch (error) {
    console.error('Error testing membership API:', error);
  }
}

testMembershipAPI();