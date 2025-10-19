/**
 * URL Validation and SSRF Protection
 * Prevents Server-Side Request Forgery attacks by validating and sanitizing URLs
 */

// Whitelist of allowed domains for photo webhooks and analysis
const ALLOWED_DOMAINS = [
  'companycam.com',
  'companycam-files.s3.amazonaws.com',
  'replit-objstore',
  'storage.googleapis.com',
  'drive.google.com',
  'lh3.googleusercontent.com',
  'servicetitan.com',
  'servicetitan-files.s3.amazonaws.com',
] as const;

// Private IP ranges that should be blocked (SSRF protection)
const PRIVATE_IP_RANGES = [
  /^127\./,           // 127.0.0.0/8 (localhost)
  /^10\./,            // 10.0.0.0/8 (private)
  /^172\.(1[6-9]|2\d|3[01])\./,  // 172.16.0.0/12 (private)
  /^192\.168\./,      // 192.168.0.0/16 (private)
  /^169\.254\./,      // 169.254.0.0/16 (link-local)
  /^0\./,             // 0.0.0.0/8 (current network)
  /^::1$/,            // IPv6 localhost
  /^fe80:/,           // IPv6 link-local
  /^fc00:/,           // IPv6 unique local
];

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Validate and sanitize a URL for photo webhooks and analysis
 * Prevents SSRF attacks by checking against whitelist and blocking private IPs
 */
export function validatePhotoUrl(url: string): UrlValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string',
    };
  }

  // Basic URL format validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format',
    };
  }

  // Only allow HTTP and HTTPS protocols
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      isValid: false,
      error: 'Only HTTP and HTTPS protocols are allowed',
    };
  }

  // Check if hostname is in whitelist
  const hostname = parsedUrl.hostname.toLowerCase();
  const isWhitelisted = ALLOWED_DOMAINS.some(domain => 
    hostname === domain || hostname.endsWith(`.${domain}`)
  );

  if (!isWhitelisted) {
    return {
      isValid: false,
      error: `Domain not whitelisted. Allowed domains: ${ALLOWED_DOMAINS.join(', ')}`,
    };
  }

  // Check for private IP addresses (SSRF protection)
  if (PRIVATE_IP_RANGES.some(pattern => pattern.test(hostname))) {
    return {
      isValid: false,
      error: 'Private IP addresses are not allowed',
    };
  }

  // Additional checks for localhost variations
  if (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname === '[::]'
  ) {
    return {
      isValid: false,
      error: 'Localhost addresses are not allowed',
    };
  }

  return {
    isValid: true,
    sanitizedUrl: parsedUrl.toString(),
  };
}

/**
 * Validate multiple URLs at once
 */
export function validatePhotoUrls(urls: string[]): UrlValidationResult[] {
  return urls.map(url => validatePhotoUrl(url));
}

/**
 * Check if all URLs in an array are valid
 */
export function areAllUrlsValid(urls: string[]): boolean {
  return urls.every(url => validatePhotoUrl(url).isValid);
}
