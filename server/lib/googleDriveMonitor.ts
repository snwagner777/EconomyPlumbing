import { google } from 'googleapis';
import { storage } from '../storage';
import { ObjectStorageService } from '../objectStorage';
import { analyzeProductionPhoto } from './productionPhotoAnalyzer';
import { comparePhotos } from './similarPhotoDetector';
import sharp from 'sharp';

const objectStorageService = new ObjectStorageService();

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Recursively get all folders within a folder
async function getAllFolderIds(drive: any, parentFolderId: string): Promise<string[]> {
  const folderIds = [parentFolderId]; // Include the parent folder itself
  
  const response = await drive.files.list({
    q: `'${parentFolderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
    fields: 'files(id, name)',
    pageSize: 100
  });

  const subfolders = response.data.files || [];
  
  // Recursively get folders from each subfolder
  for (const folder of subfolders) {
    const subfolderIds = await getAllFolderIds(drive, folder.id!);
    folderIds.push(...subfolderIds);
  }
  
  return folderIds;
}

// Get all image files from multiple folders with pagination
async function getAllImageFiles(drive: any, folderIds: string[]) {
  const allFiles: any[] = [];
  
  for (const folderId of folderIds) {
    let pageToken: string | undefined = undefined;
    let pageCount = 0;
    
    do {
      const response: any = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false and (mimeType contains 'image/')`,
        fields: 'nextPageToken, files(id, name, mimeType, createdTime, webContentLink)',
        orderBy: 'createdTime desc',
        pageSize: 100,
        pageToken: pageToken
      });
      
      const files = response.data.files || [];
      allFiles.push(...files);
      
      pageToken = response.data.nextPageToken || undefined;
      pageCount++;
      
      if (pageToken) {
        console.log(`[Google Drive] Fetching page ${pageCount + 1} for folder ${folderId}...`);
      }
    } while (pageToken);
  }
  
  return allFiles;
}

