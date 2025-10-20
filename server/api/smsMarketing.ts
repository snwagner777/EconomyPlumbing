/**
 * SMS Marketing API Routes
 * Handles SMS campaigns, subscribers, AI suggestions, opt-in/opt-out, and analytics
 */

import type { Express } from "express";
import { db } from "../db";
import {
  smsCampaigns,
  smsCampaignMessages,
  smsMarketingPreferences,
  smsSendLog,
  smsKeywords,
  customerSegments,
  segmentMembership,
  type InsertSMSCampaign,
  type InsertSMSCampaignMessage,
  type InsertSMSMarketingPreferences,
  type InsertSMSKeyword
} from "@shared/schema";
import { eq, and, desc, gte, sql, inArray } from "drizzle-orm";
import { aiSMSCampaignGenerator } from "../lib/aiSMSCampaign";
import { smsService } from "../lib/smsService";

export function registerSMSMarketingRoutes(app: Express) {
  // ==========================================
  // AI CAMPAIGN SUGGESTIONS
  // ==========================================

  /**
   * GET /api/sms/campaigns/suggestions
   * Get AI-generated SMS campaign suggestions
   */
  app.get("/api/sms/campaigns/suggestions", async (req, res) => {
    try {
      const {
        goal = 'conversion',
        segmentId,
        offerType,
        count = 3
      } = req.query;

      let targetSegment = undefined;
      if (segmentId && typeof segmentId === 'string') {
        const [segment] = await db
          .select()
          .from(customerSegments)
          .where(eq(customerSegments.id, segmentId))
          .limit(1);
        targetSegment = segment;
      }

      const suggestions = await aiSMSCampaignGenerator.generateCampaignSuggestions({
        businessType: 'plumbing',
        campaignGoal: goal as any,
        targetSegment,
        offerType: offerType as any
      }, parseInt(count as string));

      res.json({
        success: true,
        suggestions
      });
    } catch (error) {
      console.error('[SMS API] Error generating suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate campaign suggestions'
      });
    }
  });

  /**
   * GET /api/sms/campaigns/seasonal
   * Get seasonal SMS campaign recommendations
   */
  app.get("/api/sms/campaigns/seasonal", async (req, res) => {
    try {
      const campaigns = await aiSMSCampaignGenerator.getSeasonalCampaigns();

      res.json({
        success: true,
        campaigns
      });
    } catch (error) {
      console.error('[SMS API] Error getting seasonal campaigns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get seasonal campaigns'
      });
    }
  });

  /**
   * POST /api/sms/campaigns/generate-copy
   * Generate AI-optimized SMS copy
   */
  app.post("/api/sms/campaigns/generate-copy", async (req, res) => {
    try {
      const { campaignType, targetAudience, offerDetails, tone, maxLength } = req.body;

      const smsCopy = await aiSMSCampaignGenerator.generateSMSCopy({
        campaignType,
        targetAudience,
        offerDetails,
        tone: tone || 'friendly',
        maxLength: maxLength || 160
      });

      res.json({
        success: true,
        smsCopy,
        characterCount: smsCopy.length,
        segmentCount: Math.ceil(smsCopy.length / 160)
      });
    } catch (error) {
      console.error('[SMS API] Error generating SMS copy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate SMS copy'
      });
    }
  });

  /**
   * POST /api/sms/campaigns/multi-channel-strategy
   * Get multi-channel strategy (email + SMS coordination)
   */
  app.post("/api/sms/campaigns/multi-channel-strategy", async (req, res) => {
    try {
      const { campaignGoal, segmentId, offerType } = req.body;

      let targetSegment = undefined;
      if (segmentId) {
        const [segment] = await db
          .select()
          .from(customerSegments)
          .where(eq(customerSegments.id, segmentId))
          .limit(1);
        targetSegment = segment;
      }

      const strategy = await aiSMSCampaignGenerator.createMultiChannelStrategy({
        campaignGoal,
        targetSegment,
        offerType
      });

      res.json({
        success: true,
        strategy
      });
    } catch (error) {
      console.error('[SMS API] Error creating multi-channel strategy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create multi-channel strategy'
      });
    }
  });

  // ==========================================
  // SMS CAMPAIGNS
  // ==========================================

  /**
   * GET /api/sms/campaigns
   * Get all SMS campaigns
   */
  app.get("/api/sms/campaigns", async (req, res) => {
    try {
      const { status, type, limit = 50 } = req.query;

      let query = db.select().from(smsCampaigns);

      if (status) {
        query = query.where(eq(smsCampaigns.status, status as string)) as any;
      }
      if (type) {
        query = query.where(eq(smsCampaigns.campaignType, type as string)) as any;
      }

      const campaigns = await query
        .orderBy(desc(smsCampaigns.createdAt))
        .limit(parseInt(limit as string));

      res.json({
        success: true,
        campaigns
      });
    } catch (error) {
      console.error('[SMS API] Error fetching campaigns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch campaigns'
      });
    }
  });

  /**
   * GET /api/sms/campaigns/:id
   * Get single SMS campaign with messages
   */
  app.get("/api/sms/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [campaign] = await db
        .select()
        .from(smsCampaigns)
        .where(eq(smsCampaigns.id, id))
        .limit(1);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      const messages = await db
        .select()
        .from(smsCampaignMessages)
        .where(eq(smsCampaignMessages.campaignId, id))
        .orderBy(smsCampaignMessages.sequenceNumber);

      const stats = await smsService.getCampaignStats(id);

      res.json({
        success: true,
        campaign: {
          ...campaign,
          messages,
          stats
        }
      });
    } catch (error) {
      console.error('[SMS API] Error fetching campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch campaign'
      });
    }
  });

  /**
   * POST /api/sms/campaigns
   * Create new SMS campaign
   */
  app.post("/api/sms/campaigns", async (req, res) => {
    try {
      const campaignData: InsertSMSCampaign = req.body;

      const [campaign] = await db
        .insert(smsCampaigns)
        .values({
          ...campaignData,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        campaign
      });
    } catch (error) {
      console.error('[SMS API] Error creating campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create campaign'
      });
    }
  });

  /**
   * PATCH /api/sms/campaigns/:id
   * Update SMS campaign
   */
  app.patch("/api/sms/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const [updated] = await db
        .update(smsCampaigns)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(smsCampaigns.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      res.json({
        success: true,
        campaign: updated
      });
    } catch (error) {
      console.error('[SMS API] Error updating campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update campaign'
      });
    }
  });

  /**
   * POST /api/sms/campaigns/:id/messages
   * Add message to campaign
   */
  app.post("/api/sms/campaigns/:id/messages", async (req, res) => {
    try {
      const { id: campaignId } = req.params;
      const messageData: InsertSMSCampaignMessage = req.body;

      const characterCount = messageData.messageBody.length;
      const segmentCount = Math.ceil(characterCount / 160);

      const [message] = await db
        .insert(smsCampaignMessages)
        .values({
          ...messageData,
          campaignId,
          characterCount,
          segmentCount,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        message
      });
    } catch (error) {
      console.error('[SMS API] Error adding message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add message'
      });
    }
  });

  /**
   * DELETE /api/sms/campaigns/:id
   * Delete SMS campaign
   */
  app.delete("/api/sms/campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Delete messages first
      await db
        .delete(smsCampaignMessages)
        .where(eq(smsCampaignMessages.campaignId, id));

      // Delete campaign
      await db
        .delete(smsCampaigns)
        .where(eq(smsCampaigns.id, id));

      res.json({
        success: true
      });
    } catch (error) {
      console.error('[SMS API] Error deleting campaign:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete campaign'
      });
    }
  });

  // ==========================================
  // SMS SUBSCRIBERS / PREFERENCES
  // ==========================================

  /**
   * GET /api/sms/subscribers
   * Get all SMS subscribers
   */
  app.get("/api/sms/subscribers", async (req, res) => {
    try {
      const { optedIn, optedOut, limit = 100 } = req.query;

      let query = db.select().from(smsMarketingPreferences);

      if (optedIn !== undefined) {
        query = query.where(eq(smsMarketingPreferences.optedIn, optedIn === 'true')) as any;
      }
      if (optedOut !== undefined) {
        query = query.where(eq(smsMarketingPreferences.optedOut, optedOut === 'true')) as any;
      }

      const subscribers = await query
        .orderBy(desc(smsMarketingPreferences.createdAt))
        .limit(parseInt(limit as string));

      const stats = {
        total: subscribers.length,
        optedIn: subscribers.filter(s => s.optedIn && !s.optedOut).length,
        optedOut: subscribers.filter(s => s.optedOut).length
      };

      res.json({
        success: true,
        subscribers,
        stats
      });
    } catch (error) {
      console.error('[SMS API] Error fetching subscribers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscribers'
      });
    }
  });

  /**
   * GET /api/sms/subscribers/:phoneNumber
   * Get subscriber by phone number
   */
  app.get("/api/sms/subscribers/:phoneNumber", async (req, res) => {
    try {
      const { phoneNumber } = req.params;

      const [subscriber] = await db
        .select()
        .from(smsMarketingPreferences)
        .where(eq(smsMarketingPreferences.phoneNumber, phoneNumber))
        .limit(1);

      if (!subscriber) {
        return res.status(404).json({
          success: false,
          error: 'Subscriber not found'
        });
      }

      res.json({
        success: true,
        subscriber
      });
    } catch (error) {
      console.error('[SMS API] Error fetching subscriber:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscriber'
      });
    }
  });

  /**
   * POST /api/sms/opt-in
   * Opt-in a phone number for SMS marketing
   */
  app.post("/api/sms/opt-in", async (req, res) => {
    try {
      const {
        phoneNumber,
        customerName,
        email,
        customerId,
        source = 'web_form',
        ipAddress
      } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      await smsService.optIn(
        phoneNumber,
        source,
        customerId,
        customerName,
        email,
        ipAddress
      );

      res.json({
        success: true,
        message: 'Successfully opted in for SMS marketing'
      });
    } catch (error) {
      console.error('[SMS API] Error opting in:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to opt in'
      });
    }
  });

  /**
   * POST /api/sms/opt-out
   * Opt-out a phone number from SMS marketing
   */
  app.post("/api/sms/opt-out", async (req, res) => {
    try {
      const { phoneNumber, method = 'web_form' } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      await smsService.optOut(phoneNumber, method);

      res.json({
        success: true,
        message: 'Successfully opted out of SMS marketing'
      });
    } catch (error) {
      console.error('[SMS API] Error opting out:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to opt out'
      });
    }
  });

  // ==========================================
  // SMS KEYWORDS
  // ==========================================

  /**
   * GET /api/sms/keywords
   * Get all SMS keywords
   */
  app.get("/api/sms/keywords", async (req, res) => {
    try {
      const keywords = await db
        .select()
        .from(smsKeywords)
        .orderBy(desc(smsKeywords.usageCount));

      res.json({
        success: true,
        keywords
      });
    } catch (error) {
      console.error('[SMS API] Error fetching keywords:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch keywords'
      });
    }
  });

  /**
   * POST /api/sms/keywords
   * Create new SMS keyword
   */
  app.post("/api/sms/keywords", async (req, res) => {
    try {
      const keywordData: InsertSMSKeyword = req.body;

      const [keyword] = await db
        .insert(smsKeywords)
        .values({
          ...keywordData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        keyword
      });
    } catch (error) {
      console.error('[SMS API] Error creating keyword:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create keyword'
      });
    }
  });

  // ==========================================
  // SMS ANALYTICS
  // ==========================================

  /**
   * GET /api/sms/analytics/dashboard
   * Get SMS marketing dashboard analytics
   */
  app.get("/api/sms/analytics/dashboard", async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const daysAgo = parseInt(days as string);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.setDate(cutoffDate.getDate() - daysAgo));

      // Get all subscribers
      const allSubscribers = await db.select().from(smsMarketingPreferences);

      // Get SMS logs for the period
      const smsLogs = await db
        .select()
        .from(smsSendLog)
        .where(gte(smsSendLog.sentAt, cutoffDate));

      // Calculate metrics
      const stats = {
        totalSubscribers: allSubscribers.length,
        activeSubscribers: allSubscribers.filter(s => s.optedIn && !s.optedOut).length,
        optedOut: allSubscribers.filter(s => s.optedOut).length,
        messagesSent: smsLogs.length,
        messagesDelivered: smsLogs.filter(l => l.twilioStatus === 'delivered').length,
        messagesFailed: smsLogs.filter(l => l.twilioStatus === 'failed').length,
        clicks: smsLogs.filter(l => l.linkClicked).length,
        conversions: smsLogs.filter(l => l.converted).length,
        totalCost: smsLogs.reduce((sum, l) => sum + (l.cost || 0), 0),
        deliveryRate: smsLogs.length > 0
          ? (smsLogs.filter(l => l.twilioStatus === 'delivered').length / smsLogs.length * 100).toFixed(2)
          : '0',
        clickRate: smsLogs.length > 0
          ? (smsLogs.filter(l => l.linkClicked).length / smsLogs.length * 100).toFixed(2)
          : '0',
        conversionRate: smsLogs.length > 0
          ? (smsLogs.filter(l => l.converted).length / smsLogs.length * 100).toFixed(2)
          : '0'
      };

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('[SMS API] Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch analytics'
      });
    }
  });

  /**
   * GET /api/sms/analytics/send-time
   * Get optimal send time analysis
   */
  app.get("/api/sms/analytics/send-time", async (req, res) => {
    try {
      const { segmentId } = req.query;

      const bestTime = await aiSMSCampaignGenerator.analyzeBestSendTime(
        segmentId as string | undefined
      );

      res.json({
        success: true,
        bestTime
      });
    } catch (error) {
      console.error('[SMS API] Error analyzing send time:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to analyze send time'
      });
    }
  });

  console.log('[SMS Marketing API] Routes registered successfully');
}
