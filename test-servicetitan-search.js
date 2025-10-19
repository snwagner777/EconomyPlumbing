/**
 * ServiceTitan API Search Testing Tool
 * Tests various API endpoints to find working customer search methods
 */

const CLIENT_ID = process.env.SERVICETITAN_CLIENT_ID;
const CLIENT_SECRET = process.env.SERVICETITAN_CLIENT_SECRET;
const TENANT_ID = process.env.SERVICETITAN_TENANT_ID;
const APP_KEY = process.env.SERVICETITAN_APP_KEY;

let accessToken = null;

// Authenticate
async function authenticate() {
  const tokenUrl = 'https://auth.servicetitan.io/connect/token';
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  accessToken = data.access_token;
  console.log('✅ Authenticated successfully\n');
}

// Test an API endpoint
async function testEndpoint(name, url, method = 'GET', body = null) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'ST-App-Key': APP_KEY,
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const text = await response.text();
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      try {
        const json = JSON.parse(text);
        console.log(`   ✅ SUCCESS - Response keys:`, Object.keys(json));
        if (json.data) {
          console.log(`   📊 Data count: ${json.data.length}`);
          if (json.data.length > 0) {
            console.log(`   📝 First item keys:`, Object.keys(json.data[0]));
          }
        }
        return { success: true, data: json };
      } catch (e) {
        console.log(`   ✅ SUCCESS - Non-JSON response`);
        return { success: true, data: text };
      }
    } else {
      console.log(`   ❌ FAILED - ${text.substring(0, 200)}`);
      return { success: false, error: text };
    }
  } catch (error) {
    console.log(`   ❌ ERROR - ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 ServiceTitan API Search Testing Tool\n');
  console.log('='.repeat(60));
  
  await authenticate();
  
  const testPhone = '5129226192';
  const testEmail = 'sthomas96@austin.rr.com';
  const baseUrl = `https://api.servicetitan.io`;
  
  console.log(`\n📞 Testing with phone: ${testPhone}`);
  console.log(`📧 Testing with email: ${testEmail}`);
  console.log('='.repeat(60));
  
  // Test 1: CRM Customers - Email Search
  await testEndpoint(
    '1. CRM Customers - Email Filter',
    `${baseUrl}/crm/v2/tenant/${TENANT_ID}/customers?email=${encodeURIComponent(testEmail)}`
  );
  
  // Test 2: CRM Customers - Phone Search
  await testEndpoint(
    '2. CRM Customers - Phone Filter',
    `${baseUrl}/crm/v2/tenant/${TENANT_ID}/customers?phoneNumber=${testPhone}`
  );
  
  // Test 3: CRM Contacts Search (POST)
  await testEndpoint(
    '3. CRM Contacts Search API (POST)',
    `${baseUrl}/crm/v2/tenant/${TENANT_ID}/contacts/search`,
    'POST',
    { value: testPhone, page: 1, pageSize: 10 }
  );
  
  // Test 4: CRM Contacts - GET with filters
  await testEndpoint(
    '4. CRM Contacts - GET with value filter',
    `${baseUrl}/crm/v2/tenant/${TENANT_ID}/contacts?value=${testPhone}`
  );
  
  // Test 5: Settings/Customers Export endpoint
  await testEndpoint(
    '5. Settings - Customers Export',
    `${baseUrl}/settings/v2/tenant/${TENANT_ID}/export/customers`
  );
  
  // Test 6: Marketing/Customers endpoint
  await testEndpoint(
    '6. Marketing - Customers',
    `${baseUrl}/marketing/v2/tenant/${TENANT_ID}/customers?email=${encodeURIComponent(testEmail)}`
  );
  
  // Test 7: CRM - Customer Locations with contact info
  await testEndpoint(
    '7. CRM - Customer Locations',
    `${baseUrl}/crm/v2/tenant/${TENANT_ID}/locations?phoneNumber=${testPhone}`
  );
  
  // Test 8: Try the Report API
  await testEndpoint(
    '8. Reporting - Customers Report',
    `${baseUrl}/reporting/v2/tenant/${TENANT_ID}/report-categories/customers`
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('✨ Testing complete!\n');
}

main().catch(console.error);
