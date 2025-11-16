import { db } from '../db';
import { seoAuditJobs, seoAuditResults, seoAuditBatches } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface LighthouseScores {
  performance?: number;
  seo?: number;
  accessibility?: number;
  bestPractices?: number;
}

interface SeoFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue: string;
  url?: string;
  recommendation: string;
}

export class SeoAuditProcessor {
  private processing = false;
  private tempDir = '/tmp/seo-audits';

  constructor() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async processQueue(): Promise<void> {
    if (this.processing) {
      console.log('[SEO Audit Processor] Already processing, skipping...');
      return;
    }

    this.processing = true;

    try {
      const [job] = await db
        .select()
        .from(seoAuditJobs)
        .where(eq(seoAuditJobs.status, 'queued'))
        .limit(1);

      if (!job) {
        return;
      }

      console.log(`[SEO Audit Processor] Processing job ${job.id} (${job.tool})`);

      await db
        .update(seoAuditJobs)
        .set({
          status: 'running',
          startedAt: new Date(),
        })
        .where(eq(seoAuditJobs.id, job.id));

      try {
        if (job.scope === 'batch' && job.batchId) {
          await this.processBatchAudit(job);
        } else if (job.scope === 'single' && job.targetUrl) {
          await this.processSingleAudit(job);
        } else if (job.scope === 'full-crawl' && job.targetUrl) {
          await this.processFullCrawl(job);
        } else {
          throw new Error('Invalid job configuration');
        }

        await db
          .update(seoAuditJobs)
          .set({
            status: 'succeeded',
            finishedAt: new Date(),
          })
          .where(eq(seoAuditJobs.id, job.id));

        console.log(`[SEO Audit Processor] Job ${job.id} completed successfully`);
      } catch (error) {
        console.error(`[SEO Audit Processor] Job ${job.id} failed:`, error);

        await db
          .update(seoAuditJobs)
          .set({
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            finishedAt: new Date(),
          })
          .where(eq(seoAuditJobs.id, job.id));
      }
    } finally {
      this.processing = false;
    }
  }

  private async processSingleAudit(job: typeof seoAuditJobs.$inferSelect): Promise<void> {
    const startTime = Date.now();
    const url = job.targetUrl!;

    if (job.tool === 'lighthouse') {
      await this.runLighthouse(job.id, url, job.config);
    } else if (job.tool === 'seo-analyzer') {
      await this.runSeoAnalyzer(job.id, url);
    } else if (job.tool === 'site-audit-seo') {
      await this.runSiteAuditSeo(job.id, url, job.config);
    }

    const duration = Math.floor((Date.now() - startTime) / 1000);
    console.log(`[SEO Audit Processor] Audit completed in ${duration}s`);
  }

  private async processBatchAudit(job: typeof seoAuditJobs.$inferSelect): Promise<void> {
    const [batch] = await db
      .select()
      .from(seoAuditBatches)
      .where(eq(seoAuditBatches.id, job.batchId!))
      .limit(1);

    if (!batch) {
      throw new Error('Batch not found');
    }

    const pages = batch.pages as Array<{ url: string; label: string }>;
    const startTime = Date.now();
    const allFindings: SeoFinding[] = [];
    let totalScores: LighthouseScores = {};

    for (const page of pages) {
      console.log(`[SEO Audit Processor] Auditing ${page.label}: ${page.url}`);
      
      if (job.tool === 'lighthouse') {
        const result = await this.runLighthouseForBatch(page.url, job.config);
        if (result.scores) {
          if (!totalScores.performance) totalScores.performance = 0;
          if (!totalScores.seo) totalScores.seo = 0;
          if (!totalScores.accessibility) totalScores.accessibility = 0;
          if (!totalScores.bestPractices) totalScores.bestPractices = 0;

          totalScores.performance! += result.scores.performance || 0;
          totalScores.seo! += result.scores.seo || 0;
          totalScores.accessibility! += result.scores.accessibility || 0;
          totalScores.bestPractices! += result.scores.bestPractices || 0;
        }
        if (result.findings) {
          allFindings.push(...result.findings);
        }
      }
    }

    const pageCount = pages.length;
    if (totalScores.performance) totalScores.performance = Math.round(totalScores.performance / pageCount);
    if (totalScores.seo) totalScores.seo = Math.round(totalScores.seo / pageCount);
    if (totalScores.accessibility) totalScores.accessibility = Math.round(totalScores.accessibility / pageCount);
    if (totalScores.bestPractices) totalScores.bestPractices = Math.round(totalScores.bestPractices / pageCount);

    const duration = Math.floor((Date.now() - startTime) / 1000);

    const topRecommendations = allFindings
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .slice(0, 10)
      .map(f => f.recommendation);

    await db.insert(seoAuditResults).values({
      jobId: job.id,
      lighthouseScores: totalScores,
      seoFindings: allFindings,
      topRecommendations,
      pageCount,
      duration,
      rawOutput: JSON.stringify({ batch: batch.label, pages: allFindings }),
    });
  }

