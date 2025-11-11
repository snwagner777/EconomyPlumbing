/**
 * useVipGuard Hook
 * 
 * Manages VIP service validation and error states.
 * Prevents non-VIP customers from booking VIP-only services.
 */

import { useState, useCallback, useMemo } from 'react';
import type { JobType } from '@shared/types/scheduler';

// ============================================================================
// Types
// ============================================================================

export interface UseVipGuardOptions {
  /** Customer tags from ServiceTitan (e.g., ['VIP', 'Preferred']) */
  customerTags?: string[];
  
  /** Callback when VIP restriction is triggered */
  onVipRestriction?: (jobType: JobType) => void;
}

export interface UseVipGuardReturn {
  /** Whether customer has VIP tag */
  isVipCustomer: boolean;
  
  /** Current VIP error state */
  vipError: boolean;
  
  /** Check if customer can book a specific service */
  canBook: (jobType: JobType) => boolean;
  
  /** Validate and select job type (returns true if allowed, false if blocked) */
  guardedSelect: (jobType: JobType, onSuccess: (jobType: JobType) => void) => boolean;
  
  /** Clear VIP error state */
  clearError: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a job type is VIP-only based on name.
 * Case-insensitive check for "vip" keyword in service name.
 */
function isVipService(jobType: JobType): boolean {
  return jobType.name.toLowerCase().includes('vip');
}

/**
 * Check if customer has VIP tag.
 * Case-insensitive check for "vip" in customer tags.
 */
function hasVipTag(customerTags: string[] = []): boolean {
  return customerTags.some(tag => tag.toLowerCase() === 'vip');
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages VIP service access control for scheduler.
 * 
 * Prevents non-VIP customers from selecting VIP-only services.
 * Triggers error state that can be displayed in UI.
 * 
 * @example
 * ```tsx
 * const { guardedSelect, vipError } = useVipGuard({
 *   customerTags: customerInfo.customerTags
 * });
 * 
 * const handleSelectService = (jobType: JobType) => {
 *   const allowed = guardedSelect(jobType, (validJobType) => {
 *     // Only called if VIP check passes
 *     dispatch({ type: 'SELECT_JOB_TYPE', payload: validJobType });
 *   });
 *   
 *   if (!allowed) {
 *     // Show VIP upgrade modal
 *   }
 * };
 * 
 * {vipError && <VIPRequiredAlert />}
 * ```
 */
export function useVipGuard({
  customerTags = [],
  onVipRestriction,
}: UseVipGuardOptions = {}): UseVipGuardReturn {
  const [vipError, setVipError] = useState(false);

  // Derived state
  const isVipCustomer = useMemo(
    () => hasVipTag(customerTags),
    [customerTags]
  );

  // Check if customer can book a service
  const canBook = useCallback(
    (jobType: JobType): boolean => {
      const isVIP = isVipService(jobType);
      const hasVIP = hasVipTag(customerTags);
      
      // VIP service requires VIP tag
      if (isVIP && !hasVIP) {
        return false;
      }
      
      return true;
    },
    [customerTags]
  );

  // Validate and execute selection
  const guardedSelect = useCallback(
    (jobType: JobType, onSuccess: (jobType: JobType) => void): boolean => {
      const isVIP = isVipService(jobType);
      const hasVIP = hasVipTag(customerTags);
      
      if (isVIP && !hasVIP) {
        // VIP service selected but customer is not VIP
        setVipError(true);
        onVipRestriction?.(jobType);
        
        console.log('[useVipGuard] VIP restriction triggered:', {
          jobTypeName: jobType.name,
          jobTypeCode: jobType.code,
          customerTags,
          isVipCustomer: hasVIP,
          blocked: true
        });
        
        return false;
      }
      
      // Clear any existing error and proceed
      setVipError(false);
      onSuccess(jobType);
      
      console.log('[useVipGuard] Service selection allowed:', {
        jobTypeName: jobType.name,
        isVipService: isVIP,
        isVipCustomer: hasVIP,
        allowed: true
      });
      
      return true;
    },
    [customerTags, onVipRestriction]
  );

  // Clear error
  const clearError = useCallback(() => {
    setVipError(false);
  }, []);

  return {
    isVipCustomer,
    vipError,
    canBook,
    guardedSelect,
    clearError,
  };
}
