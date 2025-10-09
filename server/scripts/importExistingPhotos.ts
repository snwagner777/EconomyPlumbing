/**
 * Import existing photos from disk into database
 * This script imports the 57 photos that were already processed and saved as WebP
 */

import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { db } from '../db';
import { companyCamPhotos } from '@shared/schema';

async function importExistingPhotos() {
  const baseDir = 'attached_assets/imported_photos';
  const categories = ['water_heater', 'drain', 'leak', 'toilet', 'faucet', 'gas', 'backflow', 'commercial', 'general', 'sewer', 'repiping'];
  
  const photosToImport = [];
  
  // Scan each category folder
  for (const category of categories) {
    const categoryPath = join(baseDir, category);
    
    try {
      const files = readdirSync(categoryPath);
      
      for (const file of files) {
        if (file.endsWith('.webp')) {
          const filePath = join(categoryPath, file);
          const stats = statSync(filePath);
          
          // Extract info from filename (format: timestamp_name.webp)
          const timestamp = file.split('_')[0];
          const uploadDate = new Date(parseInt(timestamp));
          
          photosToImport.push({
            companyCamPhotoId: `gdrive-${timestamp}`,
            companyCamProjectId: 'google-drive-import',
            photoUrl: `/${filePath}`,
            thumbnailUrl: `/${filePath}`,
            category,
            aiDescription: `Imported from Google Drive - ${category} related photo`,
            tags: [category],
            qualityAnalyzed: true,
            isGoodQuality: true,
            shouldKeep: true,
            qualityScore: 8,
            qualityReasoning: 'Pre-analyzed and saved from Google Drive import',
            analyzedAt: uploadDate,
            uploadedAt: uploadDate,
          });
        }
      }
    } catch (error) {
      console.log(`No photos in ${category} folder`);
    }
  }
  
  console.log(`Found ${photosToImport.length} photos to import`);
  
  // Import to database
  for (const photo of photosToImport) {
    try {
      await db.insert(companyCamPhotos).values(photo).onConflictDoNothing();
      console.log(`✅ Imported: ${photo.photoUrl}`);
    } catch (error: any) {
      console.error(`❌ Error importing ${photo.photoUrl}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Import complete! ${photosToImport.length} photos imported to database`);
  process.exit(0);
}

importExistingPhotos().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
