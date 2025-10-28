/**
 * Admin API - Email Templates
 * 
 * Manage AI-generated email templates for campaigns
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { storage } from '@/server/storage';

export async function GET(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await storage.getAllEmailTemplates();

    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('[Admin Email Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const template = await storage.upsertEmailTemplate(data);

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('[Admin Email Templates API] Error:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
