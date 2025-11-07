/**
 * Next.js 16 Proxy - Runs before every request
 * (Previously called middleware in Next.js 15)
 * 
 * Handles:
 * 1. Session-based authentication for admin routes
 * 2. Non-www to www redirect (301 permanent)
 * 3. Legacy object storage URL rewrites
 * 4. Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * 5. .replit.app domain redirect (disabled in development)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { unsealData } from 'iron-session';
import type { SessionData } from './src/lib/auth';

// Validate SESSION_SECRET at runtime
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be set and at least 32 characters long');
}

const sessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'admin_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an admin route (except login page and API routes)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !pathname.startsWith('/api/')) {
    // Get session cookie
    const cookie = request.cookies.get('admin_session')?.value;
    
    console.log('[Proxy]', pathname, 'Cookie exists:', !!cookie);
    
    if (!cookie) {
      // No session cookie - redirect to login
      console.log('[Proxy] No cookie, redirecting to login');
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    try {
      // Unseal the session data from the cookie
      const session = await unsealData<SessionData>(cookie, {
        password: sessionOptions.password,
      });
      
      console.log('[Proxy] Session unsealed:', { isAuthenticated: session?.isAuthenticated, username: session?.username });
      
      if (!session?.isAuthenticated) {
        // Not authenticated - redirect to login
        console.log('[Proxy] Session not authenticated, redirecting to login');
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      // Session is valid, continue to the requested page
      console.log('[Proxy] Session valid, allowing access to', pathname);
      return NextResponse.next();
    } catch (error) {
      console.error('[Proxy] Session validation error:', error);
      // Session validation failed - redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return handleProxy(request);
}

function handleProxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // 1. Redirect non-www to www (301 permanent redirect)
  if (host === 'plumbersthatcare.com') {
    const wwwUrl = `https://www.plumbersthatcare.com${pathname}${search}`;
    return NextResponse.redirect(wwwUrl, { status: 301 });
  }

  // 2. Redirect .replit.app domain to custom domain (DISABLED IN DEVELOPMENT)
  // In production, this will redirect to custom domain
  // In development, we allow both .replit.app and localhost
  // if (host.includes('.replit.app') && process.env.NODE_ENV === 'production') {
  //   const customDomain = 'https://www.plumbersthatcare.com';
  //   const redirectUrl = `${customDomain}${pathname}${search}`;
  //   return NextResponse.redirect(redirectUrl, { status: 301 });
  // }

  // 3. Rewrite legacy object storage URLs
  // /replit-objstore-{bucketId}/public/* → /public-objects/*
  // Preserves query strings for signed URLs and versioning
  if (pathname.match(/^\/replit-objstore-[^/]+\/public\//)) {
    const filePathMatch = pathname.match(/^\/replit-objstore-[^/]+\/public\/(.*)$/);
    if (filePathMatch) {
      const filePath = filePathMatch[1];
      const url = request.nextUrl.clone();
      url.pathname = `/public-objects/${filePath}`;
      // Query strings (search) are automatically preserved by clone()
      // but explicitly ensuring parity for signed URLs: url.search remains unchanged
      return NextResponse.rewrite(url);
    }
  }

  // 4. Set security headers on response
  const response = NextResponse.next();

  // Security headers (matching Express implementation)
  
  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://c.clarity.ms https://cdn.jsdelivr.net https://app.ecwid.com https://*.cloudfront.net https://storefont.ecwid.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.cloudfront.net https://storefont.ecwid.dev",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://www.facebook.com https://www.clarity.ms https://c.clarity.ms https://*.ingest.sentry.io https://app.ecwid.com https://*.cloudfront.net https://storefont.ecwid.dev",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://www.facebook.com https://servicetitan.com https://app.ecwid.com https://*.cloudfront.net",
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
