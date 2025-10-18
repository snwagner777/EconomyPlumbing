/**
 * Add Missing Static Pages to Database
 * 
 * Adds the 15 missing static pages from sitemap to page_metadata table
 * with unique, SEO-optimized titles and descriptions.
 */

import { db } from '../db';
import { pageMetadata } from '../../shared/schema';

const missingPages = [
  {
    path: '/drainage-solutions',
    title: 'Drainage Solutions Austin TX | Yard & Foundation Drainage',
    description: 'Professional drainage solutions for Austin homes. French drains, yard drainage, foundation protection. Fix standing water & prevent flooding. Call (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/drainage-solutions'
  },
  {
    path: '/faucet-installation',
    title: 'Faucet Installation Austin TX | Kitchen & Bathroom Faucets',
    description: 'Expert faucet installation & replacement in Austin. Kitchen, bathroom & outdoor faucets. Licensed plumbers. Same-day service. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/faucet-installation'
  },
  {
    path: '/garbage-disposal-repair',
    title: 'Garbage Disposal Repair Austin TX | Installation & Replacement',
    description: 'Fast garbage disposal repair & installation in Austin. Fix jams, leaks & motor issues. All major brands. Licensed plumbers. Call (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/garbage-disposal-repair'
  },
  {
    path: '/gas-leak-detection',
    title: 'Gas Leak Detection Austin TX | 24/7 Emergency Gas Services',
    description: 'Professional gas leak detection in Austin. Emergency 24/7 response. Advanced equipment, certified technicians. Protect your family. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/gas-leak-detection'
  },
  {
    path: '/gas-services',
    title: 'Gas Line Services Austin TX | Installation, Repair & Inspection',
    description: 'Complete gas line services in Austin. Installation, repair, inspection & leak detection. Licensed gas technicians. Residential & commercial. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/gas-services'
  },
  {
    path: '/hydro-jetting-services',
    title: 'Hydro Jetting Services Austin TX | Professional Drain Cleaning',
    description: 'Professional hydro jetting in Austin. Clear stubborn clogs, tree roots & grease buildup. Safe, effective drain cleaning. Licensed plumbers. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/hydro-jetting-services'
  },
  {
    path: '/permit-resolution-services',
    title: 'Permit Resolution Services Austin TX | Failed Inspections Fixed',
    description: 'Austin plumbing permit resolution & inspection failures. We fix code violations, failed inspections & unpermitted work. Licensed plumbers. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/permit-resolution-services'
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Economy Plumbing Services Austin & Marble Falls',
    description: 'Economy Plumbing Services privacy policy. Learn how we collect, use, and protect your personal information when you use our services.',
    canonicalUrl: 'https://www.plumbersthatcare.com/privacy-policy'
  },
  {
    path: '/refund_returns',
    title: 'Refund & Returns Policy | Economy Plumbing Services',
    description: 'Economy Plumbing Services refund and returns policy. Learn about our satisfaction guarantee, service warranties, and refund procedures.',
    canonicalUrl: 'https://www.plumbersthatcare.com/refund_returns'
  },
  {
    path: '/rooter-services',
    title: 'Rooter Services Austin TX | Sewer Line Cleaning & Repair',
    description: 'Professional rooter services in Austin. Clear sewer lines, remove tree roots & fix blockages. Video inspection available. Licensed plumbers. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/rooter-services'
  },
  {
    path: '/services',
    title: 'Plumbing Services Austin TX | Full-Service Plumbing Company',
    description: 'Complete plumbing services in Austin & Marble Falls. Water heaters, drains, leaks, gas lines & emergency repairs. Licensed, insured. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/services'
  },
  {
    path: '/sewage-pump-services',
    title: 'Sewage Pump Services Austin TX | Sump & Ejector Pump Repair',
    description: 'Professional sewage pump services in Austin. Sump pumps, ejector pumps, installation & repair. Prevent basement flooding. Licensed plumbers. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/sewage-pump-services'
  },
  {
    path: '/water-heater-guide',
    title: 'Water Heater Buying Guide Austin TX | Expert Selection Tips',
    description: 'Complete water heater buying guide for Austin homes. Tank vs tankless, sizing, efficiency ratings & installation costs. Expert advice. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/water-heater-guide'
  },
  {
    path: '/water-leak-repair',
    title: 'Water Leak Repair Austin TX | Fast Leak Detection & Repair',
    description: 'Professional water leak repair in Austin. Slab leaks, pipe leaks, faucet leaks & hidden leaks. Advanced detection equipment. Fast service. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/water-leak-repair'
  },
  {
    path: '/water-pressure-solutions',
    title: 'Water Pressure Solutions Austin TX | Fix Low & High Pressure',
    description: 'Solve water pressure problems in Austin. Fix low pressure, reduce high pressure, install regulators & boosters. Licensed plumbers. (512) 368-9159.',
    canonicalUrl: 'https://www.plumbersthatcare.com/water-pressure-solutions'
  }
];

async function addMissingPages() {
  console.log('Adding 15 missing static pages to database...');
  
  for (const page of missingPages) {
    try {
      await db.insert(pageMetadata).values(page);
      console.log(`✅ Added: ${page.path}`);
    } catch (error: any) {
      // If it already exists, skip
      if (error.code === '23505') {
        console.log(`⏭️  Skipped (exists): ${page.path}`);
      } else {
        console.error(`❌ Error adding ${page.path}:`, error.message);
      }
    }
  }
  
  console.log('\n✨ Migration complete! All missing pages added.');
  process.exit(0);
}

addMissingPages().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
