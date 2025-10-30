import { NextRequest, NextResponse } from 'next/server';
import { validatePhotoUrl } from '@/server/lib/urlValidator';
import { analyzePhotoQuality } from '@/server/lib/photoQualityAnalyzer';

export async function POST(req: NextRequest) {
  try {
    const { photoUrl, description } = await req.json();
    
    if (!photoUrl) {
      return NextResponse.json(
        { message: "Photo URL is required" },
        { status: 400 }
      );
    }

    // SECURITY: Validate URL to prevent SSRF attacks
    const validation = validatePhotoUrl(photoUrl);
    
    if (!validation.isValid) {
      console.warn(`[Security] Rejected photo URL: ${photoUrl} - ${validation.error}`);
      return NextResponse.json({ 
        message: "Invalid photo URL", 
        error: validation.error 
      }, { status: 400 });
    }

    const analysis = await analyzePhotoQuality(validation.sanitizedUrl!, description);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Error analyzing photo:", error);
    return NextResponse.json({ 
      message: "Photo analysis failed", 
      error: error.message 
    }, { status: 500 });
  }
}
