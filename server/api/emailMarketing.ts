import { Request, Response, Express } from "express";
import { db } from "../lib/db";
import { 
  emailCampaigns, 
  campaignEmails,
  emailSendLog,
  emailTemplates,
  emailPreferences,
  emailSuppressionList,
  customerSegments,
  segmentMembership,
  marketingSystemSettings
} from "@shared/schema";
import { eq, and, or, desc, isNull, gte, sql, inArray } from "drizzle-orm";
import { sendMarketingEmail } from "../lib/email";
import { generateEmailContent } from "../lib/aiEmailGeneration";
import { getServiceTitanCustomers } from "../lib/serviceTitan";

/**
 * Email Marketing API Routes
 */
export function registerEmailMarketingRoutes(app: Express) {
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  /**
   * GET /api/admin/email-templates
   * Get all email templates
   */
  app.get("/api/admin/email-templates", requireAuth, async (req, res) => {
    try {
      const templates = await db
        .select()
        .from(emailTemplates)
        .orderBy(desc(emailTemplates.createdAt));

      res.json(templates);
    } catch (error) {
      console.error("[Email API] Error fetching templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  /**
   * POST /api/admin/email-templates
   * Create a new email template
   */
  app.post("/api/admin/email-templates", requireAuth, async (req, res) => {
    try {
      const { name, subject, htmlContent, textContent, category, tags } = req.body;

      if (!name || !subject || !htmlContent) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const [template] = await db
        .insert(emailTemplates)
        .values({
          name,
          subject,
          htmlContent,
          textContent: textContent || "",
          category: category || "general",
          tags: tags || [],
          variables: extractVariables(htmlContent),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log(`[Email API] Created template: ${name}`);
      res.json(template);
    } catch (error) {
      console.error("[Email API] Error creating template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  /**
   * POST /api/admin/email/generate
   * Generate email content using AI
   */
  app.post("/api/admin/email/generate", requireAuth, async (req, res) => {
    try {
      const { prompt, tone, includePersonalization } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      console.log("[Email API] Generating AI content...");
      const content = await generateEmailContent({
        prompt,
        tone: tone || "professional",
        includePersonalization: includePersonalization !== false,
      });

      res.json(content);
    } catch (error) {
      console.error("[Email API] Error generating AI content:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  /**
   * POST /api/admin/email/send-campaign
   * Send an email campaign
   */
  app.post("/api/admin/email/send-campaign", requireAuth, async (req, res) => {
    try {
      const { 
        subject, 
        htmlContent, 
        textContent, 
        recipientType, 
        segmentId, 
        individualEmails,
        scheduledFor,
        testMode 
      } = req.body;

      if (!subject || !htmlContent) {
        return res.status(400).json({ error: "Subject and content are required" });
      }

      // Check master send switch
      const settings = await db
        .select()
        .from(marketingSystemSettings)
        .where(eq(marketingSystemSettings.settingKey, "email_master_switch_enabled"))
        .limit(1);

      const masterEnabled = settings[0]?.settingValue === "true";
      
      if (!masterEnabled && !testMode) {
        return res.status(400).json({ 
          error: "Email sending is currently disabled. Enable the master switch in settings." 
        });
      }

      // Create campaign record
      const [campaign] = await db
        .insert(emailCampaigns)
        .values({
          name: `Manual Campaign - ${new Date().toISOString()}`,
          subject,
          htmlContent,
          textContent: textContent || "",
          status: scheduledFor ? "scheduled" : "active",
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Get recipients based on type
      let recipients: any[] = [];

      if (testMode) {
        // In test mode, only send to admin
        recipients = [{
          email: "admin@plumbersthatcare.com",
          name: "Admin Test",
        }];
      } else if (recipientType === "all") {
        // Get all customers with emails
        const customers = await getServiceTitanCustomers();
        recipients = customers
          .filter(c => c.email)
          .map(c => ({
            email: c.email,
            name: c.name,
            customerId: c.id,
          }));
      } else if (recipientType === "segment" && segmentId) {
        // Get customers in segment
        const members = await db
          .select()
          .from(segmentMembership)
          .where(eq(segmentMembership.segmentId, segmentId));

        const customers = await getServiceTitanCustomers();
        recipients = members
          .map(m => customers.find(c => c.id === m.customerId))
          .filter(c => c?.email)
          .map(c => ({
            email: c!.email,
            name: c!.name,
            customerId: c!.id,
          }));
      } else if (recipientType === "individual" && individualEmails) {
        // Parse individual emails
        const emails = individualEmails.split(",").map((e: string) => e.trim());
        recipients = emails.map((email: string) => ({
          email,
          name: "Customer",
        }));
      }

      // Filter out suppressed emails
      const suppressed = await db
        .select()
        .from(emailSuppressionList)
        .where(inArray(emailSuppressionList.email, recipients.map(r => r.email)));

      const suppressedEmails = new Set(suppressed.map(s => s.email));
      recipients = recipients.filter(r => !suppressedEmails.has(r.email));

      // Check email preferences (marketing opt-outs)
      const preferences = await db
        .select()
        .from(emailPreferences)
        .where(
          and(
            inArray(emailPreferences.email, recipients.map(r => r.email)),
            eq(emailPreferences.marketingOptOut, true)
          )
        );

      const optedOut = new Set(preferences.map(p => p.email));
      recipients = recipients.filter(r => !optedOut.has(r.email));

      console.log(`[Email API] Sending campaign to ${recipients.length} recipients`);

      // Send emails (or schedule for later)
      if (!scheduledFor) {
        // Send immediately
        let successCount = 0;
        let failCount = 0;

        for (const recipient of recipients) {
          try {
            // Personalize content
            const personalizedHtml = personalizeContent(htmlContent, recipient);
            const personalizedText = personalizeContent(textContent || "", recipient);

            // Send email
            const result = await sendMarketingEmail({
              to: recipient.email,
              subject,
              html: personalizedHtml,
              text: personalizedText,
              campaignId: campaign.id,
              tags: {
                campaign_id: campaign.id,
                recipient_name: recipient.name,
              },
            });

            // Log send
            await db.insert(emailSendLog).values({
              campaignId: campaign.id,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              serviceTitanCustomerId: recipient.customerId,
              messageId: result.id,
              status: "sent",
              sentAt: new Date(),
            });

            successCount++;
          } catch (error) {
            console.error(`[Email API] Failed to send to ${recipient.email}:`, error);
            failCount++;

            // Log failure
            await db.insert(emailSendLog).values({
              campaignId: campaign.id,
              recipientEmail: recipient.email,
              recipientName: recipient.name,
              serviceTitanCustomerId: recipient.customerId,
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Unknown error",
              sentAt: new Date(),
            });
          }
        }

        // Update campaign stats
        await db
          .update(emailCampaigns)
          .set({
            totalSent: successCount,
            totalFailed: failCount,
            status: "sent",
            sentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(emailCampaigns.id, campaign.id));

        res.json({
          success: true,
          campaignId: campaign.id,
          recipientCount: recipients.length,
          successCount,
          failCount,
        });
      } else {
        // Campaign is scheduled - will be sent by scheduler
        res.json({
          success: true,
          campaignId: campaign.id,
          recipientCount: recipients.length,
          scheduledFor,
          message: "Campaign scheduled successfully",
        });
      }
    } catch (error) {
      console.error("[Email API] Error sending campaign:", error);
      res.status(500).json({ error: "Failed to send campaign" });
    }
  });

  /**
   * GET /api/admin/email-stats
   * Get email marketing statistics
   */
  app.get("/api/admin/email-stats", requireAuth, async (req, res) => {
    try {
      // Get total contacts (customers with emails)
      const customers = await getServiceTitanCustomers();
      const totalContacts = customers.filter(c => c.email).length;

      // Get today's sends
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sentToday = await db
        .select({ count: sql<number>`count(*)` })
        .from(emailSendLog)
        .where(gte(emailSendLog.sentAt, today));

      // Calculate open and click rates (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentSends = await db
        .select()
        .from(emailSendLog)
        .where(gte(emailSendLog.sentAt, thirtyDaysAgo));

      const totalSent = recentSends.length;
      const totalOpened = recentSends.filter(s => s.openedAt).length;
      const totalClicked = recentSends.filter(s => s.clickedAt).length;

      const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
      const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0;

      res.json({
        totalContacts,
        sentToday: sentToday[0]?.count || 0,
        openRate,
        clickRate,
      });
    } catch (error) {
      console.error("[Email API] Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  /**
   * GET /api/admin/email-preferences/:email
   * Get email preferences for a specific email
   */
  app.get("/api/admin/email-preferences/:email", async (req, res) => {
    try {
      const { email } = req.params;

      const [preference] = await db
        .select()
        .from(emailPreferences)
        .where(eq(emailPreferences.email, email))
        .limit(1);

      if (!preference) {
        // Return default preferences if none exist
        return res.json({
          email,
          marketingOptOut: false,
          transactionalOptOut: false,
          frequency: "normal",
        });
      }

      res.json(preference);
    } catch (error) {
      console.error("[Email API] Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  /**
   * POST /api/admin/email-preferences
   * Update email preferences
   */
  app.post("/api/admin/email-preferences", async (req, res) => {
    try {
      const { email, marketingOptOut, transactionalOptOut, frequency } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const [preference] = await db
        .insert(emailPreferences)
        .values({
          email,
          marketingOptOut: marketingOptOut || false,
          transactionalOptOut: transactionalOptOut || false,
          frequency: frequency || "normal",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: emailPreferences.email,
          set: {
            marketingOptOut: marketingOptOut || false,
            transactionalOptOut: transactionalOptOut || false,
            frequency: frequency || "normal",
            updatedAt: new Date(),
          },
        })
        .returning();

      console.log(`[Email API] Updated preferences for ${email}`);
      res.json(preference);
    } catch (error) {
      console.error("[Email API] Error updating preferences:", error);
      res.status(500).json({ error: "Failed to update preferences" });
    }
  });

  /**
   * Helper Functions
   */
  function extractVariables(content: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  function personalizeContent(content: string, recipient: any): string {
    let personalized = content;
    
    // Replace common variables
    personalized = personalized.replace(/\{\{customerName\}\}/g, recipient.name || "Valued Customer");
    personalized = personalized.replace(/\{\{companyName\}\}/g, "Economy Plumbing Services");
    personalized = personalized.replace(/\{\{currentYear\}\}/g, new Date().getFullYear().toString());
    personalized = personalized.replace(/\{\{currentMonth\}\}/g, new Date().toLocaleString("default", { month: "long" }));
    personalized = personalized.replace(/\{\{email\}\}/g, recipient.email);
    
    return personalized;
  }
}