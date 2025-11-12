/**
 * Per-Session Rate Limiting for Customer Portal
 * 
 * Lightweight in-memory rate limiting to prevent abuse of ServiceTitan API
 * Uses session ID as the rate limit key
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory store (resets on server restart - acceptable for lightweight protection)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests per window
  windowMs: number; // Time window in milliseconds
}

/**
 * Check if request is rate limited
 * Returns null if allowed, error response if blocked
 */
export function checkRateLimit(
  sessionId: string,
  config: RateLimitConfig = {
    maxRequests: 10, // Default: 10 mutations per 5 minutes
    windowMs: 5 * 60 * 1000, // 5 minutes
  }
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const key = `portal:${sessionId}`;
  
  let record = rateLimitStore.get(key);
  
  // Create new record if doesn't exist or window expired
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, record);
  }
  
  // Check if limit exceeded
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }
  
  // Increment counter
  record.count++;
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt,
  };
}
