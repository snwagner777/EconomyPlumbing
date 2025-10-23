import { db } from "../db";
import { googleReviews, blogPosts, serviceAreas, products, referrals, trackingNumbers } from "../../shared/schema";
import * as fs from "fs";

function convertDates(obj: any): any {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] && typeof result[key] === 'string') {
      // Try to parse as date
      const d = new Date(result[key]);
      if (!isNaN(d.getTime()) && result[key].match(/^\d{4}-\d{2}-\d{2}/)) {
        result[key] = d;
      }
    }
  }
  return result;
}

async function restore() {
  console.log("Starting restore of critical data...");
  
  // Read backup files and convert dates
  const reviews = JSON.parse(fs.readFileSync('/tmp/db_backup/reviews.json', 'utf-8')).map(convertDates);
  const blogs = JSON.parse(fs.readFileSync('/tmp/db_backup/blogs.json', 'utf-8')).map(convertDates);
  const areas = JSON.parse(fs.readFileSync('/tmp/db_backup/service_areas.json', 'utf-8')).map(convertDates);
  const prods = JSON.parse(fs.readFileSync('/tmp/db_backup/products.json', 'utf-8')).map(convertDates);
  const refs = JSON.parse(fs.readFileSync('/tmp/db_backup/referrals.json', 'utf-8')).map(convertDates);
  const tracking = JSON.parse(fs.readFileSync('/tmp/db_backup/tracking.json', 'utf-8')).map(convertDates);
  
  // Restore reviews
  if (reviews.length > 0) {
    await db.insert(googleReviews).values(reviews);
    console.log(`✅ Restored ${reviews.length} reviews`);
  }
  
  // Restore blog posts
  if (blogs.length > 0) {
    await db.insert(blogPosts).values(blogs);
    console.log(`✅ Restored ${blogs.length} blog posts`);
  }
  
  // Restore service areas
  if (areas.length > 0) {
    await db.insert(serviceAreas).values(areas);
    console.log(`✅ Restored ${areas.length} service areas`);
  }
  
  // Restore products
  if (prods.length > 0) {
    await db.insert(products).values(prods);
    console.log(`✅ Restored ${prods.length} products`);
  }
  
  // Restore referrals
  if (refs.length > 0) {
    await db.insert(referrals).values(refs);
    console.log(`✅ Restored ${refs.length} referrals`);
  }
  
  // Restore tracking numbers
  if (tracking.length > 0) {
    await db.insert(trackingNumbers).values(tracking);
    console.log(`✅ Restored ${tracking.length} tracking numbers`);
  }
  
  console.log('\n✅ All critical data restored successfully!');
  process.exit(0);
}

restore().catch(e => { 
  console.error('❌ Restore failed:', e); 
  process.exit(1); 
});
