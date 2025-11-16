/**
 * ServiceTitan Photo Fetch Processor
 * 
 * Processes queued photo fetch jobs triggered by invoice webhooks
 * 
 * Flow:
 * 1. Invoice webhook → Create serviceTitanPhotoJobs record
 * 2. Background worker processes queue every minute
 * 3. Fetch job attachments from ServiceTitan API
 * 4. Download photos and analyze quality (AI score ≥70)
 * 5. Upload quality photos to Google Drive
 * 6. Update job status and photo counts
 */

import { db } from '../db';
import { serviceTitanPhotoJobs, importedPhotos } from '../../shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { serviceTitanJobs } from './servicetitan/jobs';
import OpenAI from 'openai';
import { google } from 'googleapis';

// Quality threshold for production use
const QUALITY_THRESHOLD = 70;

// Google Drive folder ID (from existing integration)
const GDRIVE_FOLDER_ID = process.env.GDRIVE_FOLDER_ID || '1PEq7xVQe8vD-8Z9vQ9vQ9vQ9vQ9vQ9vQ';

export class ServiceTitanPhotoFetcher {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Process a single photo fetch job
   */
  async processJob(jobId: string): Promise<void> {
    console.log(`[Photo Fetcher] Processing job ${jobId}`);

    // Get job record
    const [job] = await db
      .select()
      .from(serviceTitanPhotoJobs)
      .where(eq(serviceTitanPhotoJobs.id, jobId))
      .limit(1);

    if (!job) {
      console.error(`[Photo Fetcher] Job ${jobId} not found`);
      return;
    }

    // Validate required credentials before processing
    if (!process.env.OPENAI_API_KEY) {
      console.error(`[Photo Fetcher] OPENAI_API_KEY not configured`);
      await db
        .update(serviceTitanPhotoJobs)
        .set({
          status: 'failed',
          errorMessage: 'OPENAI_API_KEY not configured - cannot analyze photo quality',
          completedAt: new Date(),
        })
        .where(eq(serviceTitanPhotoJobs.id, jobId));
      return;
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      console.error(`[Photo Fetcher] GOOGLE_SERVICE_ACCOUNT_JSON not configured`);
      await db
        .update(serviceTitanPhotoJobs)
        .set({
          status: 'failed',
          errorMessage: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured - cannot upload photos',
          completedAt: new Date(),
        })
        .where(eq(serviceTitanPhotoJobs.id, jobId));
      return;
    }

    try {
      // Fetch attachments from ServiceTitan
      console.log(`[Photo Fetcher] Fetching attachments for ServiceTitan job ${job.jobId}`);
      const attachments = await serviceTitanJobs.getJobAttachments(job.jobId);

      if (attachments.length === 0) {
        console.log(`[Photo Fetcher] No attachments found for job ${job.jobId}`);
        await db
          .update(serviceTitanPhotoJobs)
          .set({
            status: 'completed',
            completedAt: new Date(),
            photosFound: 0,
            photosImported: 0,
          })
          .where(eq(serviceTitanPhotoJobs.id, jobId));
        return;
      }

      console.log(`[Photo Fetcher] Found ${attachments.length} attachments for job ${job.jobId}`);

      // Filter for image files
      const imageAttachments = attachments.filter(att =>
        /\.(jpg|jpeg|png|heic|webp)$/i.test(att.originalFileName)
      );

      console.log(`[Photo Fetcher] ${imageAttachments.length} image files found`);

      let importedCount = 0;

      // Process each image
      for (const attachment of imageAttachments) {
        try {
          console.log(`[Photo Fetcher] Processing ${attachment.originalFileName}`);

          // Download photo
          const photoBuffer = await serviceTitanJobs.downloadAttachment(attachment.downloadUrl);

          // Analyze quality using OpenAI Vision
          const analysis = await this.analyzePhotoQuality(photoBuffer, attachment.originalFileName);

          console.log(`[Photo Fetcher] Quality score: ${analysis.score} - ${analysis.reason}`);

          // Only import high-quality photos
          if (analysis.score >= QUALITY_THRESHOLD) {
            // Upload to Google Drive
            const gdriveFileId = await this.uploadToGoogleDrive(
              photoBuffer,
              attachment.originalFileName,
              job.jobId
            );

            // Check for duplicates
            const existing = await db
              .select()
              .from(importedPhotos)
              .where(eq(importedPhotos.gdriveFileId, gdriveFileId))
              .limit(1);

            if (existing.length === 0) {
              // Store metadata in database
              await db.insert(importedPhotos).values({
                url: `https://drive.google.com/file/d/${gdriveFileId}/view`,
                category: analysis.category || 'uncategorized',
                isProductionQuality: true,
                aiQuality: analysis.score,
                aiQualityScore: analysis.score,
                qualityReason: analysis.reason,
                aiDescription: analysis.description,
                aiTags: analysis.tags,
                gdriveFileId,
                usedInBlog: false,
                uploadDate: new Date(),
              });

              importedCount++;
              console.log(`[Photo Fetcher] Imported ${attachment.originalFileName} (${analysis.score}/100)`);
            } else {
              console.log(`[Photo Fetcher] Skipped duplicate: ${attachment.originalFileName}`);
            }
          } else {
            console.log(`[Photo Fetcher] Skipped low-quality photo: ${attachment.originalFileName} (${analysis.score}/100)`);
          }
        } catch (photoError) {
          console.error(`[Photo Fetcher] Error processing ${attachment.originalFileName}:`, photoError);
          // Continue with next photo
        }
      }

      // Mark job as completed
      await db
        .update(serviceTitanPhotoJobs)
        .set({
          status: 'completed',
          completedAt: new Date(),
          photosFound: imageAttachments.length,
          photosImported: importedCount,
        })
        .where(eq(serviceTitanPhotoJobs.id, jobId));

      console.log(`[Photo Fetcher] Job ${jobId} completed: ${importedCount}/${imageAttachments.length} photos imported`);
    } catch (error) {
      console.error(`[Photo Fetcher] Error processing job ${jobId}:`, error);

      // Check if we should retry
      const shouldRetry = job.retryCount < job.maxRetries;

      await db
        .update(serviceTitanPhotoJobs)
        .set({
          status: shouldRetry ? 'retrying' : 'failed',
          errorMessage: error instanceof Error ? error.message : String(error),
          retryCount: job.retryCount + 1,
          lastProcessedAt: new Date(),
          ...(shouldRetry ? {} : { completedAt: new Date() }),
        })
        .where(eq(serviceTitanPhotoJobs.id, jobId));

      console.log(`[Photo Fetcher] Job ${jobId} ${shouldRetry ? 'will retry' : 'failed permanently'} (attempt ${job.retryCount + 1}/${job.maxRetries})`);
    }
  }

