import type { Request, Response, NextFunction } from 'express';

/**
 * Security Headers Middleware
 * Implements comprehensive security headers including CSP, HSTS, and more
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Content Security Policy (CSP)
  // Prevents XSS attacks by controlling which resources can be loaded
  const cspDirectives = [
    "default-src 'self'",
    // Script sources: Stripe (js.stripe.com + m.stripe.network for telemetry), analytics, NiceJob widget, etc.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://c.clarity.ms https://cdn.nicejob.co",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.nicejob.co",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Images: Allow all HTTPS for external logos, Stripe assets, etc.
    "img-src 'self' data: https: blob:",
    // Connect sources: Stripe API + telemetry, analytics APIs, NiceJob API
    "connect-src 'self' https://api.stripe.com https://m.stripe.network https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://graph.facebook.com https://www.clarity.ms https://c.clarity.ms https://cdn.nicejob.co https://api.nicejob.co https://app.nicejob.com",
    // Frames: Stripe checkout/Elements iframes, NiceJob widget iframes
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://app.nicejob.com https://cdn.nicejob.co",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://js.stripe.com https://app.nicejob.com",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
  
  // Strict Transport Security (HSTS)
  // Forces HTTPS for 1 year including subdomains
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  // X-Content-Type-Options
  // Prevents MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options
  // Prevents clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  // Legacy XSS protection (still useful for older browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer-Policy
  // Controls how much referrer information is shared
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions-Policy (formerly Feature-Policy)
  // Restricts which browser features can be used
  const permissionsPolicy = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ];
  res.setHeader('Permissions-Policy', permissionsPolicy.join(', '));
  
  next();
}
