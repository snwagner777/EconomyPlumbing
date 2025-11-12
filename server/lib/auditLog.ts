/**
 * Audit Logging for Customer Portal
 * 
 * Logs all customer-initiated data mutations for compliance and debugging
 * Captures: customerId, action, entity type/ID, payload summary, ServiceTitan traceId
 */

import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

export interface AuditLogEntry {
  customerId: number;
  action: 'create' | 'update' | 'delete';
  entityType: 'customer' | 'location' | 'contact' | 'contact_method';
  entityId?: string | number;
  payloadSummary?: string; // Brief description of what changed
  serviceTitanTraceId?: string; // From ServiceTitan RFC7807 error or response
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a customer portal action to database
 */
export async function logCustomerAction(entry: AuditLogEntry): Promise<void> {
  try {
    console.log('[Audit Log]', JSON.stringify(entry, null, 2));
    
    // TODO: Create audit_logs table in schema and insert here
    // For now, just log to console with structured format
    
    // Example future implementation:
    // await db.insert(auditLogs).values({
    //   customerId: entry.customerId,
    //   action: entry.action,
    //   entityType: entry.entityType,
    //   entityId: entry.entityId?.toString(),
    //   payloadSummary: entry.payloadSummary,
    //   serviceTitanTraceId: entry.serviceTitanTraceId,
    //   ipAddress: entry.ipAddress,
    //   userAgent: entry.userAgent,
    //   timestamp: new Date(),
    // });
    
  } catch (error) {
    // Never throw - audit logging should not break the application
    console.error('[Audit Log] Failed to log action:', error);
  }
}

/**
 * Extract ServiceTitan traceId from error response
 */
export function extractTraceId(error: any): string | undefined {
  return error?.response?.data?.traceId || error?.traceId;
}
