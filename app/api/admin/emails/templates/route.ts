import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { reviewEmailTemplates } from '@shared/schema';

export async function GET(req: NextRequest) {
  const { db } = await import('@/server/db');
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const templates = await db
      .select()
      .from(reviewEmailTemplates)
      .orderBy(reviewEmailTemplates.campaignType, reviewEmailTemplates.emailNumber);

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("[AI Email Generator] Error fetching templates:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
