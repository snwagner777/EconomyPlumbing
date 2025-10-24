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
   * Check if current time is 9am or 5pm Central (±30 minutes window)
   */
  private isJobCheckTime(): boolean {
    const now = new Date();
    // Convert to Central Time (UTC-6 during standard, UTC-5 during daylight saving)
    const centralTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    const centralHour = centralTime.getHours();
    const centralMinutes = centralTime.getMinutes();
    
    // Check if it's within 30 minutes of 9am or 5pm Central
    // 9am window: 8:30-9:30 (hour 8 with minutes>=30, or hour 9 with minutes<=30)
    const is9am = (centralHour === 8 && centralMinutes >= 30) || (centralHour === 9 && centralMinutes <= 30);
    // 5pm window: 16:30-17:30 (hour 16 with minutes>=30, or hour 17 with minutes<=30)
    const is5pm = (centralHour === 16 && centralMinutes >= 30) || (centralHour === 17 && centralMinutes <= 30);
    
    return is9am || is5pm;
  }

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
      
      // Always run referee matching (fast database query)
      await this.matchRefereesToCustomers();
      
      // Only check jobs twice per day at 9am and 5pm Central (API call)
      if (this.isJobCheckTime()) {
        console.log('[Referral Processor] Running scheduled job check (9am/5pm Central)');
        await this.checkForCompletedJobs();
      } else {
        console.log('[Referral Processor] Skipping job check (only runs at 9am/5pm Central)');
      }
      
      // Always try to issue credits if jobs are completed
      await this.issueCreditsForCompletedJobs();
      
      console.log('[Referral Processor] Processing cycle complete');
    } catch (error) {
      console.error('[Referral Processor] Error during processing:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Helper: Update or create referral credit balance note on referrer's account
   * Tracks running credit balance as a pinned note at top of customer file
   */
  private async updateReferralCreditNote(
    customerId: number,
    creditAmount: number,
    refereeName: string,
    creditDate: Date
  ): Promise<void> {
    const api = getServiceTitanAPI();
    
    try {
      // Get existing notes to check if we already have a credit balance note
      const notes = await api.getCustomerNotes(customerId);
      const creditNotePrefix = '[REFERRAL CREDITS]';
      const existingCreditNote = notes.find(n => n.pinToTop && n.text.startsWith(creditNotePrefix));
      
      // Parse current balance from existing note (if any)
      let currentBalance = 0;
      if (existingCreditNote) {
        const balanceMatch = existingCreditNote.text.match(/Balance: \$(\d+\.?\d*)/);
        if (balanceMatch) {
          currentBalance = parseFloat(balanceMatch[1]);
        }
      }
      
      // Calculate new balance
      const newBalance = currentBalance + creditAmount;
      
      // Build note text with running balance and transaction history
      const dateStr = creditDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const noteText = `${creditNotePrefix}
================================
Current Balance: $${newBalance.toFixed(2)}
================================

RECENT ACTIVITY:
+ ${dateStr}: Earned $${creditAmount.toFixed(2)} for referring ${refereeName}

NOTE: Credits expire 180 days from issue date.
NOTE: Use code "REFERRAL" when booking service.
NOTE: Refer more friends to earn more credits!`;
      
      if (existingCreditNote) {
        // Update existing note
        await api.updateCustomerNote(customerId, existingCreditNote.id, noteText, true);
        console.log(`[Referral Processor] Updated credit balance note for customer ${customerId}: $${newBalance.toFixed(2)}`);
      } else {
        // Create new note
        await api.createCustomerNote(customerId, noteText, true);
        console.log(`[Referral Processor] Created credit balance note for customer ${customerId}: $${newBalance.toFixed(2)}`);
      }
    } catch (error) {
      console.error(`[Referral Processor] Error updating credit note for customer ${customerId}:`, error);
      // Don't throw - credit was already issued, note is just a courtesy
    }
  }

  /**
   * Helper: Create pinned note on referee's account noting they were referred
   */
  private async createRefereeNote(customerId: number, referrerName: string): Promise<void> {
    const api = getServiceTitanAPI();
    
    try {
      const noteText = `[CUSTOMER REFERRAL]
================================
This customer was referred by ${referrerName}.

Thank you for trusting us with your plumbing needs!`;
      
      await api.createCustomerNote(customerId, noteText, true);
      console.log(`[Referral Processor] Created referral note for referee customer ${customerId}`);
    } catch (error) {
      console.error(`[Referral Processor] Error creating referee note for customer ${customerId}:`, error);
      // Don't throw - this is a non-critical feature
    }
  }

  /**
   * Step 1: Match referees to ServiceTitan customers using DATABASE lookups (fast!)
   * Updates status from 'pending' to 'contacted' when referee becomes a customer
   * 
   * IMPORTANT: We already checked if they were an existing customer at submission time.
   * If they show up in contacts_xlsx now but didn't at submission, they're a NEW customer!
   */
  private async matchRefereesToCustomers(): Promise<void> {
    const { contactsXlsx } = await import("../../shared/schema");
    const { sql } = await import("drizzle-orm");
    
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

    for (const referral of pendingReferrals) {
      // Skip if already marked as ineligible
      if (referral.creditNotes?.includes('ineligible') || referral.creditNotes?.includes('already a customer')) {
        console.log(`[Referral Processor] Skipping referral ${referral.id} - marked as ineligible`);
        continue;
      }

      try {
        // Search for referee in database by phone first (instant vs hours for API)
        let refereeContact = await db
          .select({ customerId: contactsXlsx.customerId })
          .from(contactsXlsx)
          .where(sql`${contactsXlsx.normalizedValue} LIKE ${`%${referral.refereePhone.replace(/\D/g, '')}%`}`)
          .limit(1);
        
        // If not found by phone and email provided, try email
        if (refereeContact.length === 0 && referral.refereeEmail) {
          refereeContact = await db
            .select({ customerId: contactsXlsx.customerId })
            .from(contactsXlsx)
            .where(sql`${contactsXlsx.normalizedValue} LIKE ${`%${referral.refereeEmail.toLowerCase()}%`}`)
            .limit(1);
        }

        if (refereeContact.length > 0 && refereeContact[0].customerId) {
          const finalCustomerId = refereeContact[0].customerId;
          // They became a customer! (We already verified they weren't one at submission)
          console.log(`[Referral Processor] SUCCESS: Referee "${referral.refereeName}" became a customer (ID: ${finalCustomerId}) [database match]`);
          
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
          console.log(`[Referral Processor] PENDING: Referee "${referral.refereeName}" not yet a customer`);
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
          console.log(`[Referral Processor] FOUND: Qualifying job ${qualifyingJob.jobNumber} ($${(qualifyingJob.total / 100).toFixed(2)}) for referral ${referral.id}`);
          
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
        console.error(`[Referral Processor] ERROR: Cannot issue credit for referral ${referral.id}: no referrer customer ID`);
        continue;
      }

      try {
        // Create $25 credit in ServiceTitan
        const credit = await api.createCustomerCredit(
          referral.referrerCustomerId,
          CREDIT_AMOUNT,
          `Referral reward for ${referral.refereeName} - Job #${referral.firstJobId}`
        );

        console.log(`[Referral Processor] SUCCESS: Issued $25 credit to customer ${referral.referrerCustomerId} for referring ${referral.refereeName}`);

        // Create/update pinned note on referrer's account with credit balance
        await this.updateReferralCreditNote(
          referral.referrerCustomerId,
          CREDIT_AMOUNT / 100, // Convert cents to dollars
          referral.refereeName,
          new Date()
        );

        // Create pinned note on referee's account
        if (referral.refereeCustomerId) {
          await this.createRefereeNote(
            referral.refereeCustomerId,
            referral.referrerName || 'existing customer'
          );
        }

        // Send email notification to business owner
        const creditDate = new Date();
        try {
          const { sendReferralCreditNotification } = await import('./resendClient');
          await sendReferralCreditNotification({
            referrerName: referral.referrerName || 'Unknown',
            refereeName: referral.refereeName,
            creditAmount: CREDIT_AMOUNT / 100, // Convert cents to dollars
            creditDate,
            jobNumber: referral.firstJobId || undefined
          });
        } catch (emailError) {
          console.error('[Referral Processor] Failed to send email notification:', emailError);
          // Don't throw - email is non-critical
        }

        // Update referral status with 180-day expiration
        const expirationDate = new Date(creditDate);
        expirationDate.setDate(expirationDate.getDate() + 180); // 180 days from now
        
        await db
          .update(referrals)
          .set({
            status: 'credited',
            creditedAt: creditDate,
            expiresAt: expirationDate,
            creditedBy: 'auto',
            creditNotes: `ServiceTitan credit adjustment #${credit.id}. Expires ${expirationDate.toLocaleDateString()}.`,
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
