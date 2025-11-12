/**
 * useSchedulerSession Hook
 * 
 * Manages scheduler session state with shared session module.
 * Handles token storage, hydration on load, and expiration warnings.
 * 
 * UPDATED: Now uses shared session module for cross-context compatibility
 */

import { useEffect, useCallback, useRef } from 'react';
import { getSession, setSession as saveSession, clearToken } from '@/modules/session';
import type { SessionData } from '@/modules/session';

interface SchedulerSession {
  token: string | null;
  verificationMethod: 'phone' | 'email' | null;
  verifiedAt: number | null;
  customerId: number | null;
  expiresAt: number | null;
}

interface UseSchedulerSessionProps {
  session: SchedulerSession;
  onSessionUpdate: (session: Partial<SchedulerSession>) => void;
}

const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Warn 5 minutes before expiry

export function useSchedulerSession({ session, onSessionUpdate }: UseSchedulerSessionProps) {
  // Track if we've already hydrated to prevent infinite loops
  const hasHydratedRef = useRef(false);
  
  /**
   * Hydrate session from shared session module on mount ONLY
   */
  useEffect(() => {
    // Only hydrate once on initial mount
    if (hasHydratedRef.current) return;
    
    const stored = getSession('scheduler');
    if (!stored) {
      hasHydratedRef.current = true;
      return;
    }
    
    // Session is valid (getSession checks expiration)
    console.log('[Scheduler Session] Restored valid session from shared module');
    onSessionUpdate({
      token: stored.token,
      verificationMethod: stored.verificationMethod,
      verifiedAt: stored.verifiedAt,
      customerId: stored.customerId,
      expiresAt: stored.expiresAt,
    });
    
    hasHydratedRef.current = true;
  }, []); // Empty deps - only run on mount
  
  /**
   * Persist session to shared session module whenever it changes
   */
  useEffect(() => {
    if (session.token && session.verificationMethod && session.verifiedAt && session.expiresAt) {
      const sessionData: SessionData = {
        token: session.token,
        verificationMethod: session.verificationMethod,
        verifiedAt: session.verifiedAt,
        customerId: session.customerId,
        expiresAt: session.expiresAt,
      };
      saveSession('scheduler', sessionData);
    } else if (!session.token) {
      clearToken('scheduler');
    }
  }, [session]);
  
  /**
   * Set session after successful verification
   */
  const setSession = useCallback((sessionData: {
    token: string;
    verificationMethod: 'phone' | 'email';
    verifiedAt: number;
    customerId: number | null;
    expiresAt: number;
  }) => {
    onSessionUpdate({
      token: sessionData.token,
      verificationMethod: sessionData.verificationMethod,
      verifiedAt: sessionData.verifiedAt,
      customerId: sessionData.customerId,
      expiresAt: sessionData.expiresAt,
    });
  }, [onSessionUpdate]);
  
  /**
   * Clear session (logout or after booking)
   */
  const clearSession = useCallback(() => {
    onSessionUpdate({
      token: null,
      verificationMethod: null,
      verifiedAt: null,
      customerId: null,
      expiresAt: null,
    });
    clearToken('scheduler'); // Use shared session module
  }, [onSessionUpdate]);
  
  /**
   * Check if session is valid
   */
  const isSessionValid = useCallback((): boolean => {
    if (!session.token || !session.expiresAt) return false;
    return session.expiresAt > Date.now();
  }, [session.token, session.expiresAt]);
  
  /**
   * Check if session is expiring soon (for warning display)
   */
  const isSessionExpiringSoon = useCallback((): boolean => {
    if (!session.expiresAt) return false;
    const timeRemaining = session.expiresAt - Date.now();
    return timeRemaining > 0 && timeRemaining < WARNING_THRESHOLD_MS;
  }, [session.expiresAt]);
  
  /**
   * Get time remaining in milliseconds
   */
  const getTimeRemaining = useCallback((): number => {
    if (!session.expiresAt) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  }, [session.expiresAt]);
  
  return {
    session,
    setSession,
    clearSession,
    isSessionValid,
    isSessionExpiringSoon,
    getTimeRemaining,
  };
}
