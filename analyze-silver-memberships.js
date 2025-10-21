/**
 * Script to find ServiceTitan Silver VIP memberships over 1 year old
 */

async function analyzeSilverMemberships() {
  try {
    // Import ServiceTitan API
    const { getServiceTitanAPI } = await import('./server/lib/serviceTitan.js');
    const serviceTitanAPI = getServiceTitanAPI();
    
    console.log('Fetching all memberships from ServiceTitan...\n');
    
    // Get all memberships
    const allMemberships = await serviceTitanAPI.getAllMemberships();
    
    console.log(`Total memberships fetched: ${allMemberships.length}\n`);
    
    // Filter for Silver VIP memberships that are active
    const silverMemberships = allMemberships.filter(m => 
      m.membershipName && 
      m.membershipName.toLowerCase().includes('silver') &&
      (m.status.toLowerCase() === 'won' || m.status.toLowerCase() === 'active')
    );
    
    console.log(`Active Silver VIP memberships: ${silverMemberships.length}\n`);
    
    // Calculate date 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Filter for memberships over 1 year old
    const oldSilverMemberships = silverMemberships.filter(m => {
      if (!m.createdOn) return false;
      const createdDate = new Date(m.createdOn);
      return createdDate < oneYearAgo;
    });
    
    console.log(`Silver VIP memberships over 1 year old: ${oldSilverMemberships.length}\n`);
    console.log('=' .repeat(80));
    console.log('DETAILS OF MEMBERSHIPS TO BE EXPIRED:');
    console.log('=' .repeat(80));
    
    if (oldSilverMemberships.length === 0) {
      console.log('No Silver VIP memberships over 1 year old found.');
    } else {
      oldSilverMemberships.forEach((m, index) => {
        const createdDate = new Date(m.createdOn);
        const ageInDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        const ageInMonths = Math.floor(ageInDays / 30);
        
        console.log(`\n${index + 1}. Membership ID: ${m.id}`);
        console.log(`   Customer: ${m.customerName} (ID: ${m.customerId})`);
        console.log(`   Membership Type: ${m.membershipName}`);
        console.log(`   Status: ${m.status}`);
        console.log(`   Created: ${createdDate.toLocaleDateString()} (${ageInMonths} months ago)`);
        console.log(`   Expiration: ${m.expirationDate ? new Date(m.expirationDate).toLocaleDateString() : 'Not set'}`);
        console.log(`   Balance: $${(m.balance / 100).toFixed(2)}`);
        console.log(`   Total Value: $${(m.totalValue / 100).toFixed(2)}`);
      });
      
      console.log('\n' + '=' .repeat(80));
      console.log('SUMMARY:');
      console.log('=' .repeat(80));
      console.log(`Total Silver VIP memberships to expire: ${oldSilverMemberships.length}`);
      console.log(`Oldest membership: ${Math.max(...oldSilverMemberships.map(m => 
        Math.floor((Date.now() - new Date(m.createdOn).getTime()) / (1000 * 60 * 60 * 24 * 30))
      ))} months old`);
      console.log(`Newest membership: ${Math.min(...oldSilverMemberships.map(m => 
        Math.floor((Date.now() - new Date(m.createdOn).getTime()) / (1000 * 60 * 60 * 24 * 30))
      ))} months old`);
    }
    
    // Return the memberships for potential expiration
    return oldSilverMemberships;
    
  } catch (error) {
    console.error('Error analyzing memberships:', error);
    throw error;
  }
}

// Run the analysis
analyzeSilverMemberships()
  .then(() => {
    console.log('\nAnalysis complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
