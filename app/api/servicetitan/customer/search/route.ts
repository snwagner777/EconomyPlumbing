import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('query');
    
    if (!query) {
      return NextResponse.json(
        { error: "Search query required" },
        { status: 400 }
      );
    }

    console.log(`[ServiceTitan] Customer search: ${query}`);

    const { getServiceTitanAPI } = await import('@/server/lib/serviceTitan');
    const serviceTitan = getServiceTitanAPI();
    
    const customers = await serviceTitan.searchCustomers(query);
    
    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('[ServiceTitan] Customer search error:', error);
    return NextResponse.json(
      { error: "Customer search failed" },
      { status: 500 }
    );
  }
}
