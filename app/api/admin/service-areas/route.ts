/**
 * Admin API - Service Area Management
 * 
 * Create and manage service area pages for SEO
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';
import { z } from 'zod';

const serviceAreaSchema = z.object({
  cityName: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  region: z.string(),
  metaDescription: z.string().max(160),
  introContent: z.string(),
  neighborhoods: z.array(z.string()).optional(),
  landmarks: z.array(z.string()).optional(),
  population: z.string().optional(),
  zipCodes: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const areas = await storage.getAllServiceAreas();

    return NextResponse.json({
      serviceAreas: areas,
      count: areas.length,
    });
  } catch (error) {
    console.error('[Admin Service Areas API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch areas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const result = serviceAreaSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const area = await storage.createServiceArea(result.data);

    return NextResponse.json({ serviceArea: area }, { status: 201 });
  } catch (error) {
    console.error('[Admin Service Areas API] Error:', error);
    return NextResponse.json({ error: 'Failed to create area' }, { status: 500 });
  }
}
