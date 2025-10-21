/**
 * Script to expire Silver VIP memberships over 1 year old
 * FIXED: Using membershipId instead of id
 */

import { getServiceTitanAPI } from './server/lib/serviceTitan';

async function expireSilverMemberships() {
  try {
    const serviceTitanAPI = getServiceTitanAPI();
    
    console.log('🔍 Fetching Silver VIP memberships over 1 year old...\n');
    
    // Get all memberships
    const allMemberships = await serviceTitanAPI.getAllMemberships();
    
    // Filter for Silver VIP memberships that are active
    const silverMemberships = allMemberships.filter(m => 
      m.membershipName && 
      m.membershipName.toLowerCase().includes('silver') &&
      (m.status.toLowerCase() === 'won' || m.status.toLowerCase() === 'active')
    );
    
    // Calculate date 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Filter for memberships over 1 year old
    const oldSilverMemberships = silverMemberships.filter(m => {
      if (!m.createdOn) return false;
      const createdDate = new Date(m.createdOn);
      return createdDate < oneYearAgo;
    });
    
    console.log(`Found ${oldSilverMemberships.length} Silver VIP memberships to expire\n`);
    
    if (oldSilverMemberships.length === 0) {
      console.log('No memberships to expire. Exiting.');
      return;
    }
    
    // Prepare bulk update data - USE membershipId instead of id!
    const today = new Date().toISOString();
    const updates = oldSilverMemberships
      .filter(m => m.membershipId) // Only include memberships with a membershipId
      .map(m => ({
        membershipId: m.membershipId, // This is the key fix!
        status: 'Expired',
        expirationDate: today,
      }));
    
    console.log('=' .repeat(80));
    console.log('EXPIRING MEMBERSHIPS');
    console.log('=' .repeat(80));
    console.log(`Total to expire: ${updates.length}`);
    console.log(`Expiration date: ${new Date(today).toLocaleDateString()}`);
    console.log(`Status: Expired`);
    console.log('=' .repeat(80));
    console.log('');
    
    if (updates.length === 0) {
      console.log('⚠️  No memberships have a valid membershipId. Cannot proceed.');
      return null;
    }
    
    // Execute bulk update
    console.log('⏳ Starting bulk expiration...\n');
    
    const result = await serviceTitanAPI.bulkUpdateMemberships(updates);
    
    console.log('=' .repeat(80));
    console.log('RESULTS');
    console.log('=' .repeat(80));
    console.log(`✅ Successfully expired: ${result.success}`);
    console.log(`❌ Failed to expire: ${result.failed}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. Membership ID ${error.membershipId}: ${error.error}`);
      });
    }
    
    console.log('=' .repeat(80));
    
    return result;
    
  } catch (error) {
    console.error('❌ Error expiring memberships:', error);
    throw error;
  }
}

// Run the expiration
expireSilverMemberships()
  .then((result) => {
    console.log('\n✅ Bulk expiration complete!');
    if (result && result.success > 0) {
      console.log(`${result.success} memberships have been successfully expired in ServiceTitan.`);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Bulk expiration failed:', error);
    process.exit(1);
  });
