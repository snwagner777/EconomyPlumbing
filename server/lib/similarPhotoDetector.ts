import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PhotoComparison {
  photoId1: string;
  photoId2: string;
  similarityScore: number; // 0-100, higher = more similar
  reason: string;
  recommended: 'keep_first' | 'keep_second' | 'keep_both';
}

interface SimilarPhotoGroup {
  photos: Array<{
    id: string;
    photoUrl: string;
    qualityScore: number;
    description?: string;
  }>;
  bestPhotoId: string;
  photosToDelete: string[];
}

/**
 * Compare two photos using OpenAI Vision to determine similarity
 */
export async function comparePhotos(
  photo1Buffer: Buffer,
  photo2Buffer: Buffer,
  photo1Desc?: string,
  photo2Desc?: string
): Promise<PhotoComparison> {
  const base64Photo1 = photo1Buffer.toString('base64');
  const base64Photo2 = photo2Buffer.toString('base64');

  const prompt = `You are analyzing two plumbing job photos to determine if they are duplicates or very similar photos from the same location/job.

Photo 1 Description: ${photo1Desc || 'No description'}
Photo 2 Description: ${photo2Desc || 'No description'}

Compare these photos and provide:
1. SIMILARITY SCORE (0-100):
   - 90-100: Exact duplicates or nearly identical (same angle, same subject, minimal differences)
   - 70-89: Very similar (same location/job, slightly different angle or lighting)
   - 50-69: Somewhat similar (same job but different areas or significant time gap)
   - 0-49: Different photos (different subjects, locations, or jobs)

2. REASON: Explain what makes them similar or different

3. RECOMMENDATION:
   - If similarity >= 70: Recommend keeping the better quality/more informative photo
   - If similarity < 70: Recommend keeping both

Respond in JSON format:
{
  "similarityScore": 0-100,
  "reason": "detailed explanation",
  "recommended": "keep_first" | "keep_second" | "keep_both"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Photo1}`,
                detail: "low", // Use low detail for faster/cheaper comparison
              },
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Photo2}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      photoId1: '',
      photoId2: '',
      similarityScore: result.similarityScore || 0,
      reason: result.reason || 'Unknown',
      recommended: result.recommended || 'keep_both'
    };
  } catch (error) {
    console.error("[Similar Photo Detector] Error comparing photos:", error);
    throw error;
  }
}

/**
 * Group photos by job/location for similarity detection
 * Priority: 1) Same job ID, 2) Same category + close timestamp (fallback for photos without job ID)
 */
export function groupPhotosByPotentialSimilarity(photos: any[]): any[][] {
  const groups: any[][] = [];
  
  // First, group by job ID (companyCamProjectId)
  const jobGroups = new Map<string, any[]>();
  const photosWithoutJob: any[] = [];
  
  for (const photo of photos) {
    if (photo.companyCamProjectId) {
      const jobId = photo.companyCamProjectId;
      if (!jobGroups.has(jobId)) {
        jobGroups.set(jobId, []);
      }
      jobGroups.get(jobId)!.push(photo);
    } else {
      photosWithoutJob.push(photo);
    }
  }
  
  // Add job-based groups (2+ photos from same job)
  for (const [_jobId, jobPhotos] of Array.from(jobGroups.entries())) {
    if (jobPhotos.length > 1) {
      groups.push(jobPhotos);
      console.log(`[Similar Photo Detector] Found ${jobPhotos.length} photos from same job`);
    }
  }
  
  // For photos without job ID, use fallback: same category + close timestamp
  const grouped = new Set<string>();
  
  for (let i = 0; i < photosWithoutJob.length; i++) {
    if (grouped.has(photosWithoutJob[i].id)) continue;

    const group = [photosWithoutJob[i]];
    grouped.add(photosWithoutJob[i].id);

    // Find photos that might be similar (fallback heuristic)
    for (let j = i + 1; j < photosWithoutJob.length; j++) {
      if (grouped.has(photosWithoutJob[j].id)) continue;

      const photo1 = photosWithoutJob[i];
      const photo2 = photosWithoutJob[j];

      // Fallback grouping: same category AND created within 24 hours
      const sameCategory = photo1.category === photo2.category;
      const timestamp1 = photo1.uploadedAt ? new Date(photo1.uploadedAt).getTime() : new Date(photo1.fetchedAt).getTime();
      const timestamp2 = photo2.uploadedAt ? new Date(photo2.uploadedAt).getTime() : new Date(photo2.fetchedAt).getTime();
      const withinTimeWindow = Math.abs(timestamp1 - timestamp2) < 24 * 60 * 60 * 1000; // 24 hours
      
      if (sameCategory && withinTimeWindow) {
        group.push(photo2);
        grouped.add(photo2.id);
      }
    }

    // Only create groups with 2+ photos
    if (group.length > 1) {
      groups.push(group);
      console.log(`[Similar Photo Detector] Found ${group.length} photos without job ID (category + timestamp fallback)`);
    }
  }

  return groups;
}

