/**
 * Admin Middleware for Next.js API Routes
 * 
 * Protects admin routes by verifying session
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';

/**
 * Middleware to protect admin routes
 * Returns 401 if not authenticated as admin
 */
export async function requireAdmin(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
}

/**
 * Alternative: Check admin status and return boolean
 * Use in route handlers for conditional logic
 */
export async function checkAdminStatus(): Promise<boolean> {
  return await isAdmin();
}
