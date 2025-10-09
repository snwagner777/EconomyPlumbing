import type { InsertCompanyCamPhoto } from "@shared/schema";
import { analyzePhotoQuality } from "./photoQualityAnalyzer";
import { storage } from "../storage";

interface ServiceTitanConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  appKey: string;
}

interface ServiceTitanJob {
  id: number;
  jobNumber: string;
  customerId: number;
  businessUnitId: number;
  jobStatus: string;
  completedOn?: string;
  summary?: string;
  projectId?: number;
}

interface ServiceTitanProject {
  id: number;
  number: string;
  name: string;
  status: string;
  startDate: string;
  completedOn?: string;
}

interface ServiceTitanPhoto {
  id: number;
  url: string;
  uploadedOn: string;
  description?: string;
}

class ServiceTitanProjectPhotosAPI {
  private config: ServiceTitanConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: ServiceTitanConfig) {
    this.config = config;
  }

  /**
   * Authenticate with ServiceTitan OAuth 2.0
   */
  private async authenticate(): Promise<void> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return;
    }

    const tokenUrl = 'https://auth.servicetitan.io/connect/token';
    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000;
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.authenticate();

    const url = `https://api.servicetitan.io${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'ST-App-Key': this.config.appKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ServiceTitan API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Fetch jobs completed in the last N days
   */
  async getRecentJobs(daysAgo: number = 30): Promise<ServiceTitanJob[]> {
    const completedAfter = new Date();
    completedAfter.setDate(completedAfter.getDate() - daysAgo);
    const completedAfterStr = completedAfter.toISOString();

    console.log(`[ServiceTitan] Fetching jobs completed after ${completedAfterStr}...`);

    try {
      const response = await this.request<{ data: ServiceTitanJob[] }>(
        `/jpm/v2/tenant/${this.config.tenantId}/jobs?completedOnOrAfter=${encodeURIComponent(completedAfterStr)}&pageSize=100`
      );

      console.log(`[ServiceTitan] Found ${response.data?.length || 0} recent jobs`);
      return response.data || [];
    } catch (error) {
      console.error('[ServiceTitan] Error fetching jobs:', error);
      return [];
    }
  }

  /**
   * Fetch projects completed in the last N days
   */
  async getRecentProjects(daysAgo: number = 30): Promise<ServiceTitanProject[]> {
    const completedAfter = new Date();
    completedAfter.setDate(completedAfter.getDate() - daysAgo);
    const completedAfterStr = completedAfter.toISOString();

    console.log(`[ServiceTitan] Fetching projects completed after ${completedAfterStr}...`);

    try {
      const response = await this.request<{ data: ServiceTitanProject[] }>(
        `/pricebook/v2/tenant/${this.config.tenantId}/projects?completedOnOrAfter=${encodeURIComponent(completedAfterStr)}&pageSize=100`
      );

      console.log(`[ServiceTitan] Found ${response.data?.length || 0} recent projects`);
      return response.data || [];
    } catch (error) {
      console.error('[ServiceTitan] Error fetching projects:', error);
      return [];
    }
  }

  /**
   * Fetch photos for a specific job
   */
  async getJobPhotos(jobId: number): Promise<ServiceTitanPhoto[]> {
    try {
      const response = await this.request<{ data: ServiceTitanPhoto[] }>(
        `/jpm/v2/tenant/${this.config.tenantId}/jobs/${jobId}/attachments`
      );

      return response.data || [];
    } catch (error) {
      console.error(`[ServiceTitan] Error fetching photos for job ${jobId}:`, error);
      return [];
    }
  }

  /**
   * Fetch photos for a specific project
   */
  async getProjectPhotos(projectId: number): Promise<ServiceTitanPhoto[]> {
    try {
      const response = await this.request<{ data: ServiceTitanPhoto[] }>(
        `/pricebook/v2/tenant/${this.config.tenantId}/projects/${projectId}/photos`
      );

      return response.data || [];
    } catch (error) {
      console.error(`[ServiceTitan] Error fetching photos for project ${projectId}:`, error);
      return [];
    }
  }

  /**
   * Categorize photo based on AI tags and description
   */
  private categorizePhoto(aiDescription: string, tags: string[]): string {
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
    if (combined.includes("backflow")) {
      return "backflow";
    }
    if (combined.includes("commercial") || combined.includes("business")) {
      return "commercial";
    }

    return "general";
  }

  /**
   * Process and filter a single photo using AI
   */
  private async processPhoto(
    photo: ServiceTitanPhoto,
    jobId: number,
    jobDescription?: string
  ): Promise<InsertCompanyCamPhoto | null> {
    try {
      const analysis = await analyzePhotoQuality(photo.url, jobDescription);

      if (!analysis.shouldKeep) {
        console.log(`  ❌ Rejected photo ${photo.id} - ${analysis.reasoning}`);
        return null;
      }

      const category = this.categorizePhoto(analysis.reasoning, analysis.categories);

      return {
        companyCamPhotoId: `st_${jobId}_${photo.id}`,
        companyCamProjectId: jobId.toString(),
        photoUrl: photo.url,
        thumbnailUrl: photo.url,
        category,
        aiDescription: analysis.reasoning,
        tags: analysis.categories,
        qualityAnalyzed: true,
        isGoodQuality: analysis.isGoodQuality,
        shouldKeep: analysis.shouldKeep,
        qualityScore: analysis.qualityScore,
        qualityReasoning: analysis.reasoning,
        analyzedAt: new Date(),
        uploadedAt: photo.uploadedOn ? new Date(photo.uploadedOn) : undefined,
      };
    } catch (error) {
      console.error(`Error processing photo ${photo.id}:`, error);
      return null;
    }
  }

  /**
   * Import and filter photos from recent jobs
   */
  async importRecentJobPhotos(daysAgo: number = 30): Promise<number> {
    console.log(`\n[Photo Import] Starting import of photos from jobs in last ${daysAgo} days...`);

    const jobs = await this.getRecentJobs(daysAgo);
    console.log(`[Photo Import] Processing ${jobs.length} jobs...`);

    let totalImported = 0;

    for (const job of jobs) {
      console.log(`\n[Photo Import] Job ${job.jobNumber} (ID: ${job.id})...`);
      
      const photos = await this.getJobPhotos(job.id);
      console.log(`[Photo Import] Found ${photos.length} photos`);

      if (photos.length === 0) continue;

      // Process photos in batches of 3 to respect rate limits
      const batchSize = 3;
      const processedPhotos: InsertCompanyCamPhoto[] = [];

      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);
        const results = await Promise.all(
          batch.map(photo => this.processPhoto(photo, job.id, job.summary))
        );

        processedPhotos.push(...results.filter((p): p is InsertCompanyCamPhoto => p !== null));

        // Delay between batches
        if (i + batchSize < photos.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (processedPhotos.length > 0) {
        await storage.savePhotos(processedPhotos);
        totalImported += processedPhotos.length;
        console.log(`[Photo Import] ✅ Saved ${processedPhotos.length} quality photos from job ${job.jobNumber}`);
      }
    }

    console.log(`\n[Photo Import] Complete! Imported ${totalImported} quality photos from ${jobs.length} jobs`);
    return totalImported;
  }
}

/**
 * Create and export API instance
 */
export function createServiceTitanProjectPhotosAPI(): ServiceTitanProjectPhotosAPI | null {
  const clientId = process.env.SERVICETITAN_CLIENT_ID;
  const clientSecret = process.env.SERVICETITAN_CLIENT_SECRET;
  const tenantId = process.env.SERVICETITAN_TENANT_ID;
  const appKey = process.env.SERVICETITAN_APP_KEY;

  if (!clientId || !clientSecret || !tenantId || !appKey) {
    console.error('[ServiceTitan] Missing credentials');
    return null;
  }

  return new ServiceTitanProjectPhotosAPI({
    clientId,
    clientSecret,
    tenantId,
    appKey,
  });
}
