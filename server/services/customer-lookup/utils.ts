/**
 * Customer Lookup Service - Shared Utilities
 * 
 * Common normalization and helper functions
 */

/**
 * Normalize phone number to digits only
 * Strips country codes (leading 1 from 11-digit US numbers)
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  let digits = phone.replace(/\D/g, '');
  
  // Strip leading '1' from 11-digit US numbers
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  
  return digits;
}

/**
 * Normalize email to lowercase and trim
 */
export function normalizeEmail(email: string): string {
  if (!email) return '';
  return email.toLowerCase().trim();
}

/**
 * Validate phone number (flexible - allows partial matches)
 * Returns true if phone contains at least some digits
 * Use normalizePhone() to clean before storage/comparison
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const normalized = normalizePhone(phone);
  // Allow any length with digits (legacy behavior)
  // Just check that normalization produced something
  return normalized.length > 0;
}

/**
 * Check if phone is a complete 10-digit number
 * Use this for strict validation when needed
 */
export function isComplete10DigitPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.length === 10;
}

/**
 * Validate email address (flexible)
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  // Basic check - contains @ and a dot after it
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Score match quality for ranking
 * Higher score = better match
 */
export function scoreMatch(match: {
  phone?: string | null;
  email?: string | null;
  address?: { city?: string; state?: string } | null;
}, searchCriteria: {
  phone?: string;
  email?: string;
}): number {
  let score = 0;
  
  // Exact phone match: +100
  if (searchCriteria.phone && match.phone) {
    const normalizedSearch = normalizePhone(searchCriteria.phone);
    const normalizedMatch = normalizePhone(match.phone);
    if (normalizedSearch === normalizedMatch) {
      score += 100;
    }
  }
  
  // Exact email match: +100
  if (searchCriteria.email && match.email) {
    const normalizedSearch = normalizeEmail(searchCriteria.email);
    const normalizedMatch = normalizeEmail(match.email);
    if (normalizedSearch === normalizedMatch) {
      score += 100;
    }
  }
  
  // Has complete address: +10
  if (match.address?.city && match.address?.state) {
    score += 10;
  }
  
  return score;
}
