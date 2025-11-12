/**
 * Shared Session Service
 * 
 * Manages session tokens across scheduler, AI chatbot, and customer portal.
 * Uses localStorage with namespaced keys for cross-tab persistence.
 * 
 * CRITICAL: This is the ONLY place that reads/writes session tokens.
 * All three contexts (scheduler, chatbot, portal) use this module.
 */

const STORAGE_KEYS = {
  scheduler: 'scheduler_session',
  chatbot: 'chatbot_session',
  portal: 'portal_session',
} as const;

export type SessionContext = keyof typeof STORAGE_KEYS;

export interface SessionData {
  token: string;
  verificationMethod: 'phone' | 'email';
  verifiedAt: number;
  customerId: number | null;
  expiresAt: number;
}

/**
 * Get session token for a specific context
 */
export function getToken(context: SessionContext): string | null {
  if (typeof window === 'undefined') return null;
  
  const key = STORAGE_KEYS[context];
  const stored = localStorage.getItem(key);
  
  if (!stored) return null;
  
  try {
    const session: SessionData = JSON.parse(stored);
    
    // Check expiration
    if (session.expiresAt && session.expiresAt < Date.now()) {
      console.log(`[Session] ${context} session expired, clearing`);
      clearToken(context);
      return null;
    }
    
    return session.token;
  } catch (error) {
    console.error(`[Session] Error parsing ${context} session:`, error);
    clearToken(context);
    return null;
  }
}

/**
 * Get full session data for a specific context
 */
export function getSession(context: SessionContext): SessionData | null {
  if (typeof window === 'undefined') return null;
  
  const key = STORAGE_KEYS[context];
  const stored = localStorage.getItem(key);
  
  if (!stored) return null;
  
  try {
    const session: SessionData = JSON.parse(stored);
    
    // Check expiration
    if (session.expiresAt && session.expiresAt < Date.now()) {
      console.log(`[Session] ${context} session expired, clearing`);
      clearToken(context);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error(`[Session] Error parsing ${context} session:`, error);
    clearToken(context);
    return null;
  }
}

/**
 * Set session data for a specific context
 */
export function setSession(context: SessionContext, data: SessionData): void {
  if (typeof window === 'undefined') return;
  
  const key = STORAGE_KEYS[context];
  localStorage.setItem(key, JSON.stringify(data));
  console.log(`[Session] ${context} session saved`);
}

/**
 * Clear session for a specific context
 */
export function clearToken(context: SessionContext): void {
  if (typeof window === 'undefined') return;
  
  const key = STORAGE_KEYS[context];
  localStorage.removeItem(key);
  console.log(`[Session] ${context} session cleared`);
}

/**
 * Check if session is valid (exists and not expired)
 */
export function isSessionValid(context: SessionContext): boolean {
  const session = getSession(context);
  return session !== null;
}

/**
 * Update customerId in existing session (after customer creation)
 */
export function updateCustomerId(context: SessionContext, customerId: number): boolean {
  const session = getSession(context);
  if (!session) {
    console.warn(`[Session] Cannot update customerId - no ${context} session found`);
    return false;
  }
  
  session.customerId = customerId;
  setSession(context, session);
  console.log(`[Session] Updated ${context} session with customerId ${customerId}`);
  return true;
}
