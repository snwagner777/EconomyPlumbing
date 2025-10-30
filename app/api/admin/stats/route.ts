/**
 * Admin API - Photo Statistics
 * 
 * Get photo usage statistics for admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const photos = await storage.getAllPhotos();
    
    const stats = {
      total: photos.length,
      unused: photos.filter((p: any) => !p.usedInBlogPostId && !p.usedInPageUrl).length,
      used: photos.filter((p: any) => p.usedInBlogPostId || p.usedInPageUrl).length,
      goodQuality: photos.filter((p: any) => p.isGoodQuality).length,
      poorQuality: photos.filter((p: any) => !p.isGoodQuality).length,
      byCategory: photos.reduce((acc: any, p: any) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
    
    return NextResponse.json({ stats });
  } catch (error: any) {
    console.error("[Admin] Error fetching stats:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
