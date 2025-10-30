import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/middleware/authMiddleware';
import { processLogoToWhiteMonochrome } from '@/server/lib/logoProcessor';

export async function POST(req: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { logoUrl, customerName } = await req.json();

    if (!logoUrl) {
      return NextResponse.json(
        { error: "Logo URL is required" },
        { status: 400 }
      );
    }

    if (!customerName) {
      return NextResponse.json(
        { error: "Customer name is required" },
        { status: 400 }
      );
    }

    // Process logo to white monochrome version
    const processedLogoUrl = await processLogoToWhiteMonochrome(logoUrl, customerName);
    
    return NextResponse.json({ processedLogoUrl });
  } catch (error: any) {
    console.error("[Logo Processing] Error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
