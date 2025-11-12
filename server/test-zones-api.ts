/**
 * Test Script: Fetch ServiceTitan Zones via Dispatch API
 * Run once to see what data structure ServiceTitan returns
 */

import { serviceTitanAuth } from './lib/servicetitan/auth';

async function testZonesAPI() {
  console.log('🔍 Testing ServiceTitan Dispatch API - Zone_GetList\n');

  try {
    const accessToken = await serviceTitanAuth.getAccessToken();
    const tenantId = serviceTitanAuth.getTenantId();
    
    console.log(`✅ Got access token for tenant: ${tenantId}\n`);

    // Call Dispatch API v2 Zone_GetList
    const url = `https://api.servicetitan.io/dispatch/v2/tenant/${tenantId}/zones`;
    
    console.log(`📡 Calling: ${url}\n`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ST-App-Key': process.env.SERVICETITAN_APP_KEY || '',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('✅ API Response:\n');
    console.log(JSON.stringify(data, null, 2));
    
    console.log('\n📊 Summary:');
    if (data.data && Array.isArray(data.data)) {
      console.log(`   Total zones: ${data.data.length}`);
      console.log('\n   Zone names:');
      data.data.forEach((zone: any, index: number) => {
        console.log(`   ${index + 1}. ${zone.name || 'Unknown'} (ID: ${zone.id})`);
      });
    } else {
      console.log('   Response structure:', Object.keys(data));
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testZonesAPI();
