(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__f2b15f93._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Next.js Middleware - Runs before every request
 * 
 * Handles:
 * 1. Session-based authentication for admin routes
 * 2. Legacy object storage URL rewrites
 * 3. Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * 4. .replit.app domain redirect (disabled in development)
 */ __turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$iron$2d$session$2f$dist$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/iron-session/dist/index.js [middleware-edge] (ecmascript)");
;
;
const sessionOptions = {
    password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_production',
    cookieName: 'admin_session',
    cookieOptions: {
        secure: ("TURBOPACK compile-time value", "development") === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
    }
};
async function middleware(request) {
    const { pathname } = request.nextUrl;
    // Check if this is an admin route (except login page)
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
        const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
        const session = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$iron$2d$session$2f$dist$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["getIronSession"])(request.cookies, response.cookies, sessionOptions);
        if (!session.isAuthenticated) {
            // Redirect to login page
            const loginUrl = new URL('/admin/login', request.url);
            loginUrl.searchParams.set('from', pathname);
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(loginUrl);
        }
    }
    return handleMiddleware(request);
}
function handleMiddleware(request) {
    const { pathname, search } = request.nextUrl;
    const host = request.headers.get('host') || '';
    // 1. Redirect .replit.app domain to custom domain (DISABLED IN DEVELOPMENT)
    // In production, this will redirect to custom domain
    // In development, we allow both .replit.app and localhost
    // if (host.includes('.replit.app') && process.env.NODE_ENV === 'production') {
    //   const customDomain = 'https://www.plumbersthatcare.com';
    //   const redirectUrl = `${customDomain}${pathname}${search}`;
    //   return NextResponse.redirect(redirectUrl, { status: 301 });
    // }
    // 2. Rewrite legacy object storage URLs
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
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].rewrite(url);
        }
    }
    // 3. Set security headers on response
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
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
const config = {
    matcher: [
        /*
     * Match all request paths except:
     * 1. /_next (Next.js internals)
     * 2. /api/webhooks/stripe (needs raw body)
     * 3. /api/webhooks/resend (needs raw body)
     * 4. Static files (images, fonts, etc.)
     */ '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot|ico)$).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__f2b15f93._.js.map