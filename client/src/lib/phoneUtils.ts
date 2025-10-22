/**
 * Phone number utilities for formatting and validation
 */

/**
 * Format a phone number as (XXX) XXX-XXXX
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Apply formatting based on length
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 6) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
  } else if (phoneNumber.length <= 10) {
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  } else {
    // Limit to 10 digits (US phone numbers)
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  }
}

/**
 * Validate a US phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const phoneNumber = phone.replace(/\D/g, '');
  
  // Check if it's exactly 10 digits
  if (phoneNumber.length !== 10) {
    return false;
  }
  
  // Check if it starts with a valid area code (not 0 or 1)
  if (phoneNumber[0] === '0' || phoneNumber[0] === '1') {
    return false;
  }
  
  // Check if the exchange code is valid (not starting with 0 or 1)
  if (phoneNumber[3] === '0' || phoneNumber[3] === '1') {
    return false;
  }
  
  return true;
}

/**
 * Clean a phone number to just digits
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Format phone number for display (with country code)
 */
export function formatPhoneNumberWithCountry(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  
  if (cleaned.length === 10) {
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone; // Return as-is if not a valid format
}

/**
 * Check if a phone number is a mobile number (basic heuristic)
 * Note: This is not 100% accurate without carrier lookup
 */
export function isMobileNumber(phone: string): boolean {
  // This would require a carrier lookup API for accuracy
  // For now, we'll assume all valid numbers could be mobile
  return validatePhoneNumber(phone);
}

/**
 * Parse SMS keywords from a message
 */
export function parseSMSKeywords(message: string): {
  isOptOut: boolean;
  isOptIn: boolean;
  isHelp: boolean;
  keyword?: string;
} {
  const normalized = message.trim().toUpperCase();
  const firstWord = normalized.split(' ')[0];
  
  return {
    isOptOut: ['STOP', 'CANCEL', 'UNSUBSCRIBE', 'QUIT', 'END'].includes(firstWord),
    isOptIn: ['START', 'SUBSCRIBE', 'YES', 'UNSTOP'].includes(firstWord),
    isHelp: ['HELP', 'INFO', 'INFORMATION'].includes(firstWord),
    keyword: firstWord,
  };
}