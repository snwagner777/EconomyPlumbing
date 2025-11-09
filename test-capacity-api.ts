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
  console.log('TEST 1: Request 10-DAY WINDOW');
  console.log('========================================\n');
  
  const tenDayStart = fromZonedTime(`${testDate}T08:00:00`, TIMEZONE);
  const tenDayEnd = new Date(tenDayStart);
  tenDayEnd.setDate(tenDayEnd.getDate() + 10);
  tenDayEnd.setHours(20, 0, 0, 0); // 8pm on day 10
  
  console.log(`Requesting capacity for 10 days:`);
  console.log(`  Start: ${tenDayStart.toLocaleString('en-US', { timeZone: TIMEZONE })}`);
  console.log(`  End: ${tenDayEnd.toLocaleString('en-US', { timeZone: TIMEZONE })}\n`);
  
  const tenDayResults = await settings.checkCapacity({
    businessUnitId,
    jobTypeId,
    startDate: tenDayStart,
    endDate: tenDayEnd,
    skillBasedAvailability: false,
  });
  
  console.log(`\nResults: ${tenDayResults.length} slots returned\n`);
  
  // Group by date for easier reading
  const slotsByDate = new Map<string, typeof tenDayResults>();
  tenDayResults.forEach(slot => {
    const date = slot.start.split('T')[0];
    if (!slotsByDate.has(date)) {
      slotsByDate.set(date, []);
    }
    slotsByDate.get(date)!.push(slot);
  });
  
  console.log('Slots grouped by date:\n');
  Array.from(slotsByDate.entries()).sort().forEach(([date, slots]) => {
    const localDate = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', { 
      timeZone: TIMEZONE,
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    console.log(`${localDate} (${date}):`);
    slots.forEach(slot => {
      const startLocal = new Date(slot.start).toLocaleTimeString('en-US', { 
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const endLocal = new Date(slot.end).toLocaleTimeString('en-US', { 
        timeZone: TIMEZONE,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      console.log(`  ${startLocal} - ${endLocal} ${slot.isAvailable ? '✓' : '✗'}`);
    });
    console.log('');
  });
  
  console.log('\n========================================');
  console.log('ANALYSIS: Arrival Window Patterns');
  console.log('========================================\n');
  
  const windowDurations = new Map<number, number>();
  tenDayResults.forEach(slot => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    windowDurations.set(durationHours, (windowDurations.get(durationHours) || 0) + 1);
  });
  
  console.log('Window durations found:');
  Array.from(windowDurations.entries()).sort((a, b) => b[1] - a[1]).forEach(([hours, count]) => {
    console.log(`  ${hours}-hour windows: ${count} slots`);
  });
  
  console.log('\nSample 4-hour windows (first 5):');
  tenDayResults
    .filter(slot => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return durationHours === 4;
    })
    .slice(0, 5)
    .forEach(slot => {
      const startLocal = new Date(slot.start).toLocaleString('en-US', { timeZone: TIMEZONE });
      const endLocal = new Date(slot.end).toLocaleString('en-US', { timeZone: TIMEZONE });
      console.log(`  ${startLocal} to ${endLocal}`);
    });
  
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
