/**
 * useSchedulerSession Hook
 * 
 * Manages scheduler session state with sessionStorage persistence.
 * Handles token storage, hydration on load, and expiration warnings.
 */

import { useEffect, useCallback } from 'react';

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
const WARNING_THRESHOLD_MS = 5 * 60 * 1000; // Warn 5 minutes before expiry

export function useSchedulerSession({ session, onSessionUpdate }: UseSchedulerSessionProps) {
  
  /**
   * Hydrate session from sessionStorage on mount
   */
  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return;
    
    try {
      const parsed: SchedulerSession = JSON.parse(stored);
      
      // Check if session is still valid
      if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
        onSessionUpdate(parsed);
      } else {
        // Session expired - clear it
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (error) {
      console.error('[Scheduler Session] Error hydrating session:', error);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [onSessionUpdate]);
  
  /**
   * Persist session to sessionStorage whenever it changes
   */
  useEffect(() => {
    if (session.token) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
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
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
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
