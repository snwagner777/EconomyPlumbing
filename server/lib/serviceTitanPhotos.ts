import type { InsertCompanyCamPhoto } from "@shared/schema";
import { analyzePhotoQuality } from "./photoQualityAnalyzer";

interface ServiceTitanPhoto {
  id: string;
  url: string;
  uploadedAt: string;
}

interface ServiceTitanProject {
  id: string;
  name: string;
  description?: string;
}

interface ServiceTitanJobAttachment {
  id: string;
  url: string;
  uploadedAt: string;
}

/**
 * Fetches photos from ServiceTitan Projects API (CompanyCam alternative)
 */
async function fetchServiceTitanProjectPhotos(
  projectId: string,
  token: string
): Promise<ServiceTitanPhoto[]> {
  const tenantId = process.env.SERVICETITAN_TENANT_ID;
  if (!tenantId) {
    throw new Error("SERVICETITAN_TENANT_ID not configured");
  }

  const response = await fetch(
    `https://api.servicetitan.io/v2/projects/${projectId}/photos`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "ST-App-Key": process.env.SERVICETITAN_APP_KEY || "",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`ServiceTitan API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetches job attachments from ServiceTitan Forms API
 */
async function fetchServiceTitanJobAttachments(
  jobId: string,
  attachmentId: string,
  token: string
): Promise<ServiceTitanJobAttachment | null> {
  const tenantId = process.env.SERVICETITAN_TENANT_ID;
  if (!tenantId) {
    throw new Error("SERVICETITAN_TENANT_ID not configured");
  }

  const response = await fetch(
    `https://api.servicetitan.io/forms/v2/tenant/${tenantId}/jobs/attachment/${attachmentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "ST-App-Key": process.env.SERVICETITAN_APP_KEY || "",
      },
    }
  );

  if (!response.ok) {
    console.error(`Failed to fetch job attachment: ${response.statusText}`);
    return null;
  }

  const data = await response.json();
  return data;
}

/**
 * Categorize photo based on AI tags and description
 */
function categorizePhoto(
  aiDescription: string,
  tags: string[]
): string {
  const combined = `${aiDescription} ${tags.join(" ")}`.toLowerCase();

  if (
    combined.includes("water heater") ||
    combined.includes("tank") ||
    combined.includes("heater")
  ) {
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
  if (combined.includes("backflow")) {
    return "backflow";
  }
  if (
    combined.includes("commercial") ||
    combined.includes("business") ||
    combined.includes("building")
  ) {
    return "commercial";
  }

  return "general";
}

/**
 * Process and filter photos using OpenAI Vision API
 * Returns only high-quality photos that pass the quality threshold
 */
export async function processAndFilterPhotos(
  photos: Array<{ url: string; projectId: string; photoId: string; uploadedAt?: string }>,
  jobDescription?: string
): Promise<InsertCompanyCamPhoto[]> {
  const processedPhotos: InsertCompanyCamPhoto[] = [];

  console.log(`Processing ${photos.length} photos with AI quality analysis...`);

  for (const photo of photos) {
    try {
      // Analyze photo quality with OpenAI Vision
      const analysis = await analyzePhotoQuality(photo.url, jobDescription);

      console.log(
        `Photo ${photo.photoId}: Quality=${analysis.qualityScore}/10, Keep=${analysis.shouldKeep}, Reason="${analysis.reasoning}"`
      );

      // Only keep photos that pass quality check
      if (!analysis.shouldKeep) {
        console.log(`  ❌ Rejected - ${analysis.reasoning}`);
        continue;
      }

      // Categorize based on AI analysis
      const category = categorizePhoto(
        analysis.reasoning,
        analysis.categories
      );

      const processedPhoto: InsertCompanyCamPhoto = {
        companyCamPhotoId: photo.photoId,
        companyCamProjectId: photo.projectId,
        photoUrl: photo.url,
        thumbnailUrl: photo.url, // ServiceTitan doesn't provide separate thumbnails
        category,
        aiDescription: analysis.reasoning,
        tags: analysis.categories,
        qualityAnalyzed: true,
        isGoodQuality: analysis.isGoodQuality,
        shouldKeep: analysis.shouldKeep,
        qualityScore: analysis.qualityScore,
        qualityReasoning: analysis.reasoning,
        analyzedAt: new Date(),
        uploadedAt: photo.uploadedAt ? new Date(photo.uploadedAt) : undefined,
      };

      processedPhotos.push(processedPhoto);
      console.log(`  ✅ Kept - Category: ${category}, Score: ${analysis.qualityScore}/10`);
    } catch (error) {
      console.error(`Error processing photo ${photo.photoId}:`, error);
      // Skip photos that fail to process
    }
  }

  console.log(
    `Quality filtering complete: ${processedPhotos.length}/${photos.length} photos passed`
  );

  return processedPhotos;
}

/**
 * Fetch and process photos from ServiceTitan, filtering by quality
 */
export async function fetchAndFilterServiceTitanPhotos(
  projectId: string,
  token: string,
  jobDescription?: string
): Promise<InsertCompanyCamPhoto[]> {
  try {
    const photos = await fetchServiceTitanProjectPhotos(projectId, token);

    if (photos.length === 0) {
      console.log(`No photos found for project ${projectId}`);
      return [];
    }

    const photosToProcess = photos.map((photo) => ({
      url: photo.url,
      projectId,
      photoId: photo.id,
      uploadedAt: photo.uploadedAt,
    }));

    return await processAndFilterPhotos(photosToProcess, jobDescription);
  } catch (error) {
    console.error(`Error fetching ServiceTitan photos:`, error);
    return [];
  }
}
