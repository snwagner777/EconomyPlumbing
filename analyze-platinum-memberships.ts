/**
 * Script to find ServiceTitan Platinum VIP memberships over 3 years old
 */

import { getServiceTitanAPI } from './server/lib/serviceTitan';

async function analyzePlatinumMemberships() {
  try {
    const serviceTitanAPI = getServiceTitanAPI();
    
    console.log('Fetching all memberships from ServiceTitan...\n');
    
    // Get all memberships
    const allMemberships = await serviceTitanAPI.getAllMemberships();
    
    console.log(`Total memberships fetched: ${allMemberships.length}\n`);
    
    // Filter for Platinum VIP memberships that are active
    const platinumMemberships = allMemberships.filter(m => 
      m.membershipName && 
      m.membershipName.toLowerCase().includes('platinum') &&
      (m.status.toLowerCase() === 'won' || m.status.toLowerCase() === 'active')
    );
    
    console.log(`Active Platinum VIP memberships: ${platinumMemberships.length}\n`);
    
    // Calculate date 3 years ago
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
    
    // Filter for memberships over 3 years old
    const oldPlatinumMemberships = platinumMemberships.filter(m => {
      if (!m.createdOn) return false;
      const createdDate = new Date(m.createdOn);
      return createdDate < threeYearsAgo;
    });
    
    console.log(`Platinum VIP memberships over 3 years old: ${oldPlatinumMemberships.length}\n`);
    console.log('=' .repeat(80));
    console.log('DETAILS OF PLATINUM MEMBERSHIPS TO BE EXPIRED:');
    console.log('=' .repeat(80));
    
    if (oldPlatinumMemberships.length === 0) {
      console.log('\nNo Platinum VIP memberships over 3 years old found.');
    } else {
      oldPlatinumMemberships.forEach((m, index) => {
        const createdDate = new Date(m.createdOn);
        const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const ageInMonths = Math.floor(ageInDays / 30);
        const ageInYears = (ageInMonths / 12).toFixed(1);
        
        console.log(`\n${index + 1}. Membership ID: ${m.id}`);
        console.log(`   Customer: ${m.customerName} (ID: ${m.customerId})`);
        console.log(`   Membership Type: ${m.membershipName}`);
        console.log(`   Status: ${m.status}`);
        console.log(`   Created: ${createdDate.toLocaleDateString()} (${ageInYears} years ago)`);
        console.log(`   Expiration: ${m.expirationDate ? new Date(m.expirationDate).toLocaleDateString() : 'Not set'}`);
        console.log(`   Balance: $${(m.balance / 100).toFixed(2)}`);
        console.log(`   Total Value: $${(m.totalValue / 100).toFixed(2)}`);
      });
      
      console.log('\n' + '=' .repeat(80));
      console.log('SUMMARY:');
      console.log('=' .repeat(80));
      console.log(`Total Platinum VIP memberships to expire: ${oldPlatinumMemberships.length}`);
      const ages = oldPlatinumMemberships.map(m => 
        Math.floor((Date.now() - new Date(m.createdOn).getTime()) / (1000 * 60 * 60 * 24 * 30))
      );
      console.log(`Oldest membership: ${(Math.max(...ages) / 12).toFixed(1)} years old`);
      console.log(`Newest membership: ${(Math.min(...ages) / 12).toFixed(1)} years old`);
      
      console.log('\n' + '=' .repeat(80));
      console.log('MEMBERSHIP IDS TO EXPIRE:');
      console.log('=' .repeat(80));
      console.log(oldPlatinumMemberships.map(m => m.id).join(', '));
    }
    
    // Return the memberships for potential expiration
    return oldPlatinumMemberships;
    
  } catch (error) {
    console.error('Error analyzing memberships:', error);
    throw error;
  }
}

// Run the analysis
analyzePlatinumMemberships()
  .then(() => {
    console.log('\n✓ Analysis complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Analysis failed:', error);
    process.exit(1);
  });
