import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { importedPhotos, companyCamPhotos } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { focalPointX, focalPointY, photoSource } = await req.json();

    // Validate inputs
    if (focalPointX !== null && (typeof focalPointX !== 'number' || focalPointX < 0 || focalPointX > 100)) {
      return NextResponse.json(
        { error: "focalPointX must be a number between 0 and 100" },
        { status: 400 }
      );
    }
    if (focalPointY !== null && (typeof focalPointY !== 'number' || focalPointY < 0 || focalPointY > 100)) {
      return NextResponse.json(
        { error: "focalPointY must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Update the appropriate table based on photo source
    if (photoSource === 'google-drive') {
      await db
        .update(importedPhotos)
        .set({
          focalPointX: focalPointX === null ? null : Math.round(focalPointX),
          focalPointY: focalPointY === null ? null : Math.round(focalPointY),
        })
        .where(eq(importedPhotos.id, id));
    } else {
      // Default to companyCamPhotos for companycam and other sources
      await db
        .update(companyCamPhotos)
        .set({
          focalPointX: focalPointX === null ? null : Math.round(focalPointX),
          focalPointY: focalPointY === null ? null : Math.round(focalPointY),
        })
        .where(eq(companyCamPhotos.id, id));
    }

    return NextResponse.json({ 
      success: true, 
      message: "Focal point updated successfully",
      focalPoint: { x: focalPointX, y: focalPointY }
    });
  } catch (error: any) {
    console.error("[Admin] Error updating focal point:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
