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

    const existingNumbers = await storage.getAllTrackingNumbers();
    
    if (existingNumbers.length > 0) {
      return NextResponse.json({
        success: false,
        message: "Tracking numbers already exist. Delete them first if you want to reseed.",
        count: existingNumbers.length
      });
    }

    const seedData = [
      {
        channelKey: 'default',
        channelName: 'Default/Organic',
        displayNumber: '(512) 368-9159',
        rawNumber: '5123689159',
        telLink: 'tel:+15123689159',
        detectionRules: JSON.stringify({
          isDefault: true,
          patterns: []
        }),
        isActive: true,
        isDefault: true,
        sortOrder: 0
      },
      {
        channelKey: 'google',
        channelName: 'Google Ads',
        displayNumber: '(512) 368-9159',
        rawNumber: '5123689159',
        telLink: 'tel:+15123689159',
        detectionRules: JSON.stringify({
          urlParams: ['gclid'],
          utmSources: ['google'],
          referrerIncludes: ['google.com']
        }),
        isActive: true,
        isDefault: false,
        sortOrder: 1
      },
      {
        channelKey: 'facebook',
        channelName: 'Facebook/Instagram Ads',
        displayNumber: '(512) 575-3157',
        rawNumber: '5125753157',
        telLink: 'tel:+15125753157',
        detectionRules: JSON.stringify({
          urlParams: ['fbclid'],
          utmSources: ['facebook', 'instagram', 'fb', 'ig'],
          referrerIncludes: ['facebook.com', 'instagram.com']
        }),
        isActive: true,
        isDefault: false,
        sortOrder: 2
      },
      {
        channelKey: 'yelp',
        channelName: 'Yelp',
        displayNumber: '(512) 893-7316',
        rawNumber: '5128937316',
        telLink: 'tel:+15128937316',
        detectionRules: JSON.stringify({
          utmSources: ['yelp'],
          referrerIncludes: ['yelp.com']
        }),
        isActive: true,
        isDefault: false,
        sortOrder: 3
      },
      {
        channelKey: 'nextdoor',
        channelName: 'Nextdoor',
        displayNumber: '(512) 846-9146',
        rawNumber: '5128469146',
        telLink: 'tel:+15128469146',
        detectionRules: JSON.stringify({
          utmSources: ['nextdoor'],
          referrerIncludes: ['nextdoor.com']
        }),
        isActive: true,
        isDefault: false,
        sortOrder: 4
      }
    ];

    const created = [];
    for (const data of seedData) {
      const trackingNumber = await storage.createTrackingNumber(data);
      created.push(trackingNumber);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${created.length} tracking numbers`,
      trackingNumbers: created
    });
  } catch (error: any) {
    console.error("[Tracking Numbers] Error seeding tracking numbers:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