/**
 * Find and identify similar/duplicate photos in a group
 */
export async function findSimilarPhotos(
  photos: Array<{ id: string; photoUrl: string; qualityScore?: number; description?: string }>,
  downloadPhoto: (url: string) => Promise<Buffer>
): Promise<SimilarPhotoGroup[]> {
  const similarGroups: SimilarPhotoGroup[] = [];

  // Group photos by potential similarity first
  const potentialGroups = groupPhotosByPotentialSimilarity(photos);

  for (const group of potentialGroups) {
    if (group.length < 2) continue;

    console.log(`[Similar Photo Detector] Analyzing group of ${group.length} photos...`);

    // Compare each pair in the group
    const comparisons: Array<PhotoComparison & { photo1: any; photo2: any }> = [];

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        try {
          const photo1 = group[i];
          const photo2 = group[j];

          // Download photos
          const buffer1 = await downloadPhoto(photo1.photoUrl);
          const buffer2 = await downloadPhoto(photo2.photoUrl);

          const comparison = await comparePhotos(
            buffer1,
            buffer2,
            photo1.description || photo1.aiDescription,
            photo2.description || photo2.aiDescription
          );

          comparison.photoId1 = photo1.id;
          comparison.photoId2 = photo2.id;

          comparisons.push({
            ...comparison,
            photo1,
            photo2
          });

          console.log(
            `[Similar Photo Detector] ${photo1.id} vs ${photo2.id}: ${comparison.similarityScore}% similar - ${comparison.reason}`
          );
        } catch (error) {
          console.error(`[Similar Photo Detector] Error comparing photos:`, error);
        }
      }
    }

    // Find photos that are very similar (>= 70% similarity)
    const similarPairs = comparisons.filter(c => c.similarityScore >= 70);

    if (similarPairs.length > 0) {
      // Build a similarity graph and find connected components
      const similarityMap = new Map<string, Set<string>>();
      
      for (const pair of similarPairs) {
        if (!similarityMap.has(pair.photoId1)) {
          similarityMap.set(pair.photoId1, new Set());
        }
        if (!similarityMap.has(pair.photoId2)) {
          similarityMap.set(pair.photoId2, new Set());
        }
        similarityMap.get(pair.photoId1)!.add(pair.photoId2);
        similarityMap.get(pair.photoId2)!.add(pair.photoId1);
      }

      // For each similar group, choose the best photo
      const processed = new Set<string>();
      
      for (const [photoId, similarPhotos] of Array.from(similarityMap.entries())) {
        if (processed.has(photoId)) continue;

        const similarPhotoGroup = [photoId, ...Array.from(similarPhotos)];
        similarPhotoGroup.forEach(id => processed.add(id));

        // Get full photo objects
        const groupPhotos = group.filter((p: any) => similarPhotoGroup.includes(p.id));

        // Choose best photo (highest quality score)
        const bestPhoto = groupPhotos.reduce((best: any, current: any) => {
          const bestScore = best.qualityScore || 0;
          const currentScore = current.qualityScore || 0;
          return currentScore > bestScore ? current : best;
        });

        const photosToDelete = groupPhotos
          .filter((p: any) => p.id !== bestPhoto.id)
          .map((p: any) => p.id);

        if (photosToDelete.length > 0) {
          similarGroups.push({
            photos: groupPhotos.map((p: any) => ({
              id: p.id,
              photoUrl: p.photoUrl,
              qualityScore: p.qualityScore || 0,
              description: p.description || p.aiDescription
            })),
            bestPhotoId: bestPhoto.id,
            photosToDelete
          });

          console.log(
            `[Similar Photo Detector] Found ${groupPhotos.length} similar photos, keeping ${bestPhoto.id}, deleting ${photosToDelete.length} duplicates`
          );
        }
      }
    }
  }

  return similarGroups;
}
