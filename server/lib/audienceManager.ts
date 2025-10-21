import { db } from '../db';
import { 
  customerSegments, 
  segmentMembership, 
  audienceMovementLogs,
  serviceTitanCustomers,
  serviceTitanJobs,
  serviceTitanJobForms,
  type CustomerSegment,
  type SegmentMembership,
} from '@shared/schema';
import { eq, and, isNull, sql, inArray, or } from 'drizzle-orm';

interface EntryContext {
  segmentId: string;
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  reason: string;
  triggeringEvent?: string;
  eventData?: Record<string, any>;
  campaignId?: string;
}

interface ExitContext {
  segmentId: string;
  customerId: number;
  customerName: string;
  customerEmail: string | null;
  reason: string;
  triggeringEvent?: string;
  eventData?: Record<string, any>;
}

/**
 * Add a customer to a segment with audit logging
 * Wrapped in transaction to ensure atomicity: membership + log + count update all succeed or all fail
 */
export async function enterCustomerIntoSegment(context: EntryContext): Promise<void> {
  const { segmentId, customerId, customerName, customerEmail, reason, triggeringEvent, eventData, campaignId } = context;

  // Wrap all operations in a transaction
  await db.transaction(async (tx) => {
    // Check if already in segment
    const existingMembership = await tx
      .select()
      .from(segmentMembership)
      .where(
        and(
          eq(segmentMembership.segmentId, segmentId),
          eq(segmentMembership.serviceTitanCustomerId, customerId),
          isNull(segmentMembership.exitedAt)
        )
      )
      .limit(1);

    if (existingMembership.length > 0) {
      console.log(`[Audience Manager] Customer ${customerId} already in segment ${segmentId}`);
      return;
    }

    // Add to segment
    await tx.insert(segmentMembership).values({
      segmentId,
      serviceTitanCustomerId: customerId,
      customerName,
      customerEmail: customerEmail || '',
      entryReason: reason,
    });

    // Log the entry
    await tx.insert(audienceMovementLogs).values({
      segmentId,
      serviceTitanCustomerId: customerId,
      customerName,
      customerEmail,
      action: 'entered',
      reason,
      triggeringEvent,
      eventData,
      campaignId,
    });

    // Recalculate member count from actual membership rows (atomic)
    const count = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(segmentMembership)
      .where(and(
        eq(segmentMembership.segmentId, segmentId),
        isNull(segmentMembership.exitedAt)
      ));

    await tx
      .update(customerSegments)
      .set({ 
        memberCount: count[0]?.count || 0,
        updatedAt: new Date(),
      })
      .where(eq(customerSegments.id, segmentId));

    console.log(`[Audience Manager] Customer ${customerId} (${customerName}) entered segment ${segmentId}: ${reason}`);
  });
}

/**
 * Remove a customer from a segment with audit logging
 * Wrapped in transaction to ensure atomicity: membership update + log + count update all succeed or all fail
 */
export async function exitCustomerFromSegment(context: ExitContext): Promise<void> {
  const { segmentId, customerId, customerName, customerEmail, reason, triggeringEvent, eventData } = context;

  // Wrap all operations in a transaction
  await db.transaction(async (tx) => {
    // Find active membership
    const activeMembership = await tx
      .select()
      .from(segmentMembership)
      .where(
        and(
          eq(segmentMembership.segmentId, segmentId),
          eq(segmentMembership.serviceTitanCustomerId, customerId),
          isNull(segmentMembership.exitedAt)
        )
      )
      .limit(1);

    if (activeMembership.length === 0) {
      console.log(`[Audience Manager] Customer ${customerId} not in segment ${segmentId}, skipping exit`);
      return;
    }

    // Mark as exited
    await tx
      .update(segmentMembership)
      .set({
        exitedAt: new Date(),
        exitReason: reason,
      })
      .where(eq(segmentMembership.id, activeMembership[0].id));

    // Log the exit
    await tx.insert(audienceMovementLogs).values({
      segmentId,
      serviceTitanCustomerId: customerId,
      customerName,
      customerEmail,
      action: 'exited',
      reason,
      triggeringEvent,
      eventData,
    });

    // Recalculate member count from actual membership rows (atomic)
    const count = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(segmentMembership)
      .where(and(
        eq(segmentMembership.segmentId, segmentId),
        isNull(segmentMembership.exitedAt)
      ));

    await tx
      .update(customerSegments)
      .set({ 
        memberCount: count[0]?.count || 0,
        updatedAt: new Date(),
      })
      .where(eq(customerSegments.id, segmentId));

    console.log(`[Audience Manager] Customer ${customerId} (${customerName}) exited segment ${segmentId}: ${reason}`);
  });
}