  private async processFullCrawl(job: typeof seoAuditJobs.$inferSelect): Promise<void> {
    const startTime = Date.now();
    const url = job.targetUrl!;
    const maxDepth = (job.config as any)?.maxDepth || 5;

    const outputFile = path.join(this.tempDir, `crawl-${job.id}.json`);
    const command = `npx site-audit-seo -u "${url}" --preset seo --max-depth ${maxDepth} --output json > "${outputFile}"`;

    console.log(`[SEO Audit Processor] Running: ${command}`);

    const { stdout, stderr } = await execAsync(command, {
      timeout: 600000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const duration = Math.floor((Date.now() - startTime) / 1000);

    let rawOutput = '';
    let findings: SeoFinding[] = [];
    let pageCount = 0;

    if (fs.existsSync(outputFile)) {
      rawOutput = fs.readFileSync(outputFile, 'utf-8');
      try {
        const parsed = JSON.parse(rawOutput);
        pageCount = parsed.pages?.length || 0;
        findings = this.parseSiteAuditFindings(parsed);
      } catch (e) {
        console.error('[SEO Audit Processor] Failed to parse crawl output:', e);
      }
      fs.unlinkSync(outputFile);
    }

    const topRecommendations = findings
      .filter(f => f.severity === 'critical' || f.severity === 'high')
      .slice(0, 10)
      .map(f => f.recommendation);

    await db.insert(seoAuditResults).values({
      jobId: job.id,
      seoFindings: findings,
      topRecommendations,
      pageCount,
      duration,
      rawOutput: rawOutput.substring(0, 50000),
    });
  }

  private async runLighthouse(jobId: string, url: string, config: any): Promise<void> {
    const outputFile = path.join(this.tempDir, `lighthouse-${jobId}.json`);
    const preset = config?.preset || 'mobile';
    const categories = config?.categories?.join(',') || 'performance,seo,accessibility,best-practices';

    const command = `npx lighthouse "${url}" --preset=${preset} --only-categories=${categories} --output=json --output-path="${outputFile}" --chrome-flags="--headless --no-sandbox"`;

    console.log(`[SEO Audit Processor] Running: ${command}`);

    try {
      await execAsync(command, {
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
      });

      if (fs.existsSync(outputFile)) {
        const report = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
        const scores = this.extractLighthouseScores(report);
        const findings = this.extractLighthouseFindings(report, url);
        const topRecommendations = findings
          .filter(f => f.severity === 'critical' || f.severity === 'high')
          .slice(0, 10)
          .map(f => f.recommendation);

        await db.insert(seoAuditResults).values({
          jobId,
          lighthouseScores: scores,
          seoFindings: findings,
          topRecommendations,
          pageCount: 1,
          rawOutput: JSON.stringify(report).substring(0, 50000),
        });

        fs.unlinkSync(outputFile);
      }
    } catch (error) {
      throw new Error(`Lighthouse failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runLighthouseForBatch(url: string, config: any): Promise<{ scores?: LighthouseScores; findings?: SeoFinding[] }> {
    const tempFile = path.join(this.tempDir, `batch-${Date.now()}.json`);
    const preset = config?.preset || 'mobile';
    const categories = config?.categories?.join(',') || 'performance,seo,accessibility,best-practices';

    const command = `npx lighthouse "${url}" --preset=${preset} --only-categories=${categories} --output=json --output-path="${tempFile}" --chrome-flags="--headless --no-sandbox"`;

    try {
      await execAsync(command, {
        timeout: 300000,
        maxBuffer: 10 * 1024 * 1024,
      });

      if (fs.existsSync(tempFile)) {
        const report = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
        const scores = this.extractLighthouseScores(report);
        const findings = this.extractLighthouseFindings(report, url);
        fs.unlinkSync(tempFile);
        return { scores, findings };
      }
    } catch (error) {
      console.error(`[SEO Audit Processor] Lighthouse failed for ${url}:`, error);
    }

    return {};
  }

  private async runSeoAnalyzer(jobId: string, url: string): Promise<void> {
    const command = `npx seo-analyzer -u "${url}"`;

    console.log(`[SEO Audit Processor] Running: ${command}`);

    try {
      const { stdout } = await execAsync(command, {
        timeout: 60000,
        maxBuffer: 5 * 1024 * 1024,
      });

      const findings: SeoFinding[] = this.parseSeoAnalyzerOutput(stdout, url);
      const topRecommendations = findings
        .filter(f => f.severity === 'critical' || f.severity === 'high')
        .slice(0, 10)
        .map(f => f.recommendation);

      await db.insert(seoAuditResults).values({
        jobId,
        seoFindings: findings,
        topRecommendations,
        pageCount: 1,
        rawOutput: stdout.substring(0, 50000),
      });
    } catch (error) {
      throw new Error(`SEO Analyzer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async runSiteAuditSeo(jobId: string, url: string, config: any): Promise<void> {
    const outputFile = path.join(this.tempDir, `audit-${jobId}.json`);
    const maxDepth = config?.maxDepth || 3;

    const command = `npx site-audit-seo -u "${url}" --preset seo --max-depth ${maxDepth} --output json > "${outputFile}"`;

    console.log(`[SEO Audit Processor] Running: ${command}`);

    try {
      await execAsync(command, {
        timeout: 600000,
        maxBuffer: 10 * 1024 * 1024,
      });

      if (fs.existsSync(outputFile)) {
        const rawOutput = fs.readFileSync(outputFile, 'utf-8');
        const parsed = JSON.parse(rawOutput);
        const findings = this.parseSiteAuditFindings(parsed);
        const pageCount = parsed.pages?.length || 0;

        const topRecommendations = findings
          .filter(f => f.severity === 'critical' || f.severity === 'high')
          .slice(0, 10)
          .map(f => f.recommendation);

        await db.insert(seoAuditResults).values({
          jobId,
          seoFindings: findings,
          topRecommendations,
          pageCount,
          rawOutput: rawOutput.substring(0, 50000),
        });

        fs.unlinkSync(outputFile);
      }
    } catch (error) {
      throw new Error(`Site Audit SEO failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractLighthouseScores(report: any): LighthouseScores {
    const categories = report.categories || {};
    return {
      performance: Math.round((categories.performance?.score || 0) * 100),
      seo: Math.round((categories.seo?.score || 0) * 100),
      accessibility: Math.round((categories.accessibility?.score || 0) * 100),
      bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
    };
  }

  private extractLighthouseFindings(report: any, url: string): SeoFinding[] {
    const findings: SeoFinding[] = [];
    const audits = report.audits || {};

    for (const [key, audit] of Object.entries(audits) as any) {
      if (audit.score !== null && audit.score < 0.9) {
        const severity = audit.score < 0.5 ? 'high' : audit.score < 0.75 ? 'medium' : 'low';
        findings.push({
          severity,
          issue: audit.title,
          url,
          recommendation: audit.description || 'No recommendation available',
        });
      }
    }

    return findings;
  }

  private parseSeoAnalyzerOutput(output: string, url: string): SeoFinding[] {
    const findings: SeoFinding[] = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('ERROR') || line.includes('WARNING')) {
        findings.push({
          severity: line.includes('ERROR') ? 'high' : 'medium',
          issue: line.trim(),
          url,
          recommendation: 'Check the specific issue mentioned',
        });
      }
    }

    return findings;
  }

  private parseSiteAuditFindings(data: any): SeoFinding[] {
    const findings: SeoFinding[] = [];

    if (data.pages) {
      for (const page of data.pages) {
        if (page.errors) {
          for (const error of page.errors) {
            findings.push({
              severity: 'high',
              issue: error,
              url: page.url,
              recommendation: 'Fix the reported error',
            });
          }
        }

        if (page.warnings) {
          for (const warning of page.warnings) {
            findings.push({
              severity: 'medium',
              issue: warning,
              url: page.url,
              recommendation: 'Address the reported warning',
            });
          }
        }
      }
    }

    return findings;
  }
}

export const seoAuditProcessor = new SeoAuditProcessor();
