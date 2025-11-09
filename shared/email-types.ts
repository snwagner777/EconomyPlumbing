/**
 * Email Marketing System Types
 * 
 * Shared type definitions for email marketing campaigns (Review Request, Referral Nurture, Quote Follow-up).
 * These types represent API response shapes and DTOs, not direct database table schemas.
 */

/**
 * Email Template (stored in database, managed via Templates tab)
 */
export interface EmailTemplate {
  id: string;
  campaignType: string;  // 'review_request' | 'referral_nurture' | 'quote_followup'
  emailNumber: number;   // 1-4 for drip sequences
  subject: string;
  preheader: string | null;
  htmlContent: string;
  plainTextContent: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * System Settings (master switches and phone numbers for email campaigns)
 */
export interface SystemSettings {
  // Master switches
  reviewMasterEmailSwitch: boolean;          // Global enable/disable for all review/referral emails
  reviewDripEnabled: boolean;                 // Enable 4-email review request sequence
  referralDripEnabled: boolean;               // Enable 6-month referral nurture sequence
  autoSendReviewRequests: boolean;            // Auto-send review requests after job completion
  autoStartReferralCampaigns: boolean;        // Auto-enroll customers in referral nurture after positive review
  
  // Review Request campaign phone (UTM: utm_source=review_request)
  reviewRequestPhoneNumber: string;           // Raw number (e.g., "5125551234")
  reviewRequestPhoneFormatted: string;        // Formatted number (e.g., "(512) 555-1234")
  
  // Referral Nurture campaign phone (UTM: utm_source=referral_nurture)
  referralNurturePhoneNumber: string;
  referralNurturePhoneFormatted: string;
  
  // Quote Follow-up campaign phone (UTM: utm_source=quote_followup)
  quoteFollowupPhoneNumber: string;
  quoteFollowupPhoneFormatted: string;
}

/**
 * Review Request Campaign (4-email drip: Days 1, 3, 7, 21)
 */
export interface ReviewRequest {
  id: string;
  jobCompletionId: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: string;                    // 'queued' | 'sending' | 'paused' | 'completed' | 'stopped'
  stopReason?: string;
  email1SentAt?: string;
  email2SentAt?: string;
  email3SentAt?: string;
  email4SentAt?: string;
  reviewSubmitted: boolean;
  reviewSubmittedAt?: string;
  reviewRating?: number;             // 1-5 stars
  reviewPlatform?: string;           // 'Google' | 'Yelp' | 'Facebook'
  emailOpens: number;
  linkClicks: number;
  createdAt: string;
  completedAt?: string;
}

/**
 * Referral Nurture Campaign (6-month drip: Days 14, 60, 150, 210)
 */
export interface ReferralNurture {
  id: string;
  customerId: number;
  customerEmail: string;
  customerName: string;
  status: string;                    // 'queued' | 'sending' | 'paused' | 'completed'
  pauseReason?: string;
  email1SentAt?: string;
  email2SentAt?: string;
  email3SentAt?: string;
  email4SentAt?: string;
  consecutiveUnopened: number;       // Auto-pause after 2 consecutive unopened emails
  totalOpens: number;
  totalClicks: number;
  referralsSubmitted: number;
  lastReferralAt?: string;
  createdAt: string;
  pausedAt?: string;
  completedAt?: string;
}

/**
 * Dashboard Statistics (overview metrics for all campaigns)
 */
export interface ReviewRequestsDashboardStats {
  reviewRequests: {
    total: number;
    active: number;
    completed: number;
    reviewsSubmitted: number;
    averageRating: number;
    openRate: number;
    clickRate: number;
  };
  referralNurture: {
    total: number;
    active: number;
    completed: number;
    totalReferrals: number;
    openRate: number;
    clickRate: number;
  };
}

/**
 * Campaign Analytics (performance metrics by campaign type)
 */
export interface CampaignOverview {
  totalSent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface CampaignByType {
  campaignType: string;              // 'review_request' | 'referral_nurture' | 'quote_followup'
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface RecentEmail {
  id: string;
  campaignType: string;
  customerEmail: string;
  subject: string;
  sentAt: string;
  delivered: boolean;
  opened: boolean;
  clicked: boolean;
  bounced: boolean;
}

/**
 * AI Email Generation Request/Response
 */
export interface AIEmailGenerationRequest {
  campaignType: 'review_request' | 'referral_nurture' | 'quote_followup';
  emailNumber: 1 | 2 | 3 | 4;
  jobDetails: {
    customerId: number;
    customerName: string;
    serviceType: string;
    jobAmount: number;
    jobDate: Date;
    location: string;
  };
  phoneNumber: string;
  strategy?: 'value' | 'trust' | 'urgency' | 'social_proof';
}

export interface AIEmailGenerationResponse {
  subject: string;
  preheader: string;
  htmlContent: string;
  plainTextContent: string;
}
