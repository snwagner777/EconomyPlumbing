import { db } from "../db";
import { companyCamPhotos } from "@shared/schema";
import fs from "fs/promises";
import path from "path";
import { eq } from "drizzle-orm";

/**
 * Cleanup script to remove database records for CompanyCam photos that don't have corresponding files on disk.
 * This handles cases where the Zapier webhook saved metadata but the file download/save failed.
 */
async function cleanupMissingPhotos() {
  console.log("🧹 [Cleanup] Starting cleanup of missing photo files...\n");

  try {
    // Get all CompanyCam photos from database
    const allPhotos = await db.select().from(companyCamPhotos);
    console.log(`📊 [Cleanup] Found ${allPhotos.length} photos in database\n`);

    const missingFiles: Array<{ id: string; photoUrl: string }> = [];
    const existingFiles: string[] = [];

    // Check each photo to see if file exists
    for (const photo of allPhotos) {
      if (!photo.photoUrl) {
        console.log(`⚠️  [Cleanup] Photo ${photo.id} has no photoUrl - skipping`);
        continue;
      }

      // Convert URL to file path (remove leading slash)
      const filePath = photo.photoUrl.startsWith('/') 
        ? photo.photoUrl.substring(1) 
        : photo.photoUrl;

      try {
        await fs.access(filePath);
        existingFiles.push(photo.id);
      } catch (error) {
        // File doesn't exist
        missingFiles.push({
          id: photo.id,
          photoUrl: photo.photoUrl
        });
        console.log(`❌ [Cleanup] Missing file: ${photo.photoUrl} (ID: ${photo.id})`);
      }
    }

    console.log(`\n📈 [Cleanup] Summary:`);
    console.log(`   ✅ Files exist: ${existingFiles.length}`);
    console.log(`   ❌ Files missing: ${missingFiles.length}`);

    if (missingFiles.length === 0) {
      console.log(`\n✨ [Cleanup] All photo files exist! No cleanup needed.`);
      return {
        total: allPhotos.length,
        existing: existingFiles.length,
        missing: 0,
        removed: 0
      };
    }

    // Remove database records for missing files
    console.log(`\n🗑️  [Cleanup] Removing ${missingFiles.length} database records for missing files...`);
    
    let removedCount = 0;
    for (const missing of missingFiles) {
      try {
        await db.delete(companyCamPhotos).where(eq(companyCamPhotos.id, missing.id));
        removedCount++;
        console.log(`   ✓ Removed record: ${missing.photoUrl}`);
      } catch (error: any) {
        console.error(`   ✗ Failed to remove ${missing.id}:`, error.message);
      }
    }

    console.log(`\n✅ [Cleanup] Complete! Removed ${removedCount} orphaned database records.`);
    
    return {
      total: allPhotos.length,
      existing: existingFiles.length,
      missing: missingFiles.length,
      removed: removedCount
    };
  } catch (error: any) {
    console.error("❌ [Cleanup] Error:", error);
    throw error;
  }
}

// Run cleanup if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupMissingPhotos()
    .then((result) => {
      console.log("\n📊 [Cleanup] Final Results:");
      console.log(`   Total photos in DB: ${result.total}`);
      console.log(`   Files exist: ${result.existing}`);
      console.log(`   Files missing: ${result.missing}`);
      console.log(`   Records removed: ${result.removed}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { cleanupMissingPhotos };
