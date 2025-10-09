import { google } from 'googleapis';

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

// WARNING: Never cache this client.
// Access tokens expire, so a new client must be created each time.
// Always call this function again to get a fresh client.
export async function getUncachableGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Get all image files from a Google Drive folder
 */
export async function getImagesFromFolder(folderId: string) {
  const drive = await getUncachableGoogleDriveClient();
  
  const response = await drive.files.list({
    q: `'${folderId}' in parents and (mimeType contains 'image/')`,
    fields: 'files(id, name, mimeType, webContentLink, thumbnailLink)',
    pageSize: 100,
  });

  return response.data.files || [];
}

/**
 * Get a temporary download URL for a Google Drive file
 */
export async function getFileDownloadUrl(fileId: string): Promise<string> {
  const drive = await getUncachableGoogleDriveClient();
  
  // Get file metadata with webContentLink
  const file = await drive.files.get({
    fileId,
    fields: 'webContentLink',
  });

  if (!file.data.webContentLink) {
    throw new Error('Cannot get download URL for this file');
  }

  return file.data.webContentLink;
}

/**
 * Download file content as buffer
 */
export async function downloadFileAsBuffer(fileId: string): Promise<Buffer> {
  const drive = await getUncachableGoogleDriveClient();
  
  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    { responseType: 'arraybuffer' }
  );

  return Buffer.from(response.data as ArrayBuffer);
}
