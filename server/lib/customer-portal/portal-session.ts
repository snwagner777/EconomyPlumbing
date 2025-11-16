/**
 * Portal Session Utilities
 * Centralized session validation for customer portal API routes
 */

import { getSession } from '@/lib/session';

export interface PortalSessionData {
  customerId: number;
  availableCustomerIds: number[];
}

/**
 * Get and validate portal session
 * Throws 401 if not authenticated
 */
export async function getPortalSession(): Promise<PortalSessionData> {
  const session = await getSession();
  
  const customerId = session.customerPortalAuth?.customerId;
  const availableCustomerIds = session.customerPortalAuth?.availableCustomerIds;

  if (!customerId || !availableCustomerIds || availableCustomerIds.length === 0) {
    throw new Error('UNAUTHORIZED');
  }

  return {
    customerId,
    availableCustomerIds,
  };
}

/**
 * Validate customer ownership
 * Throws 403 if customer not in available accounts
 */
export function assertCustomerOwnership(
  requestedCustomerId: number,
  availableCustomerIds: number[]
): void {
  if (!availableCustomerIds.includes(requestedCustomerId)) {
    throw new Error('FORBIDDEN');
  }
}

/**
 * Convenience function to get session and validate ownership in one call
 */
export async function getPortalSessionWithOwnership(
  requestedCustomerId: number
): Promise<PortalSessionData> {
  const sessionData = await getPortalSession();
  assertCustomerOwnership(requestedCustomerId, sessionData.availableCustomerIds);
  return sessionData;
}
