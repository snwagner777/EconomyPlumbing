import { NextRequest, NextResponse } from 'next/server';
import { createServiceTitanProjectPhotosAPI } from '@/server/lib/serviceTitanProjectPhotos';

export async function POST(req: NextRequest) {
  try {
    const { daysAgo = 30 } = await req.json();

    const api = createServiceTitanProjectPhotosAPI();

    if (!api) {
      return NextResponse.json({
        message: "ServiceTitan credentials not configured. Please check SERVICETITAN_CLIENT_ID, SERVICETITAN_CLIENT_SECRET, SERVICETITAN_TENANT_ID, and SERVICETITAN_APP_KEY environment variables."
      }, { status: 400 });
    }

    const totalImported = await api.importRecentJobPhotos(daysAgo);

    return NextResponse.json({
      success: true,
      imported: totalImported,
      message: `Successfully imported ${totalImported} quality photos from ServiceTitan jobs in the last ${daysAgo} days`
    });
  } catch (error: any) {
    console.error("Error importing ServiceTitan photos:", error);
    return NextResponse.json({
      message: "Failed to import photos from ServiceTitan",
      error: error.message
    }, { status: 500 });
  }
}