/**
 * Process auto-entry for a segment - add customers who meet criteria
 */
export async function processSegmentAutoEntry(segmentId: string): Promise<{ entered: number; skipped: number }> {
  const segment = await db
    .select()
    .from(customerSegments)
    .where(eq(customerSegments.id, segmentId))
    .limit(1);

  if (segment.length === 0) {
    throw new Error(`Segment ${segmentId} not found`);
  }

  if (!segment[0].autoEntryEnabled) {
    console.log(`[Audience Manager] Auto-entry disabled for segment ${segmentId}`);
    return { entered: 0, skipped: 0 };
  }

  // Find all customers matching criteria
  const criteria = segment[0].targetCriteria as any;
  const targetCustomers = await findCustomersByCriteria(criteria);

  // Get existing members
  const existingMemberIds = (
    await db
      .select({ customerId: segmentMembership.serviceTitanCustomerId })
      .from(segmentMembership)
      .where(
        and(
          eq(segmentMembership.segmentId, segmentId),
          isNull(segmentMembership.exitedAt)
        )
      )
  ).map(m => m.customerId);

  // Add new customers
  const newCustomers = targetCustomers.filter(c => !existingMemberIds.includes(c.id));

  for (const customer of newCustomers) {
    await enterCustomerIntoSegment({
      segmentId,
      customerId: customer.id,
      customerName: customer.name,
      customerEmail: customer.email,
      reason: `Auto-entry: Met segment criteria (${segment[0].name})`,
      triggeringEvent: 'auto_entry',
      eventData: { segmentCriteria: criteria },
    });
  }

  // Update last refreshed timestamp
  await db
    .update(customerSegments)
    .set({ lastRefreshedAt: new Date() })
    .where(eq(customerSegments.id, segmentId));

  return { entered: newCustomers.length, skipped: existingMemberIds.length };
}

/**
 * Process auto-exit for a segment - remove customers who no longer meet criteria
 */
export async function processSegmentAutoExit(segmentId: string): Promise<{ exited: number; retained: number }> {
  const segment = await db
    .select()
    .from(customerSegments)
    .where(eq(customerSegments.id, segmentId))
    .limit(1);

  if (segment.length === 0) {
    throw new Error(`Segment ${segmentId} not found`);
  }

  if (!segment[0].autoExitEnabled) {
    console.log(`[Audience Manager] Auto-exit disabled for segment ${segmentId}`);
    return { exited: 0, retained: 0 };
  }

  // Find all customers who still qualify
  const criteria = segment[0].targetCriteria as any;
  const qualifyingCustomers = await findCustomersByCriteria(criteria);
  const qualifyingIds = qualifyingCustomers.map(c => c.id);

  // Get all active members
  const activeMembers = await db
    .select()
    .from(segmentMembership)
    .where(
      and(
        eq(segmentMembership.segmentId, segmentId),
        isNull(segmentMembership.exitedAt)
      )
    );

  // Exit customers who no longer qualify
  const customersToExit = activeMembers.filter(m => !qualifyingIds.includes(m.serviceTitanCustomerId));

  for (const member of customersToExit) {
    const customer = await db
      .select()
      .from(serviceTitanCustomers)
      .where(eq(serviceTitanCustomers.id, member.serviceTitanCustomerId))
      .limit(1);

    if (customer.length > 0) {
      await exitCustomerFromSegment({
        segmentId,
        customerId: customer[0].id,
        customerName: customer[0].name,
        customerEmail: customer[0].email,
        reason: `Auto-exit: No longer meets segment criteria (${segment[0].name})`,
        triggeringEvent: 'auto_exit',
        eventData: { segmentCriteria: criteria },
      });
    }
  }

  return { exited: customersToExit.length, retained: activeMembers.length - customersToExit.length };
}

/**
 * Find customers matching segment criteria
 * Supports various criteria types (lastServiceDate, lifetimeValue, equipment conditions, etc.)
 */
