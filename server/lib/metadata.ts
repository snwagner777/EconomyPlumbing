import { storage } from '@/server/storage';

export async function getPageMetadata(path: string) {
  try {
    const metadata = await storage.getPageMetadataByPath(path);
    return metadata || null;
  } catch (error) {
    console.error('[Metadata] Error fetching metadata for path:', path, error);
    return null;
  }
}
