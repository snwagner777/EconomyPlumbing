import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to inject URL search parameters into request headers
 * This allows server components in layouts to access UTM tracking parameters
 * for dynamic phone number resolution while maintaining SSR
 */
export function middleware(request: NextRequest) {
  // Only process GET requests (don't interfere with POST/PUT/DELETE)
  if (request.method !== 'GET') {
    return NextResponse.next();
  }

  // Extract search params from URL
  const searchParams = request.nextUrl.searchParams;
  
  // Create response with custom header containing serialized search params
  const response = NextResponse.next();
  
  // Serialize search params to JSON for easy parsing in server components
  if (searchParams.size > 0) {
    const paramsObject: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      paramsObject[key] = value;
    });
    response.headers.set('x-search-params', JSON.stringify(paramsObject));
  }
  
  return response;
}

/**
 * Configure which routes the middleware applies to
 * Match all routes except:
 * - API routes
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
