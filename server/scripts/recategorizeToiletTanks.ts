import { db } from "../db";
import { companyCamPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";

/**
 * Script to recategorize toilet tank photos that were incorrectly categorized as water heaters
 */
async function recategorizeToiletTanks() {
  console.log("🔧 [Recategorize] Starting recategorization of toilet tank photos...\n");

  try {
    // Find all photos in water_heater category that mention "toilet" in description
    const miscategorized = await db
      .select()
      .from(companyCamPhotos)
      .where(eq(companyCamPhotos.category, 'water_heater'));

    const toiletTankPhotos = miscategorized.filter(photo => 
      photo.aiDescription?.toLowerCase().includes('toilet') ||
      photo.aiDescription?.toLowerCase().includes('toilet tank')
    );

    console.log(`📊 [Recategorize] Found ${toiletTankPhotos.length} toilet tank photos miscategorized as water_heater\n`);

    if (toiletTankPhotos.length === 0) {
      console.log("✨ [Recategorize] No miscategorized photos found!");
      return { recategorized: 0 };
    }

    let successCount = 0;
    let errorCount = 0;

    for (const photo of toiletTankPhotos) {
      try {
        console.log(`\n📸 [Recategorize] Processing: ${photo.id}`);
        console.log(`   Description: ${photo.aiDescription?.substring(0, 80)}...`);
        console.log(`   Current URL: ${photo.photoUrl}`);

        // Skip if no photoUrl
        if (!photo.photoUrl) {
          console.log(`   ⚠️  Skipping - no photoUrl`);
          continue;
        }

        // Get current file path (remove leading slash)
        const oldFilePath = photo.photoUrl.startsWith('/')
          ? photo.photoUrl.substring(1)
          : photo.photoUrl;

        // Check if file exists
        try {
          await fs.access(oldFilePath);
        } catch {
          console.log(`   ⚠️  File doesn't exist: ${oldFilePath}`);
          console.log(`   ℹ️  Updating category in database only...`);
          
          // Update database only
          await db
            .update(companyCamPhotos)
            .set({ category: 'toilet' })
            .where(eq(companyCamPhotos.id, photo.id));
          
          successCount++;
          console.log(`   ✅ Category updated to 'toilet' (file not moved)`);
          continue;
        }

        // Create new file path in toilet folder
        const filename = path.basename(oldFilePath);
        const newFilePath = path.join('attached_assets/imported_photos/toilet', filename);

        // Ensure toilet folder exists
        await fs.mkdir('attached_assets/imported_photos/toilet', { recursive: true });

        // Move file to toilet folder
        await fs.rename(oldFilePath, newFilePath);
        console.log(`   📁 Moved file: ${oldFilePath} → ${newFilePath}`);

        // Update database with new category and path
        const newPhotoUrl = `/${newFilePath}`;
        await db
          .update(companyCamPhotos)
          .set({ 
            category: 'toilet',
            photoUrl: newPhotoUrl,
            thumbnailUrl: newPhotoUrl
          })
          .where(eq(companyCamPhotos.id, photo.id));

        successCount++;
        console.log(`   ✅ Recategorized successfully!`);
        console.log(`   New URL: ${newPhotoUrl}`);

      } catch (error: any) {
        errorCount++;
        console.error(`   ❌ Error processing ${photo.id}:`, error.message);
      }
    }

    console.log(`\n✅ [Recategorize] Complete!`);
    console.log(`   Successfully recategorized: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    return { recategorized: successCount, errors: errorCount };

  } catch (error: any) {
    console.error("❌ [Recategorize] Fatal error:", error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  recategorizeToiletTanks()
    .then((result) => {
      console.log("\n📊 [Recategorize] Final Results:");
      console.log(`   Recategorized: ${result.recategorized}`);
      console.log(`   Errors: ${result.errors || 0}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { recategorizeToiletTanks };
