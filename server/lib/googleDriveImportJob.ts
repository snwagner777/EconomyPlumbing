import { storage } from "../storage";
import { db } from "../db";
import { companyCamPhotos } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function startGoogleDriveImportJob() {
  const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
  
  if (!FOLDER_ID) {
    console.log("[Google Drive Import] GOOGLE_DRIVE_FOLDER_ID not configured - skipping background import");
    return;
  }

  console.log(`[Google Drive Import] Background job started - monitoring folder: ${FOLDER_ID}`);
  
  // Run immediately on startup
  await runImport(FOLDER_ID);
  
  // Then run every 6 hours
  setInterval(() => {
    runImport(FOLDER_ID).catch(error => {
      console.error("[Google Drive Import] Background job error:", error);
    });
  }, 6 * 60 * 60 * 1000); // 6 hours
}

async function runImport(folderId: string) {
  try {
    console.log(`[Google Drive Import] Starting background import from folder: ${folderId}`);

    const { getImagesFromFolder, downloadFileAsBuffer } = await import("./googleDriveClient");
    const { analyzePhotoQuality } = await import("./photoQualityAnalyzer");

    // Get all images from the folder
    const files = await getImagesFromFolder(folderId);
    console.log(`[Google Drive Import] Found ${files.length} images in folder`);

    let imported = 0;
    let skipped = 0;
    let rejected = 0;

    for (const file of files) {
      try {
        // Check if photo already exists in database (skip duplicates)
        const photoId = file.id || Buffer.from(file.name || '').toString('base64').substring(0, 32);
        const existingPhoto = await db.select().from(companyCamPhotos)
          .where(eq(companyCamPhotos.companyCamPhotoId, photoId))
          .limit(1);
        
        if (existingPhoto.length > 0) {
          skipped++;
          continue;
        }

        // Download file as buffer
        const buffer = await downloadFileAsBuffer(file.id!);
        const base64Image = `data:${file.mimeType};base64,${buffer.toString('base64')}`;

        // Analyze with AI
        const analysis = await analyzePhotoQuality(base64Image, file.name || '');

        if (!analysis.shouldKeep) {
          console.log(`[Google Drive Import] ❌ Rejected ${file.name} - ${analysis.reasoning}`);
          rejected++;
          continue;
        }

        // Categorize
        const category = categorizePhotoFromAnalysis(analysis.reasoning, analysis.categories);

        // Convert to WebP and save locally
        const fs = await import('fs/promises');
        const path = await import('path');
        const sharp = await import('sharp');
        
        const webpBuffer = await sharp.default(buffer)
          .webp({ quality: 85 })
          .toBuffer();
        
        console.log(`[Google Drive Import] 🔄 ${file.name} converted to WebP (${Math.round((1 - webpBuffer.length / buffer.length) * 100)}% smaller)`);
        
        // Create category subfolder
        const categoryFolder = path.join('attached_assets/imported_photos', category);
        await fs.mkdir(categoryFolder, { recursive: true });
        
        // Generate unique filename with .webp extension
        const timestamp = Date.now();
        const sanitizedName = file.name?.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.(jpg|jpeg|png)$/i, '') || 'unnamed';
        const localFileName = `${timestamp}_${sanitizedName}.webp`;
        const localFilePath = path.join(categoryFolder, localFileName);
        
        // Save WebP file to disk
        await fs.writeFile(localFilePath, webpBuffer);
        console.log(`[Google Drive Import] 💾 Saved: ${localFilePath}`);

        // Create photo record
        const photoData = {
          companyCamPhotoId: photoId,
          companyCamProjectId: 'google-drive-import',
          photoUrl: `/${localFilePath}`,
          thumbnailUrl: `/${localFilePath}`,
          category,
          aiDescription: analysis.reasoning,
          tags: analysis.categories,
          qualityAnalyzed: true,
          isGoodQuality: analysis.isGoodQuality,
          shouldKeep: analysis.shouldKeep,
          qualityScore: analysis.qualityScore,
          qualityReasoning: analysis.reasoning,
          analyzedAt: new Date(),
          uploadedAt: new Date(),
        };

        // Save to database
        await storage.savePhotos([photoData]);
        imported++;
        
        console.log(`[Google Drive Import] ✅ Imported ${file.name} - Category: ${category}, Score: ${analysis.qualityScore}/10`);
        
        // Small delay to avoid overwhelming APIs
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`[Google Drive Import] Error processing ${file.name}:`, error.message);
      }
    }

    console.log(`[Google Drive Import] Background import complete: ${imported} imported, ${skipped} skipped (duplicates), ${rejected} rejected`);
  } catch (error: any) {
    console.error("[Google Drive Import] Background job error:", error);
  }
}

// Helper function to categorize photos based on AI analysis
function categorizePhotoFromAnalysis(aiDescription: string, tags: string[]): string {
  const combined = `${aiDescription} ${tags.join(" ")}`.toLowerCase();

  if (combined.includes("water heater") || combined.includes("tank") || combined.includes("heater")) {
    return "water_heater";
  }
  if (combined.includes("drain") || combined.includes("clog")) {
    return "drain";
  }
  if (combined.includes("leak") || combined.includes("drip")) {
    return "leak";
  }
  if (combined.includes("toilet")) {
    return "toilet";
  }
  if (combined.includes("faucet") || combined.includes("sink")) {
    return "faucet";
  }
  if (combined.includes("gas") || combined.includes("line")) {
    return "gas";
  }
  if (combined.includes("backflow") || combined.includes("prevention")) {
    return "backflow";
  }
  if (combined.includes("commercial") || combined.includes("business")) {
    return "commercial";
  }
  
  return "general";
}
