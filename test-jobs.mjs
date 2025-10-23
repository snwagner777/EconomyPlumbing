import fetch from 'node-fetch';

// Test script to check jobs API for customer 27881198
async function testJobsAPI() {
  const customerId = 27881198;
  
  try {
    // Call our customer stats endpoint
    console.log(`=== TESTING CUSTOMER STATS API FOR ${customerId} ===\n`);
    const statsResponse = await fetch(`http://localhost:5000/api/portal/customer-stats/${customerId}`);
    const statsData = await statsResponse.json();
    console.log('Customer Stats Response:');
    console.log(JSON.stringify(statsData, null, 2));
    console.log('\n---\n');

    // Call the ServiceTitan customer data endpoint (which gets jobs via getCustomerAppointments)
    console.log(`=== TESTING SERVICETITAN CUSTOMER API FOR ${customerId} ===\n`);
    const customerResponse = await fetch(`http://localhost:5000/api/servicetitan/customer/${customerId}`);
    const customerData = await customerResponse.json();
    
    console.log('Customer Name:', customerData.customer?.name);
    console.log('Appointments Count:', customerData.appointments?.length || 0);
    console.log('Invoices Count:', customerData.invoices?.length || 0);
    console.log('Estimates Count:', customerData.estimates?.length || 0);
    console.log('Memberships Count:', customerData.memberships?.length || 0);
    
    // Check appointments data (which comes from jobs)
    if (customerData.appointments && customerData.appointments.length > 0) {
      console.log('\n=== APPOINTMENTS/JOBS DATA ===');
      customerData.appointments.forEach((apt, idx) => {
        console.log(`\nAppointment ${idx + 1}:`);
        console.log('  Job Number:', apt.jobNumber);
        console.log('  Job Type:', apt.jobType);
        console.log('  Status:', apt.status);
        console.log('  Start:', apt.start);
        console.log('  End:', apt.end);
        console.log('  Summary:', apt.summary);
      });
    }

    // Check invoices to see if they show completed work
    if (customerData.invoices && customerData.invoices.length > 0) {
      console.log('\n=== INVOICES (Completed Work) ===');
      customerData.invoices.forEach((inv, idx) => {
        console.log(`\nInvoice ${idx + 1}:`);
        console.log('  Invoice #:', inv.invoiceNumber);
        console.log('  Job #:', inv.jobNumber);
        console.log('  Status:', inv.status);
        console.log('  Total:', inv.total);
        console.log('  Date:', inv.invoiceDate);
        console.log('  Summary:', inv.summary);
      });
    }
    
  } catch (error) {
    console.error('Error testing APIs:', error);
  }
}

testJobsAPI();