import { google } from 'googleapis';
import { storage } from '../storage';
import { ObjectStorageService } from '../objectStorage';
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
    ? 'depl ' + process.env.WEB_RENEWAL 
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

export async function monitorGoogleDriveFolder() {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (!folderId) {
      console.log('[Google Drive] GOOGLE_DRIVE_FOLDER_ID not set - skipping monitoring');
      return;
    }

    console.log(`[Google Drive] Checking folder ${folderId} for new photos...`);
    
    const drive = await getGoogleDriveClient();
    
    // List image files in the folder (only images, not processed yet)
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and (mimeType contains 'image/')`,
      fields: 'files(id, name, mimeType, createdTime, webContentLink)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });

    const files = response.data.files || [];
    console.log(`[Google Drive] Found ${files.length} image files in folder`);

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

        // Analyze quality with AI (for now, use simple category mapping)
        // TODO: Integrate full AI analysis when needed
        const category = 'general-plumbing'; // Default category
        const aiQuality = 75; // Default quality score
        const aiDescription = file.name || 'Imported photo';
        const aiTags: string[] = [];

        // Convert to WebP
        const webpBuffer = await sharp(imageBuffer)
          .webp({ quality: 85 })
          .toBuffer();

        // Generate filename with category
        const timestamp = Date.now();
        const filename = `gdrive-${timestamp}.webp`;
        const objectPath = `imported_photos/${category}/${filename}`;

        // Upload to Object Storage
        const publicUrl = await objectStorageService.uploadBuffer(
          webpBuffer,
          objectPath,
          'image/webp'
        );

        // Save to database
        await storage.createImportedPhoto({
          url: publicUrl,
          category,
          aiQuality,
          aiDescription,
          aiTags,
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
