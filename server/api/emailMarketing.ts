/**
 * Email Marketing API
 * 
 * TEMPORARILY DISABLED - will be rebuilt when marketing features are re-implemented
 */

import { Request, Response, Express } from "express";

/**
 * Email Marketing API Routes - TEMPORARILY DISABLED
 */
export function registerEmailMarketingRoutes(app: Express) {
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated?.()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // All email marketing endpoints temporarily return empty data
  // These will be rebuilt when marketing features are re-implemented

  app.get("/api/admin/email-templates", requireAuth, async (req, res) => {
    res.json([]);
  });

  app.post("/api/admin/email-templates", requireAuth, async (req, res) => {
    res.status(503).json({ 
      error: "Email marketing temporarily disabled",
      message: "This feature will be rebuilt soon" 
    });
  });

  app.get("/api/admin/email-campaigns", requireAuth, async (req, res) => {
    res.json([]);
  });

  app.post("/api/admin/email-campaigns", requireAuth, async (req, res) => {
    res.status(503).json({ 
      error: "Email marketing temporarily disabled",
      message: "This feature will be rebuilt soon" 
    });
  });

  app.get("/api/admin/email-stats", requireAuth, async (req, res) => {
    res.json({
      totalSent: 0,
      totalOpened: 0,
      totalClicked: 0,
      message: "Email marketing temporarily disabled"
    });
  });

  app.get("/api/admin/email-suppression", requireAuth, async (req, res) => {
    res.json([]);
  });

  app.post("/api/admin/email-suppression", requireAuth, async (req, res) => {
    res.status(503).json({ 
      error: "Email marketing temporarily disabled",
      message: "This feature will be rebuilt soon" 
    });
  });

  app.get("/api/admin/marketing-system-settings", requireAuth, async (req, res) => {
    res.json({
      email_master_switch: false,
      sms_master_switch: false,
      message: "Marketing system temporarily disabled"
    });
  });

  app.post("/api/admin/marketing-system-settings", requireAuth, async (req, res) => {
    res.status(503).json({ 
      error: "Marketing system temporarily disabled",
      message: "This feature will be rebuilt soon" 
    });
  });

  console.log("[Email Marketing API] Routes registered (temporarily disabled)");
}