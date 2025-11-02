import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { storage } from '@/server/storage';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { photo1Id, photo2Id, title, description } = await req.json();
    
    if (!photo1Id || !photo2Id || !title || !description) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    console.log(`[Manual Success Story] Creating success story...`);

    // Get the photo URLs
    const photo1 = await storage.getPhotoById(photo1Id);
    const photo2 = await storage.getPhotoById(photo2Id);

    if (!photo1 || !photo2) {
      return NextResponse.json(
        { error: "One or both photos not found" },
        { status: 400 }
      );
    }

    // Create the success story (unapproved by default)
    const story = await storage.createCustomerSuccessStory({
      customerName: "Customer",
      story: description,
      beforePhotoUrl: photo1.photoUrl,
      afterPhotoUrl: photo2.photoUrl,
      serviceCategory: photo1.category || "general",
      location: "Austin/Marble Falls, TX",
    });

    // Mark photos as used
    await storage.markPhotoAsUsed(photo1Id, story.id, 'success_story');
    await storage.markPhotoAsUsed(photo2Id, story.id, 'success_story');

    console.log(`[Manual Success Story] ✅ Success story created: ${story.id}`);

    return NextResponse.json({ story });
  } catch (error: any) {
    console.error("[Manual Success Story] Error creating story:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
