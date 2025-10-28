/**
 * Next.js Middleware - Runs before every request
 * 
 * Handles:
 * 1. Trailing slash redirects (301)
 * 2. Security headers
 * 3. .replit.app domain redirect to custom domain
 * 4. URL normalization
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. Redirect .replit.app domain to custom domain
  if (host.includes('.replit.app')) {
    const customDomain = 'https://www.plumbersthatcare.com';
    const redirectUrl = `${customDomain}${pathname}${search}`;
    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // 2. Trailing slash redirect (301 permanent)
  // Add trailing slash to all paths except:
  // - API routes (/api/*)
  // - Static files (with extensions)
  // - Paths that already have trailing slash
  const hasTrailingSlash = pathname.endsWith('/');
  const isApiRoute = pathname.startsWith('/api');
  const hasExtension = /\.[a-z]+$/i.test(pathname);
  
  if (!hasTrailingSlash && !isApiRoute && !hasExtension && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = `${pathname}/`;
    return NextResponse.redirect(url, { status: 301 });
  }

  // 3. Create response with security headers
  const response = NextResponse.next();

  // Security headers (matching Express implementation)
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://c.clarity.ms https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.facebook.com https://www.clarity.ms https://c.clarity.ms https://*.ingest.sentry.io",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.facebook.com https://servicetitan.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // HSTS (HTTP Strict Transport Security)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Clickjacking protection
  response.headers.set('X-Frame-Options', 'DENY');
  
  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  const permissionsDirectives = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=(self)',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'speaker=(self)'
  ];
  response.headers.set('Permissions-Policy', permissionsDirectives.join(', '));

  return response;
}

// Configure which routes middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /api/webhooks/stripe (needs raw body)
     * 3. /api/webhooks/resend (needs raw body)
     * 4. Static files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot|ico)$).*)',
  ],
};
