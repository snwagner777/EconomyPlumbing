import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/lib/nextAuth';
import { db } from '@/server/db';
import { reviewEmailTemplates } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401 }
      );
    }

    const {
      campaignType,
      emailNumber,
      subject,
      htmlContent,
      plainTextContent,
      isActive
    } = await req.json();

    // Validate required fields
    if (!campaignType || !emailNumber || !subject || !htmlContent || !plainTextContent) {
      return NextResponse.json({
        error: "Missing required fields: campaignType, emailNumber, subject, htmlContent, plainTextContent"
      }, { status: 400 });
    }

    // Check if template already exists for this campaign/email combination
    const existing = await db
      .select()
      .from(reviewEmailTemplates)
      .where(
        and(
          eq(reviewEmailTemplates.campaignType, campaignType),
          eq(reviewEmailTemplates.emailNumber, emailNumber)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing template
      const updated = await db
        .update(reviewEmailTemplates)
        .set({
          subject,
          htmlContent,
          plainTextContent,
          customized: true,
          lastEditedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(reviewEmailTemplates.id, existing[0].id))
        .returning();

      console.log(`[AI Email Generator] Updated template for ${campaignType} email #${emailNumber}`);
      return NextResponse.json({ template: updated[0], updated: true });
    } else {
      // Create new template
      const newTemplate = await db
        .insert(reviewEmailTemplates)
        .values({
          campaignType,
          emailNumber,
          subject,
          htmlContent,
          plainTextContent,
          aiGenerated: true
        })
        .returning();

      console.log(`[AI Email Generator] Created new template for ${campaignType} email #${emailNumber}`);
      return NextResponse.json({ template: newTemplate[0], updated: false });
    }
  } catch (error: any) {
    console.error("[AI Email Generator] Error saving template:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
