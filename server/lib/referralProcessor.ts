import { db } from "../db";
import { referrals } from "../../shared/schema";
import { getServiceTitanAPI } from "./serviceTitan";
import { eq, and } from "drizzle-orm";

/**
 * Automatic Referral Processing System
 * 
 * This job runs periodically to:
 * 1. Match referees to ServiceTitan customers (pending → contacted)
 * 2. Check for completed jobs ≥$200 (contacted → job_completed)
 * 3. Issue $25 credits to referrers (job_completed → credited)
 */

const MINIMUM_JOB_AMOUNT = 20000; // $200.00 in cents
const CREDIT_AMOUNT = 2500; // $25.00 in cents

export class ReferralProcessor {
  private isProcessing = false;

  /**
   * Process all pending referrals
   */
  async processPendingReferrals(): Promise<void> {
    if (this.isProcessing) {
      console.log('[Referral Processor] Already processing, skipping...');
      return;
    }

    this.isProcessing = true;
    try {
      console.log('[Referral Processor] Starting referral processing cycle...');
      
      await this.matchRefereesToCustomers();
      await this.checkForCompletedJobs();
      await this.issueCreditsForCompletedJobs();
      
      console.log('[Referral Processor] Processing cycle complete');
    } catch (error) {
      console.error('[Referral Processor] Error during processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Step 1: Match referees to ServiceTitan customers
   * Updates status from 'pending' to 'contacted' when referee is found in ServiceTitan
   */
  private async matchRefereesToCustomers(): Promise<void> {
    const pendingReferrals = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.status, 'pending'),
          eq(referrals.refereeCustomerId, null as any)
        )
      );

    console.log(`[Referral Processor] Found ${pendingReferrals.length} pending referrals to match`);

    const api = getServiceTitanAPI();

    for (const referral of pendingReferrals) {
      try {
        // Try to find referee by phone first
        const customerId = await api.searchCustomerWithFallback(referral.refereePhone);
        
        // If not found by phone, try email if provided
        const finalCustomerId = customerId || 
          (referral.refereeEmail ? await api.searchCustomerWithFallback(referral.refereeEmail) : null);

        if (finalCustomerId) {
          console.log(`[Referral Processor] ✅ Matched referee "${referral.refereeName}" to ServiceTitan customer ${finalCustomerId}`);
          
          await db
            .update(referrals)
            .set({
              refereeCustomerId: finalCustomerId,
              status: 'contacted',
              contactedAt: new Date(),
              updatedAt: new Date()
            })
            .where(eq(referrals.id, referral.id));
        } else {
          console.log(`[Referral Processor] ⏳ Referee "${referral.refereeName}" not yet a customer`);
        }
      } catch (error) {
        console.error(`[Referral Processor] Error matching referral ${referral.id}:`, error);
      }
    }
  }

  /**
   * Step 2: Check for completed jobs for contacted referrals
   * Updates status from 'contacted' to 'job_completed' when first qualifying job is found
   */
  private async checkForCompletedJobs(): Promise<void> {
    const contactedReferrals = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.status, 'contacted'),
          eq(referrals.firstJobId, null as any)
        )
      );

    console.log(`[Referral Processor] Checking ${contactedReferrals.length} contacted referrals for completed jobs`);

    const api = getServiceTitanAPI();

    for (const referral of contactedReferrals) {
      if (!referral.refereeCustomerId) continue;

      try {
        // Get jobs completed after the referral was submitted
        const jobs = await api.getCustomerJobs(
          referral.refereeCustomerId,
          referral.submittedAt
        );

        // Find first completed job ≥$200
        const qualifyingJob = jobs.find(job => 
          job.status.toLowerCase() === 'completed' &&
          job.total >= MINIMUM_JOB_AMOUNT &&
          job.completedOn
        );

        if (qualifyingJob) {
          console.log(`[Referral Processor] ✅ Found qualifying job ${qualifyingJob.jobNumber} ($${(qualifyingJob.total / 100).toFixed(2)}) for referral ${referral.id}`);
          
          await db
            .update(referrals)
            .set({
              status: 'job_completed',
              firstJobId: qualifyingJob.jobNumber,
              firstJobDate: qualifyingJob.completedOn ? new Date(qualifyingJob.completedOn) : new Date(),
              firstJobAmount: qualifyingJob.total,
              updatedAt: new Date()
            })
            .where(eq(referrals.id, referral.id));
        }
      } catch (error) {
        console.error(`[Referral Processor] Error checking jobs for referral ${referral.id}:`, error);
      }
    }
  }

  /**
   * Step 3: Issue credits for job_completed referrals
   * Updates status from 'job_completed' to 'credited' and creates ServiceTitan credit
   */
  private async issueCreditsForCompletedJobs(): Promise<void> {
    const completedReferrals = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.status, 'job_completed'),
          eq(referrals.creditedAt, null as any)
        )
      );

    console.log(`[Referral Processor] Issuing credits for ${completedReferrals.length} completed referrals`);

    const api = getServiceTitanAPI();

    for (const referral of completedReferrals) {
      if (!referral.referrerCustomerId) {
        console.error(`[Referral Processor] ❌ Cannot issue credit for referral ${referral.id}: no referrer customer ID`);
        continue;
      }

      try {
        // Create $25 credit in ServiceTitan
        const credit = await api.createCustomerCredit(
          referral.referrerCustomerId,
          CREDIT_AMOUNT,
          `Referral reward for ${referral.refereeName} - Job #${referral.firstJobId}`
        );

        console.log(`[Referral Processor] ✅ Issued $25 credit to customer ${referral.referrerCustomerId} for referring ${referral.refereeName}`);

        // Update referral status
        await db
          .update(referrals)
          .set({
            status: 'credited',
            creditedAt: new Date(),
            creditedBy: 'auto',
            creditNotes: `ServiceTitan credit adjustment #${credit.id}`,
            updatedAt: new Date()
          })
          .where(eq(referrals.id, referral.id));
      } catch (error) {
        console.error(`[Referral Processor] Error issuing credit for referral ${referral.id}:`, error);
        
        // Update with error note but don't mark as credited
        await db
          .update(referrals)
          .set({
            creditNotes: `Failed to issue credit: ${error instanceof Error ? error.message : 'Unknown error'}`,
            updatedAt: new Date()
          })
          .where(eq(referrals.id, referral.id));
      }
    }
  }
}

// Singleton instance
let referralProcessor: ReferralProcessor | null = null;

export function getReferralProcessor(): ReferralProcessor {
  if (!referralProcessor) {
    referralProcessor = new ReferralProcessor();
  }
  return referralProcessor;
}
