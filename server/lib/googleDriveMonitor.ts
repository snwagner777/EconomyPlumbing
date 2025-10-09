import { google } from 'googleapis';
import { storage } from '../storage';
import { ObjectStorageService } from '../objectStorage';
import { analyzeProductionPhoto } from './productionPhotoAnalyzer';
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

// Get all image files from multiple folders
async function getAllImageFiles(drive: any, folderIds: string[]) {
  const allFiles: any[] = [];
  
  for (const folderId of folderIds) {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and (mimeType contains 'image/')`,
      fields: 'files(id, name, mimeType, createdTime, webContentLink)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });
    
    const files = response.data.files || [];
    allFiles.push(...files);
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

    let newPhotosCount = 0;

    for (const file of files) {
      // Skip if already processed
      if (processedGDriveIds.has(file.id!)) {
        continue;
      }

      console.log(`[Google Drive] Processing new photo: ${file.name}`);

      try {
        // Download the file
        const fileResponse = await drive.files.get(
          { fileId: file.id!, alt: 'media' },
          { responseType: 'arraybuffer' }
        );

        const imageBuffer = Buffer.from(fileResponse.data as ArrayBuffer);

        // Analyze production quality with OpenAI Vision
        console.log(`[Google Drive] Analyzing photo quality: ${file.name}`);
        const analysis = await analyzeProductionPhoto(imageBuffer);
        
        // Skip non-production quality photos
        if (!analysis.isProductionQuality) {
          console.log(`[Google Drive] ⚠️  Skipping low-quality photo: ${file.name} - ${analysis.qualityReason}`);
          continue;
        }
        
        console.log(`[Google Drive] ✓ Production quality (${analysis.qualityScore}/100): ${file.name}`);

        // Convert to WebP
        const webpBuffer = await sharp(imageBuffer)
          .webp({ quality: 85 })
          .toBuffer();

        // Generate filename with category
        const timestamp = Date.now();
        const filename = `gdrive-${timestamp}.webp`;
        
        // Get the bucket ID from environment (set up by Object Storage)
        const bucketId = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0]?.split('/')[1];
        if (!bucketId) {
          console.error('[Google Drive] Object Storage bucket not configured');
          continue;
        }
        
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
        console.error(`[Google Drive] Error processing ${file.name}:`, error);
      }
    }

    if (newPhotosCount > 0) {
      console.log(`[Google Drive] Successfully processed ${newPhotosCount} new photos`);
    } else {
      console.log('[Google Drive] No new photos to process');
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
