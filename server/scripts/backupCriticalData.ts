import { db } from "../db";
import { googleReviews, blogPosts, serviceAreas, products, referrals, trackingNumbers } from "../../shared/schema";
import * as fs from "fs";

async function backup() {
  console.log("Starting backup of critical data...");
  
  // Export all critical data
  const reviews = await db.select().from(googleReviews);
  const blogs = await db.select().from(blogPosts);
  const areas = await db.select().from(serviceAreas);
  const prods = await db.select().from(products);
  const refs = await db.select().from(referrals);
  const tracking = await db.select().from(trackingNumbers);
  
  // Create backup directory
  if (!fs.existsSync('/tmp/db_backup')) {
    fs.mkdirSync('/tmp/db_backup', { recursive: true });
  }
  
  // Write to JSON files
  fs.writeFileSync('/tmp/db_backup/reviews.json', JSON.stringify(reviews, null, 2));
  fs.writeFileSync('/tmp/db_backup/blogs.json', JSON.stringify(blogs, null, 2));
  fs.writeFileSync('/tmp/db_backup/service_areas.json', JSON.stringify(areas, null, 2));
  fs.writeFileSync('/tmp/db_backup/products.json', JSON.stringify(prods, null, 2));
  fs.writeFileSync('/tmp/db_backup/referrals.json', JSON.stringify(refs, null, 2));
  fs.writeFileSync('/tmp/db_backup/tracking.json', JSON.stringify(tracking, null, 2));
  
  console.log('✅ Backup complete!');
  console.log('  Reviews:', reviews.length);
  console.log('  Blog posts:', blogs.length);
  console.log('  Service areas:', areas.length);
  console.log('  Products:', prods.length);
  console.log('  Referrals:', refs.length);
  console.log('  Tracking numbers:', tracking.length);
  process.exit(0);
}

backup().catch(e => { 
  console.error('❌ Backup failed:', e); 
  process.exit(1); 
});
