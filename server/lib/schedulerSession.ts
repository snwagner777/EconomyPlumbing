/**
 * Scheduler Session Management
 * 
 * Manages short-lived, signed session tokens for the public scheduler.
 * After 2FA verification, we mint a session token that proves the user
 * verified their contact method. This token is required for booking.
 */

import crypto from 'crypto';

// Require SESSION_SECRET to be configured - no fallback allowed for security
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be configured for scheduler session management');
}

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

interface SchedulerSessionData {
  sessionId: string;
  verifiedContact: string; // Phone or email (stored hashed on server)
  verificationMethod: 'phone' | 'email';
  verifiedAt: number;
  customerId: number | null;
  expiresAt: number;
}

interface SchedulerSessionToken {
  token: string;
  verificationMethod: 'phone' | 'email';
  verifiedAt: number;
  customerId: number | null;
  expiresAt: number;
}

// In-memory session store (could be Redis in production)
const sessionStore = new Map<string, SchedulerSessionData>();

// Cleanup expired sessions every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessionStore.entries()) {
    if (session.expiresAt < now) {
      sessionStore.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

/**
 * Hash contact information for server-side storage
 */
function hashContact(contact: string): string {
  return crypto.createHash('sha256').update(contact.toLowerCase()).digest('hex');
}

/**
 * Sign a session token to prevent tampering
 */
function signToken(sessionId: string, verifiedContact: string, expiresAt: number): string {
  const data = `${sessionId}:${verifiedContact}:${expiresAt}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET!).update(data).digest('hex');
  return `${sessionId}:${signature}`;
}

/**
 * Verify a session token signature using constant-time comparison
 */
function verifyToken(token: string, verifiedContact: string, expiresAt: number): string | null {
  const parts = token.split(':');
  if (parts.length !== 2) return null;
  
  const [sessionId, signature] = parts;
  const data = `${sessionId}:${verifiedContact}:${expiresAt}`;
  const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET!).update(data).digest('hex');
  
  // Use constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  
  if (signatureBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  
  return sessionId;
}

/**
 * Mint a new scheduler session token after 2FA verification
 */
export function mintSchedulerSession(
  verifiedContact: string,
  verificationMethod: 'phone' | 'email',
  customerId: number | null
): SchedulerSessionToken {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const verifiedAt = Date.now();
  const expiresAt = verifiedAt + SESSION_TTL_MS;
  const contactHash = hashContact(verifiedContact);
  
  // Store session data server-side
  const sessionData: SchedulerSessionData = {
    sessionId,
    verifiedContact: contactHash,
    verificationMethod,
    verifiedAt,
    customerId,
    expiresAt,
  };
  sessionStore.set(sessionId, sessionData);
  
  // Sign the token
  const token = signToken(sessionId, contactHash, expiresAt);
  
  // Return token and metadata - keep contact hash server-side only
  return {
    token,
    verificationMethod,
    verifiedAt,
    customerId,
    expiresAt,
  };
}

/**
 * Validate a scheduler session token
 */
export function validateSchedulerSession(token: string): SchedulerSessionData | null {
  const parts = token.split(':');
  if (parts.length !== 2) return null;
  
  const [sessionId] = parts;
  const session = sessionStore.get(sessionId);
  
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessionStore.delete(sessionId);
    return null;
  }
  
  // Verify signature
  const verifiedSessionId = verifyToken(token, session.verifiedContact, session.expiresAt);
  if (verifiedSessionId !== sessionId) return null;
  
  return session;
}

/**
 * Refresh a scheduler session (extend TTL on meaningful interactions)
 */
export function refreshSchedulerSession(token: string): SchedulerSessionToken | null {
  const session = validateSchedulerSession(token);
  if (!session) return null;
  
  // Extend expiration
  const newExpiresAt = Date.now() + SESSION_TTL_MS;
  session.expiresAt = newExpiresAt;
  sessionStore.set(session.sessionId, session);
  
  // Mint new token with updated expiry
  const newToken = signToken(session.sessionId, session.verifiedContact, newExpiresAt);
  
  // Return refreshed token and metadata - keep contact hash server-side only
  return {
    token: newToken,
    verificationMethod: session.verificationMethod,
    verifiedAt: session.verifiedAt,
    customerId: session.customerId,
    expiresAt: newExpiresAt,
  };
}

/**
 * Invalidate a scheduler session (logout/booking complete)
 */
export function invalidateSchedulerSession(token: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  
  const [sessionId] = parts;
  return sessionStore.delete(sessionId);
}

/**
 * Get session data for a customer ID (used by booking API to enrich requests)
 */
export function getSchedulerSessionByCustomerId(customerId: number): SchedulerSessionData | null {
  for (const session of sessionStore.values()) {
    if (session.customerId === customerId && session.expiresAt > Date.now()) {
      return session;
    }
  }
  return null;
}