async function findCustomersByCriteria(criteria: any): Promise<Array<{ id: number; name: string; email: string | null }>> {
  // Win-back: Last service before a certain date
  if (criteria.lastServiceDateBefore) {
    const beforeDate = new Date(criteria.lastServiceDateBefore);
    const results = await db
      .select({
        id: serviceTitanCustomers.id,
        name: serviceTitanCustomers.name,
        email: serviceTitanCustomers.email,
      })
      .from(serviceTitanCustomers)
      .where(
        and(
          eq(serviceTitanCustomers.active, true),
          sql`${serviceTitanCustomers.lastServiceDate} < ${beforeDate}`
        )
      );
    return results;
  }

  // High-value VIP: Lifetime value greater than threshold
  if (criteria.lifetimeValueGreaterThan) {
    const minValue = criteria.lifetimeValueGreaterThan;
    const results = await db
      .select({
        id: serviceTitanCustomers.id,
        name: serviceTitanCustomers.name,
        email: serviceTitanCustomers.email,
      })
      .from(serviceTitanCustomers)
      .where(
        and(
          eq(serviceTitanCustomers.active, true),
          sql`${serviceTitanCustomers.lifetimeValue} > ${minValue}`
        )
      );
    return results;
  }

  // Technician concerns: Recent jobs with poor equipment conditions
  if (criteria.recentJobsWithCondition) {
    const { daysAgo, equipmentConditions } = criteria.recentJobsWithCondition;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const customerIds = (
      await db
        .select({ customerId: serviceTitanJobForms.customerId })
        .from(serviceTitanJobForms)
        .where(
          and(
            inArray(serviceTitanJobForms.equipmentCondition, equipmentConditions),
            sql`${serviceTitanJobForms.submittedOn} > ${cutoffDate}`
          )
        )
    ).map(r => r.customerId);

    if (customerIds.length === 0) {
      return [];
    }

    const results = await db
      .select({
        id: serviceTitanCustomers.id,
        name: serviceTitanCustomers.name,
        email: serviceTitanCustomers.email,
      })
      .from(serviceTitanCustomers)
      .where(inArray(serviceTitanCustomers.id, customerIds));

    return results;
  }

  // Anniversary: Customers with service in a specific timeframe
  if (criteria.anniversaryService) {
    const { monthsAgo, serviceCategory } = criteria.anniversaryService;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - (monthsAgo + 1));
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() - (monthsAgo - 1));

    const customerIds = (
      await db
        .select({ customerId: serviceTitanJobs.customerId })
        .from(serviceTitanJobs)
        .where(
          and(
            sql`${serviceTitanJobs.serviceCategory} LIKE ${`%${serviceCategory}%`}`,
            sql`${serviceTitanJobs.completedOn} BETWEEN ${startDate} AND ${endDate}`
          )
        )
    ).map(r => r.customerId);

    if (customerIds.length === 0) {
      return [];
    }

    const results = await db
      .select({
        id: serviceTitanCustomers.id,
        name: serviceTitanCustomers.name,
        email: serviceTitanCustomers.email,
      })
      .from(serviceTitanCustomers)
      .where(inArray(serviceTitanCustomers.id, customerIds));

    return results;
  }

  // Default: no customers
  return [];
}

/**
 * Refresh all active segments (auto-entry and auto-exit)
 */
export async function refreshAllSegments(): Promise<{
  totalSegments: number;
  totalEntered: number;
  totalExited: number;
}> {
  console.log('[Audience Manager] Starting full segment refresh...');

  const allSegments = await db
    .select()
    .from(customerSegments)
    .where(eq(customerSegments.status, 'active'));

  let totalEntered = 0;
  let totalExited = 0;

  for (const segment of allSegments) {
    try {
      const entryResults = await processSegmentAutoEntry(segment.id);
      const exitResults = await processSegmentAutoExit(segment.id);

      totalEntered += entryResults.entered;
      totalExited += exitResults.exited;

      console.log(`[Audience Manager] Segment ${segment.name}: +${entryResults.entered} entered, -${exitResults.exited} exited`);
    } catch (error) {
      console.error(`[Audience Manager] Error processing segment ${segment.id}:`, error);
    }
  }

  console.log(`[Audience Manager] Refresh complete: ${totalEntered} entered, ${totalExited} exited across ${allSegments.length} segments`);

  return {
    totalSegments: allSegments.length,
    totalEntered,
    totalExited,
  };
}

/**
 * Handle job completion event - trigger auto-exit checks for customer
 */
export async function handleJobCompletion(jobId: number, customerId: number): Promise<void> {
  console.log(`[Audience Manager] Job ${jobId} completed for customer ${customerId}, triggering auto-exit checks...`);

  const customer = await db
    .select()
    .from(serviceTitanCustomers)
    .where(eq(serviceTitanCustomers.id, customerId))
    .limit(1);

  if (customer.length === 0) {
    return;
  }

  // Find all segments this customer is in
  const activeSegments = await db
    .select({ segmentId: segmentMembership.segmentId })
    .from(segmentMembership)
    .where(
      and(
        eq(segmentMembership.serviceTitanCustomerId, customerId),
        isNull(segmentMembership.exitedAt)
      )
    );

  // Process auto-exit for each segment
  for (const { segmentId } of activeSegments) {
    await processSegmentAutoExit(segmentId);
  }
}
