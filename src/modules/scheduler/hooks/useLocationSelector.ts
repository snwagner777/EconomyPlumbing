/**
 * useLocationSelector Hook
 * 
 * Manages service location selection for multi-location customers.
 * Enforces "no billing address fallback" rule - only service locations used for scheduling.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { CustomerLocation } from '@shared/types/scheduler';

// ============================================================================
// Types
// ============================================================================

export interface UseLocationSelectorOptions {
  /** Available customer locations */
  locations: CustomerLocation[];
  
  /** Pre-selected location ID (e.g., from customerInfo.locationId) */
  initialLocationId?: number | null;
  
  /** Callback for location change events (for telemetry/logging) */
  onLocationChange?: (location: CustomerLocation | null) => void;
  
  /** Auto-select preferred location on mount */
  autoSelect?: boolean;
}

export interface UseLocationSelectorReturn {
  /** Currently selected location ID */
  selectedLocationId: number | null;
  
  /** Currently selected location object */
  selectedLocation: CustomerLocation | null;
  
  /** Service ZIP code (ONLY from service location, NEVER billing address) */
  serviceZip: string;
  
  /** Whether multiple locations are available */
  hasMultipleLocations: boolean;
  
  /** Change selected location */
  setLocationId: (locationId: number) => void;
  
  /** Clear selection */
  clearSelection: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages service location selection with smart defaults.
 * 
 * CRITICAL RULE: NEVER falls back to billing address.
 * Returns empty string for serviceZip if no valid location selected.
 * 
 * @example
 * ```tsx
 * const { serviceZip, selectedLocation, setLocationId } = useLocationSelector({
 *   locations: customerLocations,
 *   autoSelect: true
 * });
 * 
 * // CRITICAL: serviceZip will be empty string if no location available
 * // Scheduler API will reject empty ZIP - this is by design
 * <AvailabilityStep customerZip={serviceZip} />
 * ```
 */
export function useLocationSelector({
  locations,
  initialLocationId = null,
  onLocationChange,
  autoSelect = true,
}: UseLocationSelectorOptions): UseLocationSelectorReturn {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(initialLocationId);

  // Auto-select preferred location on mount
  useEffect(() => {
    if (!autoSelect || locations.length === 0) return;
    
    // If already have selection, don't override
    if (selectedLocationId !== null) return;
    
    // CRITICAL: ALWAYS prefer non-Hill Country (78654) locations for scheduling
    // Hill Country is billing address, NOT a service location
    const preferredLocation = locations.find(loc => loc.address?.zip !== '78654') || locations[0];
    
    if (preferredLocation) {
      console.log('[useLocationSelector] Auto-selecting location:', {
        totalLocations: locations.length,
        selectedLocationId: preferredLocation.id,
        selectedZip: preferredLocation.address?.zip,
        allLocations: locations.map(l => ({ 
          id: l.id, 
          zip: l.address?.zip, 
          city: l.address?.city,
          isHillCountry: l.address?.zip === '78654'
        })),
        note: 'Avoided Hill Country billing address'
      });
      
      setSelectedLocationId(preferredLocation.id);
      onLocationChange?.(preferredLocation);
    }
  }, [autoSelect, locations, selectedLocationId, onLocationChange]);

  // Derived state
  const selectedLocation = useMemo(
    () => selectedLocationId ? locations.find(loc => loc.id === selectedLocationId) || null : null,
    [selectedLocationId, locations]
  );

  const serviceZip = useMemo(() => {
    const zip = selectedLocation?.address?.zip || '';
    
    console.log('[useLocationSelector] Service ZIP calculation:', {
      hasSelectedLocation: !!selectedLocation,
      selectedLocationZip: selectedLocation?.address?.zip,
      finalServiceZip: zip,
      locationsAvailable: locations.length,
      note: 'NO FALLBACK to billing address - service location ZIP ONLY'
    });
    
    return zip;
  }, [selectedLocation, locations.length]);

  const hasMultipleLocations = useMemo(
    () => locations.length > 1,
    [locations.length]
  );

  // Actions
  const setLocationId = useCallback((locationId: number) => {
    const location = locations.find(loc => loc.id === locationId) || null;
    setSelectedLocationId(locationId);
    onLocationChange?.(location);
    
    console.log('[useLocationSelector] Location changed:', {
      locationId,
      zip: location?.address?.zip,
      city: location?.address?.city
    });
  }, [locations, onLocationChange]);

  const clearSelection = useCallback(() => {
    setSelectedLocationId(null);
    onLocationChange?.(null);
  }, [onLocationChange]);

  return {
    selectedLocationId,
    selectedLocation,
    serviceZip,
    hasMultipleLocations,
    setLocationId,
    clearSelection,
  };
}
