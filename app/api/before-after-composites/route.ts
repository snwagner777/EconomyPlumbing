import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const composites = await storage.getBeforeAfterComposites();
    return NextResponse.json(composites);
  } catch (error: any) {
    console.error("Error fetching composites:", error);
    return NextResponse.json(
      { message: "Failed to fetch composites" },
      { status: 500 }
    );
  }
}
