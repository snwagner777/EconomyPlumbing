import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { fetchAllGoogleMyBusinessReviews } from '@/server/lib/googleMyBusinessReviews';
import { db } from '@/server/db';
import { googleReviews } from '@shared/schema';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    console.log('[Admin] Manual GMB review fetch triggered');
    
    const gmbReviews = await fetchAllGoogleMyBusinessReviews();
    
    if (gmbReviews.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: "No reviews fetched. Please ensure you're authenticated and have configured account/location IDs.",
        count: 0
      });
    }

    // Save GMB reviews to database (with source = 'gmb_api')
    let inserted = 0;
    for (const review of gmbReviews) {
      try {
        await db.insert(googleReviews).values({
          ...review,
          source: 'gmb_api',
        }).onConflictDoNothing();
        inserted++;
      } catch (err) {
        console.error('[GMB Fetch] Error inserting review:', err);
      }
    }
    
    console.log(`[Admin] GMB review fetch complete: ${inserted}/${gmbReviews.length} new reviews saved`);
    return NextResponse.json({
      success: true,
      message: `Successfully fetched ${inserted} new reviews`,
      count: inserted,
      total: gmbReviews.length
    });
  } catch (error: any) {
    console.error('[Admin] Error fetching GMB reviews:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
