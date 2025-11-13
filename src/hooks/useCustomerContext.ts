/**
 * Shared Customer Context System
 * 
 * Normalizes customer identity/contact/address across:
 * - Portal session API
 * - Phone lookup modal
 * - Scheduler verification
 * 
 * Provides single source of truth for customer pre-fill data.
 */

import { useState, useEffect, useCallback } from 'react';

// Current schema version - increment when shape changes
const SCHEMA_VERSION = 1;

// Shared sessionStorage key
const STORAGE_KEY = 'customer_context';

// TTL: 30 minutes (in milliseconds)
const TTL_MS = 30 * 60 * 1000;

/**
 * Normalized customer context shape
 * Minimal fields guaranteed by all sources
 */
export interface CustomerContext {
  schemaVersion: number;
  timestamp: number;
  source: 'portal' | 'lookup' | 'scheduler' | 'unknown';
  
  // Identity
  customerId: number;
  customerName: string;
  customerType?: 'Residential' | 'Commercial';
  
  // Contact (at least one required)
  phone?: string;
  email?: string;
  
  // Address (optional - may not be available from all sources)
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  
  // ServiceTitan-specific (optional)
  serviceTitanId?: number;
  locationId?: number;
}

/**
 * Hook for managing shared customer context
 * 
 * Usage:
 * ```tsx
 * const { context, setContext, clearContext, isStale } = useCustomerContext();
 * 
 * // Write context after verification
 * setContext({
 *   customerId: 12345,
 *   customerName: 'John Doe',
 *   phone: '5127555037',
 *   source: 'portal'
 * });
 * 
 * // Read context to pre-fill form
 * if (context && !isStale) {
 *   form.setValue('name', context.customerName);
 *   form.setValue('phone', context.phone);
 * }
 * ```
 */
export function useCustomerContext() {
  const [context, setContextState] = useState<CustomerContext | null>(null);
  
  // Load context from sessionStorage on mount
  useEffect(() => {
    loadContext();
  }, []);
  
  /**
   * Load and validate context from sessionStorage
   */
  const loadContext = useCallback(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setContextState(null);
        return;
      }
      
      const parsed = JSON.parse(stored) as CustomerContext;
      
      // Validate schema version
      if (parsed.schemaVersion !== SCHEMA_VERSION) {
        console.warn('[CustomerContext] Schema version mismatch - clearing stale context');
        sessionStorage.removeItem(STORAGE_KEY);
        setContextState(null);
        return;
      }
      
      // Validate timestamp (TTL check)
      if (Date.now() - parsed.timestamp > TTL_MS) {
        console.warn('[CustomerContext] Context expired - clearing stale context');
        sessionStorage.removeItem(STORAGE_KEY);
        setContextState(null);
        return;
      }
      
      // Validate required fields
      if (!parsed.customerId || !parsed.customerName) {
        console.warn('[CustomerContext] Invalid context - missing required fields');
        sessionStorage.removeItem(STORAGE_KEY);
        setContextState(null);
        return;
      }
      
      console.log('[CustomerContext] Loaded valid context:', {
        customerId: parsed.customerId,
        source: parsed.source,
        age: Math.round((Date.now() - parsed.timestamp) / 1000) + 's',
      });
      
      setContextState(parsed);
    } catch (error) {
      console.error('[CustomerContext] Failed to load context:', error);
      sessionStorage.removeItem(STORAGE_KEY);
      setContextState(null);
    }
  }, []);
  
  /**
   * Save context to sessionStorage
   */
  const setContext = useCallback((data: Omit<CustomerContext, 'schemaVersion' | 'timestamp'>) => {
    try {
      const contextToSave: CustomerContext = {
        ...data,
        schemaVersion: SCHEMA_VERSION,
        timestamp: Date.now(),
      };
      
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contextToSave));
      setContextState(contextToSave);
      
      console.log('[CustomerContext] Saved context:', {
        customerId: contextToSave.customerId,
        source: contextToSave.source,
      });
    } catch (error) {
      console.error('[CustomerContext] Failed to save context:', error);
    }
  }, []);
  
  /**
   * Clear context from sessionStorage
   */
  const clearContext = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setContextState(null);
    console.log('[CustomerContext] Cleared context');
  }, []);
  
  /**
   * Check if context is stale (near expiration)
   * Useful for triggering refresh before it expires
   */
  const isStale = useCallback(() => {
    if (!context) return true;
    const age = Date.now() - context.timestamp;
    // Consider stale if older than 25 minutes (5 min buffer before TTL)
    return age > (TTL_MS - 5 * 60 * 1000);
  }, [context]);
  
  /**
   * Refresh context by reloading from sessionStorage
   * Useful when another component updates the context
   */
  const refreshContext = useCallback(() => {
    loadContext();
  }, [loadContext]);
  
  return {
    context,
    setContext,
    clearContext,
    isStale,
    refreshContext,
  };
}
