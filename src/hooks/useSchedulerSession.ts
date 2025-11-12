/**
 * useSchedulerSession Hook
 * 
 * Manages scheduler session state with sessionStorage persistence.
 * Handles token storage, hydration on load, and expiration warnings.
 */

import { useEffect, useCallback, useRef } from 'react';

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

const SESSION_STORAGE_KEY = 'scheduler_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Warn 5 minutes before expiry

export function useSchedulerSession({ session, onSessionUpdate }: UseSchedulerSessionProps) {
  // Track if we've already hydrated to prevent infinite loops
  const hasHydratedRef = useRef(false);
  
  /**
   * Hydrate session from localStorage on mount ONLY
   * Uses localStorage instead of sessionStorage to persist across tab closes
   */
  useEffect(() => {
    // Only hydrate once on initial mount
    if (hasHydratedRef.current) return;
    
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) {
      hasHydratedRef.current = true;
      return;
    }
    
    try {
      const parsed: SchedulerSession = JSON.parse(stored);
      
      // CRITICAL: Invalidate old sessions with customerId=null (from before phone normalization fix)
      // These sessions are broken and cause "No customer associated with session" errors
      if (parsed.customerId === null) {
        console.warn('[Scheduler Session] Invalidating old session with customerId=null - please re-verify');
        localStorage.removeItem(SESSION_STORAGE_KEY);
        hasHydratedRef.current = true;
        return;
      }
      
      // Check if session is still valid (24-hour TTL)
      if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
        console.log('[Scheduler Session] Restored valid session from localStorage');
        onSessionUpdate(parsed);
      } else {
        // Session expired - clear it
        console.log('[Scheduler Session] Session expired, clearing');
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.error('[Scheduler Session] Error hydrating session:', error);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
    
    hasHydratedRef.current = true;
  }, []); // Empty deps - only run on mount
  
  /**
   * Persist session to localStorage whenever it changes
   * Uses localStorage for cross-tab persistence (24-hour TTL)
   */
  useEffect(() => {
    if (session.token) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
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
    localStorage.removeItem(SESSION_STORAGE_KEY);
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
