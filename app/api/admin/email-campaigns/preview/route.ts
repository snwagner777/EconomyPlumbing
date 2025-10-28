/**
 * Admin API - Email Campaign Preview
 * 
 * Generate and preview email campaign HTML before sending
 */

import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/session';
import { z } from 'zod';

const previewSchema = z.object({
  campaignType: z.enum(['review_request', 'referral_nurture', 'quote_followup']),
  templateId: z.number().int().optional(),
  customerId: z.number().int(),
  emailNumber: z.number().int().min(1).max(4), // Which email in sequence
});

export async function POST(req: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate input
    const result = previewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // Import email generator dynamically
    const { generateEmailPreview } = await import('@/server/lib/emailGenerator');
    
    const preview = await generateEmailPreview(result.data);

    return NextResponse.json({
      success: true,
      preview: {
        html: preview.html,
        subject: preview.subject,
        preheader: preview.preheader,
      },
    });
  } catch (error) {
    console.error('[Admin Email Preview API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview', details: (error as Error).message },
      { status: 500 }
    );
  }
}