  /**
   * Analyze photo quality using OpenAI Vision
   */
  private async analyzePhotoQuality(
    photoBuffer: Buffer,
    fileName: string
  ): Promise<{
    score: number;
    reason: string;
    description: string;
    category: string;
    tags: string[];
  }> {
    try {
      // Convert to base64
      const base64Image = photoBuffer.toString('base64');
      const mimeType = this.getMimeType(fileName);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this plumbing service photo for production quality. Provide a JSON response with:
                
1. score (0-100): Overall quality score based on:
   - Technical quality (lighting, focus, composition)
   - Professional relevance (shows plumbing work clearly)
   - Customer-facing suitability (presentable, not cluttered)
   
2. reason: Brief explanation of the score

3. description: Professional description of what's shown (1-2 sentences)

4. category: Best category match from: water-heater, drain-cleaning, leak-repair, pipe-installation, faucet-repair, toilet-repair, sewer-line, water-filtration, garbage-disposal, bathtub, shower, slab-leak, repiping, commercial, emergency, general

5. tags: Array of 3-5 relevant keywords

Response must be valid JSON.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '{}';
      
      // Extract JSON from markdown code block if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      
      const analysis = JSON.parse(jsonString);

      return {
        score: analysis.score || 0,
        reason: analysis.reason || 'No analysis provided',
        description: analysis.description || '',
        category: analysis.category || 'general',
        tags: analysis.tags || [],
      };
    } catch (error) {
      console.error('[Photo Fetcher] Error analyzing photo:', error);
      // Return low score on error
      return {
        score: 0,
        reason: 'Analysis failed',
        description: '',
        category: 'general',
        tags: [],
      };
    }
  }

