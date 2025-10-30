import { NextRequest, NextResponse } from 'next/server';
import { analyzePhotoQuality } from '@/server/lib/photoQualityAnalyzer';

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString();
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  
  console.log(`\n========================================`);
  console.log(`[Zapier Webhook] ${timestamp}`);
  console.log(`[Zapier Webhook] Incoming request from: ${clientIp}`);
  console.log(`========================================\n`);
  
  try {
    const body = await req.json();
    const { photos, jobId, jobDescription, customerName } = body;

    // Support both single photo and batch of photos
    const photoArray = Array.isArray(photos) ? photos : [{ photoUrl: body.photoUrl, jobId, jobDescription, customerName }];

    if (!photoArray.length || !photoArray[0].photoUrl) {
      console.log(`[Zapier Webhook] ❌ ERROR: Missing photoUrl`);
      return NextResponse.json({
        message: "Photo URL is required. Send either 'photoUrl' or 'photos' array with photoUrl in each object."
      }, { status: 400 });
    }

    console.log(`[Zapier Webhook] ✅ Received ${photoArray.length} photo(s) for processing`);

    const processedPhotos = [];
    const rejectedPhotos = [];

    // Process each photo through AI quality analysis
    for (const photo of photoArray) {
      if (!photo.photoUrl) {
        rejectedPhotos.push({ error: "Missing photoUrl", photo });
        continue;
      }

      try {
        const analysis = await analyzePhotoQuality(photo.photoUrl, photo.jobDescription);
        
        if (analysis.isQuality) {
          processedPhotos.push({
            photoUrl: photo.photoUrl,
            category: analysis.category,
            aiDescription: analysis.description,
            tags: analysis.tags
          });
        } else {
          rejectedPhotos.push({ photoUrl: photo.photoUrl, reason: analysis.rejectionReason });
        }
      } catch (error: any) {
        console.error(`[Zapier Webhook] Error processing photo:`, error);
        rejectedPhotos.push({ photoUrl: photo.photoUrl, error: error.message });
      }
    }

    console.log(`[Zapier Webhook] ✅ Processed: ${processedPhotos.length}, Rejected: ${rejectedPhotos.length}`);

    return NextResponse.json({
      success: true,
      processed: processedPhotos.length,
      rejected: rejectedPhotos.length,
      processedPhotos,
      rejectedPhotos
    });
  } catch (error: any) {
    console.error("[Zapier Webhook] Error:", error);
    return NextResponse.json({
      message: "Webhook processing failed",
      error: error.message
    }, { status: 500 });
  }
}
