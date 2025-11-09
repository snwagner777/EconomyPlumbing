/**
 * Test script to understand ServiceTitan Capacity API behavior
 * 
 * This script will test:
 * 1. Requesting the whole day (8am-8pm) - what does ST return?
 * 2. Requesting individual 2-hour blocks - what does ST return?
 * 3. Compare the results to understand API behavior
 */

import { ServiceTitanSettings } from './server/lib/servicetitan/settings';
import { fromZonedTime } from 'date-fns-tz';

const TIMEZONE = 'America/Chicago';

async function testCapacityAPI() {
  const settings = new ServiceTitanSettings();
  
  // First, get valid job types
  console.log('Fetching job types from ServiceTitan...\n');
  const jobTypes = await settings.getJobTypes();
  console.log(`Found ${jobTypes.length} job types:`);
  jobTypes.forEach(jt => {
    console.log(`  - ${jt.name} (ID: ${jt.id})`);
  });
  
  // Use the first non-backflow plumbing job type
  const plumbingJob = jobTypes.find(jt => 
    jt.name.toLowerCase().includes('plumbing') && 
    !jt.name.toLowerCase().includes('backflow')
  ) || jobTypes[0];
  
  console.log(`\nUsing job type: ${plumbingJob.name} (ID: ${plumbingJob.id})\n`);
  
  // Test for Tuesday (Nov 12, 2025) when there should be availability
  const testDate = '2025-11-12'; // Tuesday
  console.log(`Testing with date: ${testDate}`);
  const businessUnitId = 386; // Plumbing business unit
  const jobTypeId = plumbingJob.id;
  
  console.log('\n========================================');
  console.log('TEST 1: Request WHOLE DAY (8am-8pm)');
  console.log('========================================\n');
  
  const wholeDayStart = fromZonedTime(`${testDate}T08:00:00`, TIMEZONE);
  const wholeDayEnd = fromZonedTime(`${testDate}T20:00:00`, TIMEZONE);
  
  const wholeDayResults = await settings.checkCapacity({
    businessUnitId,
    jobTypeId,
    startDate: wholeDayStart,
    endDate: wholeDayEnd,
    skillBasedAvailability: false,
  });
  
  console.log(`Request: ${wholeDayStart.toISOString()} to ${wholeDayEnd.toISOString()}`);
  console.log(`Results: ${wholeDayResults.length} slots returned\n`);
  
  wholeDayResults.forEach((slot, i) => {
    const startLocal = new Date(slot.start).toLocaleString('en-US', { timeZone: TIMEZONE });
    const endLocal = new Date(slot.end).toLocaleString('en-US', { timeZone: TIMEZONE });
    console.log(`Slot ${i + 1}:`);
    console.log(`  Time (UTC): ${slot.start} to ${slot.end}`);
    console.log(`  Time (Local): ${startLocal} to ${endLocal}`);
    console.log(`  Available: ${slot.isAvailable}`);
    console.log(`  Open/Total: ${slot.openAvailability}/${slot.totalAvailability}`);
    console.log(`  Technicians: ${slot.availableTechnicians?.length || 0}`);
    console.log('');
  });
  
  console.log('\n========================================');
  console.log('TEST 2: Request Individual 2-Hour Blocks');
  console.log('========================================\n');
  
  const blocks = [
    { start: 8, end: 10, label: '8-10am' },
    { start: 10, end: 12, label: '10-12pm' },
    { start: 12, end: 14, label: '12-2pm' },
    { start: 14, end: 16, label: '2-4pm' },
    { start: 16, end: 18, label: '4-6pm' },
    { start: 18, end: 20, label: '6-8pm' },
  ];
  
  for (const block of blocks) {
    const blockStart = fromZonedTime(`${testDate}T${String(block.start).padStart(2, '0')}:00:00`, TIMEZONE);
    const blockEnd = fromZonedTime(`${testDate}T${String(block.end).padStart(2, '0')}:00:00`, TIMEZONE);
    
    const blockResults = await settings.checkCapacity({
      businessUnitId,
      jobTypeId,
      startDate: blockStart,
      endDate: blockEnd,
      skillBasedAvailability: false,
    });
    
    console.log(`\nBlock: ${block.label}`);
    console.log(`Request: ${blockStart.toISOString()} to ${blockEnd.toISOString()}`);
    console.log(`Results: ${blockResults.length} slots returned`);
    
    if (blockResults.length > 0) {
      blockResults.forEach((slot, i) => {
        const slotStartLocal = new Date(slot.start).toLocaleString('en-US', { timeZone: TIMEZONE });
        const slotEndLocal = new Date(slot.end).toLocaleString('en-US', { timeZone: TIMEZONE });
        
        console.log(`  Slot ${i + 1}:`);
        console.log(`    Returned Time: ${slotStartLocal} to ${slotEndLocal}`);
        console.log(`    Available: ${slot.isAvailable}`);
        console.log(`    Open/Total: ${slot.openAvailability}/${slot.totalAvailability}`);
        console.log(`    Does returned time match requested block? ${
          slot.start === blockStart.toISOString() && slot.end === blockEnd.toISOString() ? 'YES' : 'NO'
        }`);
      });
    } else {
      console.log('  No slots returned');
    }
  }
  
  console.log('\n========================================');
  console.log('KEY QUESTIONS TO ANSWER:');
  console.log('========================================\n');
  console.log('1. When we request whole day, what time ranges does ST return?');
  console.log('   - Does it return 4-hour windows (8-12, 12-4, 4-8)?');
  console.log('   - Does it return 2-hour blocks?');
  console.log('   - Something else?');
  console.log('');
  console.log('2. When we request 2-hour block that is FULL, what does ST return?');
  console.log('   - Nothing (empty array)?');
  console.log('   - The next available window?');
  console.log('   - The requested window with isAvailable=false?');
  console.log('');
  console.log('3. When we request 2-hour block that is AVAILABLE, what time range does ST return?');
  console.log('   - The exact 2-hour block we requested?');
  console.log('   - The full 4-hour arrival window containing that block?');
  console.log('');
}

// Run the test
testCapacityAPI().catch(console.error);
