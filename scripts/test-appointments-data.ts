#!/usr/bin/env ts-node
/**
 * Test Script: Explore Appointment/Job Data Structure
 * 
 * Usage:
 *   npx ts-node scripts/test-appointments-data.ts <customerId>
 *   npx ts-node scripts/test-appointments-data.ts 27881198
 * 
 * This script fetches real appointment data from ServiceTitan and displays the full structure
 */

import { serviceTitanJobs } from '../server/lib/servicetitan/jobs';

async function main() {
  const customerId = parseInt(process.argv[2] || '27881198', 10);

  if (!customerId || isNaN(customerId)) {
    console.error('❌ Invalid customer ID. Usage: npx ts-node scripts/test-appointments-data.ts <customerId>');
    process.exit(1);
  }

  console.log(`\n📋 APPOINTMENT DATA STRUCTURE EXPLORER`);
  console.log(`${'='.repeat(70)}`);
  console.log(`Customer ID: ${customerId}\n`);

  try {
    console.log('⏳ Fetching jobs and appointments from ServiceTitan...\n');
    const jobsWithAppointments = await serviceTitanJobs.getCustomerAppointments(customerId);

    if (jobsWithAppointments.length === 0) {
      console.log('⚠️  No jobs/appointments found for this customer');
      process.exit(0);
    }

    console.log(`✅ Retrieved ${jobsWithAppointments.length} job(s) with appointments\n`);

    // JOBS STRUCTURE
    console.log(`${'='.repeat(70)}`);
    console.log(`JOB OBJECT STRUCTURE`);
    console.log(`${'='.repeat(70)}\n`);

    const firstJob = jobsWithAppointments[0];
    console.log('Available fields on each job:');
    console.log(Object.keys(firstJob).sort().join(', '));
    console.log(`\nFull first job object:\n`);
    console.log(JSON.stringify(firstJob, null, 2));

    // APPOINTMENTS STRUCTURE
    if (firstJob.appointments && firstJob.appointments.length > 0) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`APPOINTMENT OBJECT STRUCTURE`);
      console.log(`${'='.repeat(70)}\n`);

      console.log('Available fields on each appointment:');
      console.log(Object.keys(firstJob.appointments[0]).sort().join(', '));
      console.log(`\nFull first appointment object:\n`);
      console.log(JSON.stringify(firstJob.appointments[0], null, 2));
    }

    // SUMMARY TABLE
    console.log(`\n${'='.repeat(70)}`);
    console.log(`DATA SUMMARY`);
    console.log(`${'='.repeat(70)}\n`);

    console.log('Jobs breakdown:');
    jobsWithAppointments.forEach((job, idx) => {
      const status = job.jobStatus || job.status || 'Unknown';
      const appointmentCount = job.appointments?.length || 0;
      console.log(
        `  ${idx + 1}. Job #${job.jobNumber || job.id} | Status: ${status} | Appointments: ${appointmentCount}`
      );

      if (job.appointments && job.appointments.length > 0) {
        job.appointments.forEach((apt, aptIdx) => {
          const aptStatus = apt.status || 'Unknown';
          console.log(
            `     └─ Appointment ${aptIdx + 1}: ${apt.start} | Status: ${aptStatus}`
          );
        });
      }
    });

    console.log(`\n✅ Data structure exploration complete\n`);
  } catch (error) {
    console.error('❌ Error fetching data:', error);
    process.exit(1);
  }
}

main();