export async function monitorGoogleDriveFolder() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
      console.log('[Google Drive] GOOGLE_DRIVE_FOLDER_ID not set - skipping monitoring');
      return;
    }

    console.log(`[Google Drive] Checking folder ${folderId} and all subfolders for new photos...`);
    
    const drive = await getGoogleDriveClient();
    
    // Get all folder IDs (parent + all subfolders recursively)
    const folderIds = await getAllFolderIds(drive, folderId);
    console.log(`[Google Drive] Found ${folderIds.length} total folders (including subfolders)`);
    
    // Get all image files from all folders
    const files = await getAllImageFiles(drive, folderIds);
    console.log(`[Google Drive] Found ${files.length} image files across all folders`);

    if (files.length === 0) {
      return;
    }

    // Get list of already-processed Google Drive file IDs
    const processedPhotos = await storage.getAllImportedPhotos();
    const processedGDriveIds = new Set(
      processedPhotos
        .map(p => p.gdriveFileId)
        .filter(id => id != null)
    );

    // STEP 1: Download and analyze all new photos (but don't save yet)
    const candidatePhotos: Array<{
      file: any;
      imageBuffer: Buffer;
      analysis: any;
      webpBuffer: Buffer;
    }> = [];

    console.log(`[Google Drive] Step 1: Downloading and analyzing ${files.filter(f => !processedGDriveIds.has(f.id!)).length} new photos...`);

    for (const file of files) {
      // Skip if already processed
      if (processedGDriveIds.has(file.id!)) {
        continue;
      }

      try {
        // Download the file
        const fileResponse = await drive.files.get(
          { fileId: file.id!, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        const imageBuffer = Buffer.from(fileResponse.data as ArrayBuffer);

        // Analyze production quality with OpenAI Vision
        const analysis = await analyzeProductionPhoto(imageBuffer);
        
        // Save rejected photos to database so we don't reprocess them
        if (!analysis.isProductionQuality) {
          console.log(`[Google Drive] ⚠️  Rejecting low-quality photo: ${file.name} - ${analysis.qualityReason}`);
          
          // Still save to database to mark as processed (prevents reprocessing)
          await storage.createImportedPhoto({
            url: '', // No URL since we're not storing it
            category: 'general-plumbing',
            isProductionQuality: false,
            aiQuality: analysis.qualityScore || 0,
            qualityReason: analysis.qualityReason || 'Low quality',
            aiDescription: analysis.description || '',
            aiTags: analysis.tags || [],
            focalPointX: null,
            focalPointY: null,
            gdriveFileId: file.id!, // Important: mark as processed
            usedInBlog: false,
          });
          
          console.log(`[Google Drive] ✓ Marked ${file.name} as rejected in database`);
          continue;
        }
        
        console.log(`[Google Drive] ✓ Production quality (${analysis.qualityScore}/100): ${file.name}`);

        // Convert to WebP
        const webpBuffer = await sharp(imageBuffer)
          .webp({ quality: 85 })
          .toBuffer();

        candidatePhotos.push({
          file,
          imageBuffer,
          analysis,
          webpBuffer
        });

      } catch (error) {
        console.error(`[Google Drive] Error processing ${file.name}:`, error);
      }
    }

    if (candidatePhotos.length === 0) {
      console.log('[Google Drive] No new photos to process');
      return;
    }

    // STEP 2: Check for similar photos (among new photos and against existing)
    console.log(`[Google Drive] Step 2: Checking ${candidatePhotos.length} new photos for duplicates...`);
    
    const photosToSkip = new Set<number>(); // Indices of photos to skip

    // Load all existing photos ONCE (not in loop - performance optimization)
    const existingPhotos = await storage.getAllImportedPhotos();
    console.log(`[Google Drive] Loaded ${existingPhotos.length} existing photos for comparison`);

    // Download and cache ALL existing photos ONCE (not repeatedly in loops)
    const existingPhotoBuffers = new Map<string, Buffer>();
    
    console.log(`[Google Drive] Downloading ${existingPhotos.length} existing photos for comparison...`);
    for (const existing of existingPhotos) {
      try {
        let buffer: Buffer | null = null;
        
        if (existing.url.startsWith('/public-objects/') || existing.url.startsWith('/replit-objstore-')) {
          // Handle object storage relative URLs
          const photoPath = existing.url.startsWith('/public-objects/') 
            ? existing.url.replace('/public-objects/', '') 
            : existing.url;
          const file = await objectStorageService.searchPublicObject(photoPath);
          if (file) {
            const [downloadedBuffer] = await file.download();
            buffer = downloadedBuffer;
          }
        } else if (existing.url.startsWith('http://') || existing.url.startsWith('https://')) {
          // Handle absolute URLs
          try {
            const response = await fetch(existing.url);
            if (response.ok) {
              buffer = Buffer.from(await response.arrayBuffer());
            }
          } catch (fetchError) {
            console.log(`[Google Drive] Could not fetch ${existing.url}: ${fetchError}`);
          }
        }
        
        if (buffer) {
          existingPhotoBuffers.set(existing.id, buffer);
        }
      } catch (error) {
        console.log(`[Google Drive] Warning: Could not download existing photo ${existing.url}: ${error}`);
      }
    }
    
    console.log(`[Google Drive] Successfully cached ${existingPhotoBuffers.size}/${existingPhotos.length} existing photos`);

    // Check each new photo against existing photos (using cached buffers)
    for (let i = 0; i < candidatePhotos.length; i++) {
      const candidate = candidatePhotos[i];
      
      for (const existing of existingPhotos) {
        const existingBuffer = existingPhotoBuffers.get(existing.id);
        
        if (!existingBuffer) {
          continue; // Skip if couldn't download/cache
        }

        try {
          // Compare photos using AI
          const comparison = await comparePhotos(
            candidate.webpBuffer,
            existingBuffer,
            candidate.analysis.description || '',
            existing.aiDescription || ''
          );

          if (comparison.similarityScore >= 70) {
            console.log(`[Google Drive] 🔍 Duplicate detected: ${candidate.file.name} is ${comparison.similarityScore}% similar to existing photo`);
            console.log(`[Google Drive] ⏩ Skipping duplicate (keeping existing photo with quality ${existing.aiQuality})`);
            photosToSkip.add(i);
            break; // Skip this candidate
          }
        } catch (error) {
          console.error(`[Google Drive] Error comparing photos:`, error);
        }
      }
    }

    // Check among new photos themselves
    for (let i = 0; i < candidatePhotos.length; i++) {
      if (photosToSkip.has(i)) continue;
      
      for (let j = i + 1; j < candidatePhotos.length; j++) {
        if (photosToSkip.has(j)) continue;

        const photo1 = candidatePhotos[i];
        const photo2 = candidatePhotos[j];

        try {
          const comparison = await comparePhotos(
            photo1.webpBuffer,
            photo2.webpBuffer,
            photo1.analysis.description || '',
            photo2.analysis.description || ''
          );

          if (comparison.similarityScore >= 70) {
            console.log(`[Google Drive] 🔍 Duplicate detected: ${photo1.file.name} and ${photo2.file.name} are ${comparison.similarityScore}% similar`);
            
            // Keep the higher quality photo
            const keepFirst = photo1.analysis.qualityScore >= photo2.analysis.qualityScore;
            const skipIndex = keepFirst ? j : i;
            const keepName = keepFirst ? photo1.file.name : photo2.file.name;
            
            console.log(`[Google Drive] ⏩ Skipping ${candidatePhotos[skipIndex].file.name}, keeping ${keepName} (higher quality)`);
            photosToSkip.add(skipIndex);
          }
        } catch (error) {
          console.error(`[Google Drive] Error comparing new photos:`, error);
        }
      }
    }

    // STEP 3: Save only non-duplicate photos
    let newPhotosCount = 0;
    const bucketId = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0]?.split('/')[1];
    
    if (!bucketId) {
      console.error('[Google Drive] Object Storage bucket not configured');
      return;
    }

    console.log(`[Google Drive] Step 3: Saving ${candidatePhotos.length - photosToSkip.size} unique photos...`);

    for (let i = 0; i < candidatePhotos.length; i++) {
      if (photosToSkip.has(i)) continue;

      const { file, webpBuffer, analysis } = candidatePhotos[i];

      try {
        // Generate filename with category
        const timestamp = Date.now();
        const filename = `gdrive-${timestamp}-${i}.webp`;
        const objectPath = `/${bucketId}/public/imported_photos/${analysis.category}/${filename}`;

        // Upload to Object Storage
        const publicUrl = await objectStorageService.uploadBuffer(
          webpBuffer,
          objectPath,
          'image/webp'
        );

        // Save to database with full analysis
        await storage.createImportedPhoto({
          url: publicUrl,
          category: analysis.category,
          isProductionQuality: analysis.isProductionQuality,
          aiQuality: analysis.qualityScore,
          qualityReason: analysis.qualityReason,
          aiDescription: analysis.description,
          aiTags: analysis.tags,
          focalPointX: analysis.focalPointX,
          focalPointY: analysis.focalPointY,
          gdriveFileId: file.id!,
          usedInBlog: false
        });

        console.log(`[Google Drive] ✓ Saved ${file.name} to ${publicUrl}`);
        newPhotosCount++;

      } catch (error) {
        console.error(`[Google Drive] Error saving ${file.name}:`, error);
      }
    }

    if (newPhotosCount > 0) {
      console.log(`[Google Drive] ✅ Successfully imported ${newPhotosCount} unique photos (skipped ${photosToSkip.size} duplicates)`);
    } else {
      console.log('[Google Drive] No new unique photos to process');
    }

  } catch (error) {
    console.error('[Google Drive] Monitoring error:', error);
  }
}

// Start background monitoring job (runs every 5 minutes)
export function startGoogleDriveMonitoring() {
  const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

  console.log('[Google Drive] Monitoring started - will check every 5 minutes');

  // Run immediately on startup
  monitorGoogleDriveFolder();

  // Then run periodically
  setInterval(() => {
    monitorGoogleDriveFolder();
  }, INTERVAL_MS);
}
