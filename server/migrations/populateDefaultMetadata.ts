/**
 * One-time migration: Populate database with default metadata
 * ONLY adds metadata for pages that don't already have entries
 * Safe to run multiple times - will not overwrite existing data
 */

import { db } from '../db';
import { pageMetadata } from '../../shared/schema';
import { eq } from 'drizzle-orm';

const defaultMetadata = [
  {
    path: '/',
    title: 'Economy Plumbing Services | Austin & Marble Falls Plumber',
    description: 'Austin & Marble Falls trusted plumber since 2012. Licensed, insured plumbing services including water heaters, drain cleaning, leak repair & more. Call (512) 368-9159.',
  },
  {
    path: '/plumber-near-me',
    title: 'Plumber Near Me Austin TX | Local Emergency Plumbing Service',
    description: 'Looking for a plumber near me in Austin? Fast, licensed plumbing service available now. Water heaters, leaks, drains & more. Same-day service. Call (512) 368-9159.',
  },
  {
    path: '/water-heater-services',
    title: 'Water Heater Services Austin TX | Installation & Repair',
    description: 'Expert water heater installation, repair & replacement in Austin. Tankless & traditional water heaters. Same-day service available. Licensed & insured. Call (512) 368-9159.',
  },
  {
    path: '/drain-cleaning',
    title: 'Drain Cleaning Austin TX | Professional Drain & Sewer Service',
    description: 'Professional drain cleaning & sewer services in Austin. Hydro jetting, video inspection, root removal. Fast, effective solutions. Licensed plumbers. Call (512) 368-9159.',
  },
  {
    path: '/leak-repair',
    title: 'Leak Repair Austin TX | Water Leak Detection & Repair',
    description: 'Expert leak detection and repair services in Austin. Fix all types of leaks fast. Prevent water damage. Licensed, insured plumbers. Same-day service. Call (512) 368-9159.',
  },
  {
    path: '/toilet-faucet',
    title: 'Toilet & Faucet Services Austin TX | Installation & Repair',
    description: 'Professional toilet and faucet installation, repair & replacement in Austin. Modern fixtures, water-saving options. Licensed plumbers. Call (512) 368-9159.',
  },
  {
    path: '/gas-line-services',
    title: 'Gas Line Services Austin TX | Installation & Repair',
    description: 'Licensed gas line services in Austin. Installation, repair, leak detection. Safe, code-compliant work. Emergency service available. Call (512) 368-9159.',
  },
  {
    path: '/backflow',
    title: 'Backflow Testing & Prevention Austin TX | Certified Service',
    description: 'Certified backflow testing and prevention services in Austin. Protect your water supply. Annual testing, installation, repair. Licensed professionals. Call (512) 368-9159.',
  },
  {
    path: '/commercial-plumbing',
    title: 'Commercial Plumbing Austin TX | Business Plumbing Services',
    description: 'Professional commercial plumbing services in Austin. Maintenance, repairs, installations for businesses. Licensed, insured. Scheduled service available. Call (512) 368-9159.',
  },
  {
    path: '/emergency-plumbing',
    title: '24/7 Emergency Plumber Austin TX | Fast Response Service',
    description: 'Emergency plumbing service available 24/7 in Austin. Fast response for burst pipes, sewer backups & major leaks. Nights/weekends/holidays. Call (512) 368-9159.',
  },
  {
    path: '/about',
    title: 'About Economy Plumbing | Austin & Marble Falls Plumber Since 2012',
    description: 'Learn about Economy Plumbing - Austin and Marble Falls trusted plumber since 2012. Family-owned, licensed, and committed to our Central Texas community.',
  },
  {
    path: '/contact',
    title: 'Contact Economy Plumbing | Austin & Marble Falls Plumber',
    description: 'Contact Economy Plumbing for all your plumbing needs in Austin and Marble Falls. Schedule service, request estimates, or get emergency help. Call (512) 368-9159.',
  },
  {
    path: '/faq',
    title: 'Plumbing FAQ | Common Questions Answered - Economy Plumbing',
    description: 'Get answers to common plumbing questions. Learn about our services, pricing, service areas, and emergency plumbing. Austin & Marble Falls plumber since 2012.',
  },
  {
    path: '/blog',
    title: 'Plumbing Tips & Advice | Economy Plumbing Blog',
    description: 'Expert plumbing tips, maintenance advice, and industry insights from Economy Plumbing. Learn how to care for your plumbing system in Central Texas.',
  },
  {
    path: '/success-stories',
    title: 'Customer Success Stories | Real Plumbing Projects - Economy Plumbing',
    description: 'See real before-and-after photos from our plumbing projects in Austin and Marble Falls. Customer success stories and completed work examples.',
  },
  {
    path: '/store',
    title: 'VIP Memberships & Products | Economy Plumbing Store',
    description: 'Shop Economy Plumbing VIP maintenance memberships and plumbing products. Save on annual service, priority scheduling, and exclusive member benefits.',
  },
  {
    path: '/membership-benefits',
    title: 'VIP Membership Benefits | Priority Plumbing Service - Economy Plumbing',
    description: 'Join Economy Plumbing VIP Membership for priority service, discounts, and peace of mind. Annual maintenance, free estimates, and exclusive member perks.',
  },
  {
    path: '/schedule-appointment',
    title: 'Schedule Plumbing Service | Book Online - Economy Plumbing',
    description: 'Schedule plumbing service online with Economy Plumbing. Fast, convenient booking for Austin and Marble Falls. Same-day service available. Call (512) 368-9159.',
  },
  {
    path: '/service-area',
    title: 'Service Areas | Austin & Marble Falls Plumber - Economy Plumbing',
    description: 'Economy Plumbing serves Austin, Marble Falls, Cedar Park, Leander, Round Rock, Georgetown, and surrounding Central Texas communities. View our full service area.',
  },
  // Service Area Pages
  {
    path: '/plumber-austin',
    title: 'Professional Plumber in Austin, TX | Economy Plumbing',
    description: 'Austin\'s trusted plumber since 2012. Water heaters, drain cleaning, leak repair & more. Licensed & insured. Same-day service. Call (512) 368-9159.',
  },
  {
    path: '/plumber-in-cedar-park--tx',
    title: 'Professional Plumber in Cedar Park, TX | Economy Plumbing',
    description: 'Professional plumbing services in Cedar Park, TX. Water heater services, drain cleaning, leak repair, and gas line services. Call (512) 368-9159 for service.',
  },
  {
    path: '/plumber-leander',
    title: 'Professional Plumber in Leander, TX | Economy Plumbing',
    description: 'Expert plumbing services in Leander, TX. Water heater repair, drain cleaning, leak detection, and emergency plumbing. Call (512) 368-9159.',
  },
  {
    path: '/round-rock-plumber',
    title: 'Professional Plumber in Round Rock, TX | Economy Plumbing',
    description: 'Round Rock plumbing services. Water heaters, drain cleaning, leak repair, gas services. Licensed plumbers. Call (512) 368-9159.',
  },
  {
    path: '/plumber-georgetown',
    title: 'Professional Plumber in Georgetown, TX | Economy Plumbing',
    description: 'Georgetown plumbing experts. Water heater installation, drain cleaning, leak repair, and commercial plumbing. Call (512) 368-9159.',
  },
  {
    path: '/plumber-pflugerville',
    title: 'Professional Plumber in Pflugerville, TX | Economy Plumbing',
    description: 'Pflugerville plumbing services. Expert water heater repair, drain cleaning, and emergency plumbing. Licensed plumbers. Call (512) 368-9159.',
  },
  {
    path: '/plumber-marble-falls',
    title: 'Professional Plumber in Marble Falls, TX | Economy Plumbing',
    description: 'Expert plumbing services in Marble Falls, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Licensed plumbers. Call (830) 460-3565.',
  },
  {
    path: '/plumber-burnet',
    title: 'Professional Plumber in Burnet, TX | Economy Plumbing',
    description: 'Professional plumbing services in Burnet, TX. Water heater installation, drain cleaning, leak repair, and more. Licensed & insured. Call (830) 460-3565.',
  },
  {
    path: '/plumber-horseshoe-bay',
    title: 'Professional Plumber in Horseshoe Bay, TX | Economy Plumbing',
    description: 'Quality plumbing services in Horseshoe Bay, TX. Water heater services, drain cleaning, leak repair, and emergency plumbing. Call (830) 460-3565 for service.',
  },
  {
    path: '/plumber-kingsland',
    title: 'Professional Plumber in Kingsland, TX | Economy Plumbing',
    description: 'Trusted plumbing services in Kingsland, TX. Water heater repair, drain cleaning, leak detection, commercial plumbing. Licensed plumbers. Call (830) 460-3565.',
  },
  {
    path: '/plumber-granite-shoals',
    title: 'Professional Plumber in Granite Shoals, TX | Economy Plumbing',
    description: 'Reliable plumbing services in Granite Shoals, TX. Expert water heater repair, drain cleaning, and emergency plumbing. Same-day service. Call (830) 460-3565.',
  },
  {
    path: '/plumber-bertram',
    title: 'Professional Plumber in Bertram, TX | Economy Plumbing',
    description: 'Professional plumbing services in Bertram, TX. Water heater install, drain cleaning, leak repair, gas services. Licensed & insured. Call (830) 460-3565.',
  },
  {
    path: '/plumber-spicewood',
    title: 'Professional Plumber in Spicewood, TX | Economy Plumbing',
    description: 'Expert plumbing services in Spicewood, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing. Same-day service. Call (830) 460-3565.',
  },
  {
    path: '/plumber-liberty-hill',
    title: 'Professional Plumber in Liberty Hill, TX | Economy Plumbing',
    description: 'Quality plumbing services in Liberty Hill, TX. Water heater services, drain cleaning, leak repair, and gas line services. Call (512) 368-9159 for service.',
  },
  {
    path: '/plumber-buda',
    title: 'Professional Plumber in Buda, TX | Economy Plumbing',
    description: 'Buda, TX plumber near Austin. Expert water heater repair, drain cleaning & emergency plumbing services. Same-day service available. Call (512) 368-9159 now.',
  },
  {
    path: '/plumber-kyle',
    title: 'Professional Plumber in Kyle, TX | Economy Plumbing',
    description: 'Reliable plumbing services in Kyle, TX. Water heater installation, drain cleaning, leak repair, and commercial plumbing. Licensed plumbers. Call (512) 368-9159.',
  },
];

async function populateMetadata() {
  console.log('🔄 Starting metadata migration...');
  console.log(`📊 Total default entries: ${defaultMetadata.length}`);
  
  let added = 0;
  let skipped = 0;
  
  for (const meta of defaultMetadata) {
    try {
      // Check if this path already has metadata
      const existing = await db
        .select()
        .from(pageMetadata)
        .where(eq(pageMetadata.path, meta.path))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${meta.path} - already exists`);
        skipped++;
        continue;
      }
      
      // Insert new metadata
      await db.insert(pageMetadata).values({
        path: meta.path,
        title: meta.title,
        description: meta.description,
      });
      
      console.log(`✅ Added ${meta.path}`);
      added++;
    } catch (error) {
      console.error(`❌ Error processing ${meta.path}:`, error);
    }
  }
  
  console.log('\n📈 Migration complete!');
  console.log(`   ✅ Added: ${added}`);
  console.log(`   ⏭️  Skipped (already exist): ${skipped}`);
  console.log(`   📊 Total in defaults: ${defaultMetadata.length}`);
}

// Run migration
populateMetadata()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