  /**
   * Upload photo to Google Drive
   */
  private async uploadToGoogleDrive(
    photoBuffer: Buffer,
    fileName: string,
    jobId: number
  ): Promise<string> {
    try {
      // Initialize Google Drive API
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}'),
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });

      const drive = google.drive({ version: 'v3', auth });

      // Upload file
      const response = await drive.files.create({
        requestBody: {
          name: `ST-Job-${jobId}-${fileName}`,
          parents: [GDRIVE_FOLDER_ID],
        },
        media: {
          mimeType: this.getMimeType(fileName),
          body: require('stream').Readable.from(photoBuffer),
        },
        fields: 'id',
      });

      const fileId = response.data.id;
      if (!fileId) {
        throw new Error('Failed to get Google Drive file ID');
      }

      console.log(`[Photo Fetcher] Uploaded to Google Drive: ${fileId}`);
      return fileId;
    } catch (error) {
      console.error('[Photo Fetcher] Error uploading to Google Drive:', error);
      throw error;
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      heic: 'image/heic',
      webp: 'image/webp',
    };
    return mimeTypes[ext || 'jpg'] || 'image/jpeg';
  }

  /**
   * Process all queued/retrying jobs
   * Called by background worker every minute
   * 
   * Uses atomic job claiming to prevent duplicate processing across worker invocations
   */
  async processQueue(): Promise<void> {
    console.log('[Photo Fetcher] Processing queue...');

    try {
      // First, select limited IDs to claim (prevent orphaned jobs)
      const queuedJobs = await db
        .select({ id: serviceTitanPhotoJobs.id })
        .from(serviceTitanPhotoJobs)
        .where(eq(serviceTitanPhotoJobs.status, 'queued'))
        .limit(10);

      const retryingJobs = await db
        .select({ id: serviceTitanPhotoJobs.id })
        .from(serviceTitanPhotoJobs)
        .where(eq(serviceTitanPhotoJobs.status, 'retrying'))
        .limit(5);

      const jobIds = [
        ...queuedJobs.map(j => j.id),
        ...retryingJobs.map(j => j.id),
      ];

      if (jobIds.length === 0) {
        console.log('[Photo Fetcher] No jobs in queue');
        return;
      }

      console.log(`[Photo Fetcher] Found ${jobIds.length} jobs to process`);

      // Process each job individually with atomic status transition
      for (const jobId of jobIds) {
        try {
          // Atomically claim this job by updating status to 'processing'
          const claimed = await db
            .update(serviceTitanPhotoJobs)
            .set({
              status: 'processing',
              lastProcessedAt: new Date(),
            })
            .where(
              and(
                eq(serviceTitanPhotoJobs.id, jobId),
                // Only claim if still queued/retrying (prevents race conditions)
                or(
                  eq(serviceTitanPhotoJobs.status, 'queued'),
                  eq(serviceTitanPhotoJobs.status, 'retrying')
                )
              )
            )
            .returning();

          if (claimed.length === 0) {
            console.log(`[Photo Fetcher] Job ${jobId} already claimed by another worker, skipping`);
            continue;
          }

          // Process the claimed job
          await this.processJob(jobId);
        } catch (jobError) {
          console.error(`[Photo Fetcher] Error processing job ${jobId}:`, jobError);
          // Continue with next job
        }
      }

      console.log('[Photo Fetcher] Queue processing complete');
    } catch (error) {
      console.error('[Photo Fetcher] Error processing queue:', error);
    }
  }
}

export const serviceTitanPhotoFetcher = new ServiceTitanPhotoFetcher();
