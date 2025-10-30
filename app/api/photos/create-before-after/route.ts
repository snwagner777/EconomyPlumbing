import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';
import { processBeforeAfterPairs } from '@/server/lib/beforeAfterComposer';

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();

    if (!jobId) {
      return NextResponse.json(
        { message: "Job ID is required" },
        { status: 400 }
      );
    }

    // Get photos for this specific job
    const jobPhotos = await storage.getPhotosByJob(jobId);

    if (jobPhotos.length < 2) {
      return NextResponse.json({ 
        message: `Need at least 2 photos from job ${jobId}. Found ${jobPhotos.length} photos.`
      }, { status: 400 });
    }

    const composites = await processBeforeAfterPairs(jobPhotos, jobId);

    // Save composites to database
    const savedComposites = [];
    for (const composite of composites) {
      const saved = await storage.saveBeforeAfterComposite(composite);
      savedComposites.push(saved);
    }

    return NextResponse.json({
      success: true,
      created: savedComposites.length,
      composites: savedComposites,
    });
  } catch (error: any) {
    console.error("Error creating before/after composites:", error);
    return NextResponse.json({
      message: "Failed to create before/after composites",
      error: error.message
    }, { status: 500 });
  }
}
