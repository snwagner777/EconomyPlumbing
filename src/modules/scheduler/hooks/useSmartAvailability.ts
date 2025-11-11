/**
 * useSmartAvailability Hook
 * 
 * Shared data fetching hook for smart availability API.
 * Replaces duplicate useQuery calls in AvailabilityStep, SchedulerDialog, chatbot, etc.
 * 
 * ARCHITECTURE: This centralizes the API call that was previously owned by AvailabilityStep.tsx,
 * preventing duplicate calls when multiple scheduler components mount simultaneously.
 */

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { SmartAvailabilityRequest, SmartAvailabilityResponse } from '@shared/types/scheduler';
import { differenceInDays } from 'date-fns';

export interface UseSmartAvailabilityOptions {
  jobTypeId: number;
  customerZip: string;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  enabled?: boolean; // Allow disabling query (e.g., when ZIP not available yet)
}

export interface UseSmartAvailabilityReturn {
  slots: SmartAvailabilityResponse['slots'];
  optimization: SmartAvailabilityResponse['optimization'];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Fetch smart availability slots with fuel optimization.
 * 
 * @example
 * ```tsx
 * const { slots, optimization, isLoading } = useSmartAvailability({
 *   jobTypeId: 140551181,
 *   customerZip: '78759',
 *   startDate: '2025-01-15',
 *   endDate: '2025-02-15',
 * });
 * ```
 */
export function useSmartAvailability({
  jobTypeId,
  customerZip,
  startDate,
  endDate,
  enabled = true,
}: UseSmartAvailabilityOptions): UseSmartAvailabilityReturn {
  // Query key includes all request parameters for proper cache invalidation
  const queryKey = ['/api/scheduler/smart-availability', jobTypeId, customerZip, startDate, endDate];
  
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<SmartAvailabilityResponse>({
    queryKey,
    queryFn: async () => {
      // CRITICAL FIX: Calculate daysToLoad from startDate/endDate (API expects daysToLoad, not endDate)
      const daysToLoad = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
      
      const requestBody = {
        jobTypeId,
        customerZip,
        startDate,
        daysToLoad, // API expects daysToLoad, not endDate
      };
      
      const response = await apiRequest('POST', '/api/scheduler/smart-availability', requestBody);
      
      if (!response.ok) {
        throw new Error(`Availability API failed: ${response.statusText}`);
      }
      
      return await response.json();
    },
    enabled: enabled && Boolean(customerZip), // Only fetch if enabled and ZIP provided
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (ServiceTitan capacity API caches 5min)
    retry: 2, // Retry failed requests twice
  });

  return {
    slots: data?.slots || [],
    optimization: data?.optimization || {
      averageProximityScore: 0,
      totalSlots: 0,
      highEfficiencySlots: 0,
    },
    isLoading,
    isFetching,
    isError,
    error: error as Error | null,
    refetch,
  };
}
