/**
 * SMS Marketing API Routes
 * 
 * TEMPORARILY DISABLED - will be rebuilt when marketing features are re-implemented
 */

import type { Express } from "express";

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
  // All SMS marketing endpoints temporarily return empty data
  // These will be rebuilt when marketing features are re-implemented

  app.get("/api/sms/campaigns/suggestions", requireAuth, async (req, res) => {
    res.json({
      success: true,
      suggestions: [],
      message: "SMS marketing temporarily disabled"
    });
  });

  app.get("/api/sms/campaigns", requireAuth, async (req, res) => {
    res.json({
      success: true,
      campaigns: [],
      totalCount: 0,
      message: "SMS marketing temporarily disabled"
    });
  });

  app.post("/api/sms/campaigns", requireAuth, async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS marketing temporarily disabled",
      message: "This feature will be rebuilt soon"
    });
  });

  app.get("/api/sms/campaigns/:id", requireAuth, async (req, res) => {
    res.status(404).json({
      success: false,
      error: "Campaign not found",
      message: "SMS marketing temporarily disabled"
    });
  });

  app.patch("/api/sms/campaigns/:id", requireAuth, async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS marketing temporarily disabled",
      message: "This feature will be rebuilt soon"
    });
  });

  app.delete("/api/sms/campaigns/:id", requireAuth, async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS marketing temporarily disabled",
      message: "This feature will be rebuilt soon"
    });
  });

  app.get("/api/sms/subscribers", requireAuth, async (req, res) => {
    res.json({
      success: true,
      subscribers: [],
      totalCount: 0,
      activeCount: 0,
      message: "SMS marketing temporarily disabled"
    });
  });

  app.post("/api/sms/subscribers/opt-in", requireAuth, async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS marketing temporarily disabled",
      message: "This feature will be rebuilt soon"
    });
  });

  app.post("/api/sms/subscribers/:phone/opt-out", requireAuth, async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS marketing temporarily disabled", 
      message: "This feature will be rebuilt soon"
    });
  });

  app.get("/api/sms/keywords", requireAuth, async (req, res) => {
    res.json({
      success: true,
      keywords: [],
      message: "SMS keywords temporarily disabled"
    });
  });

  app.post("/api/sms/keywords", requireAuth, async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS keywords temporarily disabled",
      message: "This feature will be rebuilt soon"
    });
  });

  app.get("/api/sms/statistics", requireAuth, async (req, res) => {
    res.json({
      success: true,
      stats: {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        totalOptIns: 0,
        totalOptOuts: 0,
        totalCostCents: 0,
        avgSegmentCount: 0,
        recentActivity: []
      },
      message: "SMS statistics temporarily disabled"
    });
  });

  app.post("/api/sms/send-test", requireAuth, async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS test sending temporarily disabled",
      message: "This feature will be rebuilt soon"
    });
  });

  app.get("/api/sms/segments", requireAuth, async (req, res) => {
    res.json({
      success: true,
      segments: [],
      message: "SMS segments temporarily disabled"
    });
  });

  app.post("/api/sms/incoming-webhook", async (req, res) => {
    // Log the incoming SMS but don't process it
    console.log("[SMS API] Incoming SMS webhook (processing disabled):", req.body);
    res.sendStatus(200);
  });

  app.post("/api/public/sms-opt-in", async (req, res) => {
    res.status(503).json({
      success: false,
      error: "SMS opt-in temporarily disabled",
      message: "This feature will be rebuilt soon"
    });
  });

  console.log("[SMS Marketing API] Routes registered (temporarily disabled)");
}