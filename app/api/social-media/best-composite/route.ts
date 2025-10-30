import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const composites = await storage.getUnusedComposites();

    if (composites.length === 0) {
      return NextResponse.json({
        message: "No unused composites available for posting"
      }, { status: 404 });
    }

    // Get the best one (highest quality score)
    const bestComposite = composites.reduce((best: any, current: any) => {
      const currentScore = (current.beforePhotoScore || 0) + (current.afterPhotoScore || 0);
      const bestScore = (best.beforePhotoScore || 0) + (best.afterPhotoScore || 0);
      return currentScore > bestScore ? current : best;
    }, composites[0]);

    // Return data formatted for Zapier
    return NextResponse.json({
      success: true,
      composite: {
        id: bestComposite.id,
        imageUrl: bestComposite.compositeUrl,
        caption: bestComposite.caption || `Check out this amazing transformation! 🔧✨\n\nCall us at (512) 575-3157 or visit https://www.plumbersthatcare.com/?utm=facebook`,
        category: bestComposite.category,
        beforePhotoUrl: bestComposite.beforePhotoUrl,
        afterPhotoUrl: bestComposite.afterPhotoUrl,
        jobDescription: bestComposite.jobDescription,
        totalScore: (bestComposite.beforePhotoScore || 0) + (bestComposite.afterPhotoScore || 0)
      }
    });
  } catch (error: any) {
    console.error("Error getting best composite:", error);
    return NextResponse.json({
      message: "Failed to get best composite",
      error: error.message
    }, { status: 500 });
  }
}
