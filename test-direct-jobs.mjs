import fetch from 'node-fetch';

// Get ServiceTitan OAuth token
async function getToken() {
  const clientId = process.env.SERVICETITAN_CLIENT_ID;
  const clientSecret = process.env.SERVICETITAN_CLIENT_SECRET;
  
  const tokenResponse = await fetch('https://auth.servicetitan.io/connect/token', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
  });
  
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Test direct call to ServiceTitan Jobs API
async function testDirectJobsAPI() {
  const customerId = 27881198;
  const tenantId = process.env.SERVICETITAN_TENANT_ID;
  const appKey = process.env.SERVICETITAN_APP_KEY;
  
  try {
    const token = await getToken();
    
    // Call the actual ServiceTitan Jobs API endpoint
    const jobsUrl = `https://api.servicetitan.io/jpm/v2/tenant/${tenantId}/jobs?customerId=${customerId}&pageSize=50`;
    console.log(`=== DIRECT SERVICETITAN JOBS API CALL ===\n`);
    console.log('Calling:', jobsUrl);
    
    const response = await fetch(jobsUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'ST-App-Key': appKey
      }
    });
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('\nTotal jobs found:', data.data?.length || 0);
    
    if (data.data && data.data.length > 0) {
      console.log('\n=== JOB DETAILS ===\n');
      data.data.forEach((job, idx) => {
        console.log(`Job ${idx + 1}:`);
        console.log('  ID:', job.id);
        console.log('  Job Number:', job.jobNumber);
        console.log('  Job Status:', job.jobStatus);
        console.log('  Completed On:', job.completedOn || 'Not completed');
        console.log('  Total:', job.total || 0);
        console.log('  Summary:', job.summary || '');
        console.log('---');
      });
      
      // Count completed jobs
      const completedJobs = data.data.filter(job => 
        job.jobStatus === 'Completed' && job.completedOn !== null
      );
      const doneJobs = data.data.filter(job => 
        job.jobStatus === 'Done' && job.completedOn !== null
      );
      const allCompletedLike = data.data.filter(job => 
        job.completedOn !== null
      );
      
      console.log('\n=== SUMMARY ===');
      console.log(`Jobs with status "Completed" and completedOn: ${completedJobs.length}`);
      console.log(`Jobs with status "Done" and completedOn: ${doneJobs.length}`);
      console.log(`Jobs with any status but has completedOn: ${allCompletedLike.length}`);
      console.log('\nAll unique statuses:', [...new Set(data.data.map(j => j.jobStatus))]);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testDirectJobsAPI();