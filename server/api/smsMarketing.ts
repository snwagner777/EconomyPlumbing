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

// Authentication middleware - ensures only authenticated admins can access
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated?.()) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  next();
}

export function registerSMSMarketingRoutes(app: Express) {
  // ==========================================
  // AI CAMPAIGN SUGGESTIONS
  // ==========================================

  /**
   * GET /api/sms/campaigns/suggestions
   * Get AI-generated SMS campaign suggestions
   * PROTECTED: Admin only
   */
  app.get("/api/sms/campaigns/suggestions", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.get("/api/sms/campaigns/seasonal", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.post("/api/sms/campaigns/generate-copy", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.post("/api/sms/campaigns/multi-channel-strategy", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.get("/api/sms/campaigns", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.get("/api/sms/campaigns/:id", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.post("/api/sms/campaigns", requireAuth, async (req, res) => {
    try {
      const { trackingNumber, ...campaignData }: InsertSMSCampaign & { trackingNumber?: string } = req.body;

      const [campaign] = await db
        .insert(smsCampaigns)
        .values({
          ...campaignData,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // If tracking number is provided, create a tracking entry with UTM parameters
      if (trackingNumber) {
        const cleanNumber = trackingNumber.replace(/\D/g, '');
        
        // Determine if number already has country code
        let normalizedNumber = cleanNumber;
        let displayNumber = trackingNumber;
        
        if (cleanNumber.length === 11 && cleanNumber.startsWith('1')) {
          // Number already includes US country code
          normalizedNumber = cleanNumber.slice(1); // Remove leading 1 for display formatting
          displayNumber = `(${normalizedNumber.slice(0, 3)}) ${normalizedNumber.slice(3, 6)}-${normalizedNumber.slice(6)}`;
        } else if (cleanNumber.length === 10) {
          // Standard 10-digit US number
          normalizedNumber = cleanNumber;
          displayNumber = `(${normalizedNumber.slice(0, 3)}) ${normalizedNumber.slice(3, 6)}-${normalizedNumber.slice(6)}`;
        }
        // Otherwise keep the original format (for international numbers or non-standard formats)
        
        // Create tel link - add +1 only if not already present
        const telLink = cleanNumber.length === 10 
          ? `tel:+1${cleanNumber}`
          : cleanNumber.length === 11 && cleanNumber.startsWith('1')
          ? `tel:+${cleanNumber}`
          : `tel:${cleanNumber}`;
        
        // Create channel key and UTM parameters based on campaign
        const campaignSlug = campaign.name.toLowerCase().replace(/\s+/g, '-');
        const channelKey = `sms-${campaignSlug}`;
        const channelName = `SMS Campaign: ${campaign.name}`;
        
        // Create detection rules with UTM parameters
        const detectionRules = {
          urlParams: {
            utm_source: ['sms'],
            utm_campaign: [campaignSlug],
            utm_medium: ['sms', 'text']
          },
          referrerIncludes: [],
          userAgentIncludes: []
        };

        // Check if tracking number entry already exists for this channel
        const existingTracking = await db
          .select()
          .from(trackingNumbers)
          .where(eq(trackingNumbers.channelKey, channelKey))
          .limit(1);

        if (existingTracking.length > 0) {
          // Update existing tracking number
          await db
            .update(trackingNumbers)
            .set({
              displayNumber,
              rawNumber: cleanNumber,
              telLink,
              detectionRules: JSON.stringify(detectionRules),
              isActive: true,
              updatedAt: new Date(),
            })
            .where(eq(trackingNumbers.channelKey, channelKey));
          
          console.log(`[SMS API] Updated existing tracking number for channel: ${channelKey}`);
        } else {
          // Create new tracking number entry
          await db.insert(trackingNumbers).values({
            channelKey,
            channelName,
            displayNumber,
            rawNumber: cleanNumber,
            telLink,
            detectionRules: JSON.stringify(detectionRules),
            isActive: true,
            isDefault: false,
            sortOrder: 200, // Give SMS campaigns a higher sort order than email
          });
          
          console.log(`[SMS API] Created new tracking number for channel: ${channelKey}`);
        }
      }

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
   * PROTECTED: Admin only
   */
  app.patch("/api/sms/campaigns/:id", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.post("/api/sms/campaigns/:id/messages", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.delete("/api/sms/campaigns/:id", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.get("/api/sms/subscribers", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.get("/api/sms/subscribers/:phoneNumber", requireAuth, async (req, res) => {
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
   * PUBLIC: Required for public opt-in forms
   */
  app.post("/api/sms/opt-in", async (req, res) => {
    try {
      const {
        phoneNumber,
        customerName,
        email,
        customerId,
        source = 'web_form'
      } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
      }

      // Capture real client IP address for TCPA compliance audit trail
      const clientIP = req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() 
        || req.headers['x-real-ip']?.toString()
        || req.connection?.remoteAddress 
        || req.socket?.remoteAddress
        || 'unknown';

      console.log(`[SMS Opt-In] Phone: ${phoneNumber}, IP: ${clientIP}, Source: ${source}`);

      await smsService.optIn(
        phoneNumber,
        source,
        customerId,
        customerName,
        email,
        clientIP
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
   * PUBLIC: Required for public opt-out requests
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
   * PROTECTED: Admin only
   */
  app.get("/api/sms/keywords", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.post("/api/sms/keywords", requireAuth, async (req, res) => {
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
  // SMS MASTER SWITCH
  // ==========================================

  /**
   * GET /api/sms/settings/master-switch
   * Get master SMS switch status
   * PROTECTED: Admin only
   */
  app.get("/api/sms/settings/master-switch", requireAuth, async (req, res) => {
    try {
      const { marketingSystemSettings } = await import("@shared/schema");
      
      const [setting] = await db
        .select()
        .from(marketingSystemSettings)
        .where(eq(marketingSystemSettings.settingKey, 'sms_master_switch_enabled'))
        .limit(1);

      res.json({
        success: true,
        enabled: setting?.settingValue === 'true' || false
      });
    } catch (error) {
      console.error('[SMS API] Error fetching master switch:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch master switch status'
      });
    }
  });

  /**
   * PUT /api/sms/settings/master-switch
   * Update master SMS switch status
   * PROTECTED: Admin only
   */
  app.put("/api/sms/settings/master-switch", requireAuth, async (req, res) => {
    try {
      const { enabled } = req.body;
      
      // Validate that enabled is a boolean
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Invalid request: enabled must be a boolean value'
        });
      }
      
      const { marketingSystemSettings } = await import("@shared/schema");
      
      // Upsert the setting - store as 'true' or 'false' string
      await db
        .insert(marketingSystemSettings)
        .values({
          settingKey: 'sms_master_switch_enabled',
          settingValue: enabled ? 'true' : 'false',
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: marketingSystemSettings.settingKey,
          set: {
            settingValue: enabled ? 'true' : 'false',
            updatedAt: new Date()
          }
        });

      console.log(`[SMS API] Master switch ${enabled ? 'enabled' : 'disabled'}`);

      res.json({
        success: true,
        enabled: enabled
      });
    } catch (error) {
      console.error('[SMS API] Error updating master switch:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update master switch'
      });
    }
  });

  // ==========================================
  /**
   * POST /api/sms/send-referral-requests
   * Send referral request SMS to happy customers (5-star reviews)
   * PROTECTED: Admin only
   */
  app.post("/api/sms/send-referral-requests", requireAuth, async (req, res) => {
    try {
      // Validate request body
      const { z } = await import('zod');
      const requestSchema = z.object({
        minRating: z.number().min(1).max(5).optional().default(5),
        limit: z.number().min(1).max(200).optional().default(50)
      });

      const validated = requestSchema.parse(req.body);
      const { minRating, limit } = validated;

      // Import reviews table
      const { reviews } = await import("@shared/schema");
      
      // Find customers who left high-rating reviews and have phone numbers
      const highRatingReviews = await db
        .select()
        .from(reviews as any)
        .where(
          and(
            gte(reviews.rating, minRating),
            sql`${reviews.phone} IS NOT NULL AND ${reviews.phone} != ''`,
            eq(reviews.status, 'approved')
          )
        )
        .orderBy(desc(reviews.submittedAt))
        .limit(limit);

      console.log(`[SMS Referral] Found ${highRatingReviews.length} eligible customers for referral requests`);

      // Check which customers are already subscribed to SMS
      const subscribedPhones = await db
        .select()
        .from(smsMarketingPreferences)
        .where(
          and(
            eq(smsMarketingPreferences.optedIn, true),
            inArray(
              smsMarketingPreferences.phoneNumber, 
              highRatingReviews.map(r => r.phone!).filter(Boolean)
            )
          )
        );

      const subscribedPhoneSet = new Set(subscribedPhones.map(p => p.phoneNumber));

      // Get base URL from environment
      const baseUrl = process.env.BASE_URL || process.env.REPLIT_DEV_DOMAIN || 'http://localhost:5000';

      // Generate referral message (no emojis per guidelines)
      const referralMessage = `Hi {customerName}! Thank you for your 5-star review! Would you refer us to friends/family? You'll both get $25 when they complete a job. Share now: ${baseUrl}/refer-a-friend

Reply STOP to opt out.`;

      // Send SMS only to subscribed customers
      let sentCount = 0;
      const errors: string[] = [];

      for (const review of highRatingReviews) {
        if (!review.phone || !subscribedPhoneSet.has(review.phone)) {
          continue; // Skip if not subscribed
        }

        try {
          const personalizedMessage = referralMessage.replace('{customerName}', review.customerName.split(' ')[0]);
          
          const { sendSMS } = await import('../lib/sms');
          await sendSMS({
            to: review.phone,
            message: personalizedMessage,
            campaignId: null, // One-off message, not part of a campaign
          });

          sentCount++;
          console.log(`[SMS Referral] Sent referral request to ${review.customerName}`);
        } catch (error: any) {
          console.error(`[SMS Referral] Failed to send to ${review.phone}:`, error);
          errors.push(`${review.customerName}: ${error.message}`);
        }
      }

      res.json({
        success: true,
        message: `Sent ${sentCount} referral request SMS messages`,
        details: {
          eligible: highRatingReviews.length,
          subscribed: subscribedPhones.length,
          sent: sentCount,
          errors: errors.length > 0 ? errors : undefined
        }
      });
    } catch (error) {
      console.error('[SMS API] Error sending referral requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send referral requests'
      });
    }
  });

  // SMS ANALYTICS
  // ==========================================

  /**
   * GET /api/sms/analytics/dashboard
   * Get SMS marketing dashboard analytics
   * PROTECTED: Admin only
   */
  app.get("/api/sms/analytics/dashboard", requireAuth, async (req, res) => {
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
   * PROTECTED: Admin only
   */
  app.get("/api/sms/analytics/send-time", requireAuth, async (req, res) => {
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
