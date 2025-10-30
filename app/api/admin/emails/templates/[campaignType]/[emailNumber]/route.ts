import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { reviewEmailTemplates } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignType: string; emailNumber: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const { campaignType, emailNumber } = await params;
    
    const template = await db
      .select()
      .from(reviewEmailTemplates)
      .where(
        and(
          eq(reviewEmailTemplates.campaignType, campaignType),
          eq(reviewEmailTemplates.emailNumber, parseInt(emailNumber))
        )
      )
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ template: template[0] });
  } catch (error: any) {
    console.error("[AI Email Generator] Error fetching template:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
