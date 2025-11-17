import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, uniqueIndex, bigint, jsonb, serial, numeric, primaryKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// ENUMS
// ============================================================================

// Source tracking for dual-mode review request triggering (webhook + polling fallback)
export const reviewSource = pgEnum("review_source", ["webhook", "polling", "manual", "api"]);

// Legacy admin users (username/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// OAuth users table (for Replit Auth)
export const oauthUsers = pgTable("oauth_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table (for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Admin whitelist (approved emails for OAuth login)
export const adminWhitelist = pgTable("admin_whitelist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  addedAt: timestamp("added_at").defaultNow(),
  addedBy: varchar("added_by"), // Who whitelisted this email
  notes: text("notes"), // Optional notes about this admin
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  h1: text("h1"), // Custom H1 tag (optional, falls back to title if not set)
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author: text("author").notNull().default("Economy Plumbing"),
  publishDate: timestamp("publish_date").notNull().defaultNow(),
  category: text("category").notNull(),
  featuredImage: text("featured_image"), // WebP version for website
  jpegFeaturedImage: text("jpeg_featured_image"), // JPEG version for RSS/social media
  imageId: varchar("image_id"), // Links to companyCamPhotos
  focalPointX: integer("focal_point_x"), // AI-determined focal point X (0-100 percentage from left)
  focalPointY: integer("focal_point_y"), // AI-determined focal point Y (0-100 percentage from top)
  metaDescription: text("meta_description"),
  published: boolean("published").notNull().default(true),
  isScheduled: boolean("is_scheduled").notNull().default(false), // Auto-scheduled vs manual
  scheduledFor: timestamp("scheduled_for"), // Future publish date for scheduled posts
  generatedByAI: boolean("generated_by_ai").notNull().default(false), // Track AI-generated posts
}, (table) => ({
  publishDateIdx: index("blog_posts_publish_date_idx").on(table.publishDate),
  categoryIdx: index("blog_posts_category_idx").on(table.category),
  publishedIdx: index("blog_posts_published_idx").on(table.published),
  imageIdIdx: index("blog_posts_image_id_idx").on(table.imageId),
  scheduledIdx: index("blog_posts_scheduled_idx").on(table.isScheduled, table.scheduledFor),
}));

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cents
  category: text("category").notNull(), // 'membership' or 'product'
  sku: text("sku"), // Product SKU for Zapier/ServiceTitan integration
  image: text("image"),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  features: text("features").array(),
  active: boolean("active").notNull().default(true),
  
  // ServiceTitan integration fields (for memberships)
  serviceTitanMembershipTypeId: text("service_titan_membership_type_id"), // Maps product to ST membership type
  durationBillingId: text("duration_billing_id"), // ServiceTitan duration/billing ID for membership
  serviceTitanEnabled: boolean("service_titan_enabled").notNull().default(false), // Enable ST sync for this product
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.category),
  activeIdx: index("products_active_idx").on(table.active),
}));

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  service: text("service"),
  location: text("location"),
  urgency: text("urgency"),
  message: text("message"),
  pageContext: text("page_context"),
  smsConsent: boolean("sms_consent").notNull().default(false), // A2P compliance
  emailConsent: boolean("email_consent").notNull().default(false), // CAN-SPAM compliance
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
}, (table) => ({
  submittedAtIdx: index("contact_submissions_submitted_at_idx").on(table.submittedAt),
  smsConsentIdx: index("contact_submissions_sms_consent_idx").on(table.smsConsent),
  emailConsentIdx: index("contact_submissions_email_consent_idx").on(table.emailConsent),
}));

// Referral code mapping (code → customer ID)
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // e.g., "JOHN-SMITH"
  customerId: integer("customer_id").notNull(), // ServiceTitan customer ID
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("referral_codes_code_idx").on(table.code),
  customerIdIdx: index("referral_codes_customer_id_idx").on(table.customerId),
}));

// Referral tracking system
// Chatbot conversations
export const chatbotConversations = pgTable("chatbot_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(), // Browser session ID
  customerEmail: varchar("customer_email"),
  customerPhone: varchar("customer_phone"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  pageContext: varchar("page_context"), // Which page they started on
  handoffRequested: boolean("handoff_requested").notNull().default(false),
  handoffReason: text("handoff_reason"),
  emailSent: boolean("email_sent").notNull().default(false),
  archived: boolean("archived").notNull().default(false),
  notes: text("notes"), // Admin notes
  rating: integer("rating"), // 1-5 star rating
  feedbackPositive: integer("feedback_positive").notNull().default(0), // Count of thumbs up
  feedbackNegative: integer("feedback_negative").notNull().default(0), // Count of thumbs down
}, (table) => ({
  sessionIdIdx: index("chatbot_conversations_session_id_idx").on(table.sessionId),
  startedAtIdx: index("chatbot_conversations_started_at_idx").on(table.startedAt),
  handoffIdx: index("chatbot_conversations_handoff_idx").on(table.handoffRequested),
  archivedIdx: index("chatbot_conversations_archived_idx").on(table.archived),
}));

// Individual messages within a conversation
export const chatbotMessages = pgTable("chatbot_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatbotConversations.id, { onDelete: "cascade" }),
  role: varchar("role").notNull(), // 'user', 'assistant', 'system'
  content: text("content").notNull(),
  imageUrl: text("image_url"), // For uploaded images
  feedback: varchar("feedback"), // 'positive' or 'negative'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  conversationIdIdx: index("chatbot_messages_conversation_id_idx").on(table.conversationId),
  createdAtIdx: index("chatbot_messages_created_at_idx").on(table.createdAt),
}));

// Chatbot analytics and common questions
export const chatbotAnalytics = pgTable("chatbot_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  category: varchar("category"), // 'pricing', 'emergency', 'scheduling', etc.
  count: integer("count").notNull().default(1),
  lastAsked: timestamp("last_asked").notNull().defaultNow(),
  suggestedAnswer: text("suggested_answer"), // Admin-provided answer
  isCommon: boolean("is_common").notNull().default(false),
}, (table) => ({
  categoryIdx: index("chatbot_analytics_category_idx").on(table.category),
  countIdx: index("chatbot_analytics_count_idx").on(table.count),
  isCommonIdx: index("chatbot_analytics_is_common_idx").on(table.isCommon),
}));

// Quick response templates for the chatbot
export const chatbotQuickResponses = pgTable("chatbot_quick_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: varchar("label").notNull(), // Button text
  message: text("message").notNull(), // What to send when clicked
  category: varchar("category"), // 'greeting', 'emergency', 'pricing', etc.
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  icon: varchar("icon"), // Lucide icon name
}, (table) => ({
  categoryIdx: index("chatbot_quick_responses_category_idx").on(table.category),
  activeIdx: index("chatbot_quick_responses_active_idx").on(table.active),
  sortOrderIdx: index("chatbot_quick_responses_sort_order_idx").on(table.sortOrder),
}));

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Referrer info (existing customer)
  referralCode: text("referral_code"), // The code used (e.g., "JOHN-SMITH") - links to referralCodes table
  referrerName: text("referrer_name").notNull(),
  referrerPhone: text("referrer_phone"), // Nullable - either phone OR email required (validated in form)
  referrerEmail: text("referrer_email"), // Nullable - either phone OR email required (validated in form)
  referrerCustomerId: integer("referrer_customer_id"), // ServiceTitan customer ID (null if not found yet)
  
  // Referee info (person being referred)
  refereeName: text("referee_name").notNull(),
  refereePhone: text("referee_phone"), // Nullable - either phone OR email required (validated in form)
  refereeEmail: text("referee_email"), // Nullable - either phone OR email required (validated in form)
  refereeCustomerId: integer("referee_customer_id"), // ServiceTitan customer ID (null until they become a customer)
  
  // Status tracking
  status: text("status").notNull().default('pending'), // 'pending', 'contacted', 'job_completed', 'credited'
  creditAmount: integer("credit_amount").notNull().default(2500), // Amount in cents ($25.00)
  
  // Job completion tracking
  firstJobId: text("first_job_id"), // ServiceTitan job ID when referee completes first job
  firstJobDate: timestamp("first_job_date"), // Date when referee completed first job
  firstJobAmount: integer("first_job_amount"), // Job amount in cents
  
  // Credit tracking
  creditedAt: timestamp("credited_at"), // When credit was applied to referrer's account
  creditedBy: varchar("credited_by"), // Admin user who applied the credit
  creditNotes: text("credit_notes"), // Notes about credit application
  expiresAt: timestamp("expires_at"), // When credit expires (creditedAt + 180 days)
  
  // Timestamps
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  contactedAt: timestamp("contacted_at"), // When business contacted the referee
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  referrerCustomerIdIdx: index("referrals_referrer_customer_id_idx").on(table.referrerCustomerId),
  refereeCustomerIdIdx: index("referrals_referee_customer_id_idx").on(table.refereeCustomerId),
  statusIdx: index("referrals_status_idx").on(table.status),
  submittedAtIdx: index("referrals_submitted_at_idx").on(table.submittedAt),
}));

// Referral credit usage tracking
// Tracks when customers use their referral credits on jobs
export const referralCreditUsage = pgTable("referral_credit_usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: integer("customer_id").notNull(), // ServiceTitan customer ID
  jobId: text("job_id").notNull(), // ServiceTitan job ID where credit was used
  jobNumber: text("job_number").notNull(), // Human-readable job number
  amountUsed: integer("amount_used").notNull(), // Amount in cents
  usedAt: timestamp("used_at").notNull(), // When the credit was used (job completion date)
  processedAt: timestamp("processed_at").notNull().defaultNow(), // When we detected and logged this usage
}, (table) => ({
  customerIdIdx: index("referral_credit_usage_customer_id_idx").on(table.customerId),
  jobIdIdx: uniqueIndex("referral_credit_usage_job_id_idx").on(table.jobId), // Prevent duplicate processing
  usedAtIdx: index("referral_credit_usage_used_at_idx").on(table.usedAt),
}));

// Vouchers - QR code-based discount system for referrals
// Replaces complex ServiceTitan job tracking with simple tech-scannable vouchers
export const vouchers = pgTable("vouchers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Voucher details
  code: text("code").notNull().unique(), // Human-readable code (e.g., "REF-A1B2C3D4")
  qrCode: text("qr_code").notNull(), // Base64-encoded QR code image
  
  // Value and restrictions
  discountAmount: integer("discount_amount").notNull(), // Amount in cents ($25 = 2500)
  minimumJobAmount: integer("minimum_job_amount").notNull().default(20000), // $200 minimum
  voucherType: text("voucher_type").notNull(), // 'referral_new_customer', 'referral_reward', 'promotional'
  
  // Customer info
  customerId: integer("customer_id"), // ServiceTitan customer ID (null if not created yet)
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  
  // Referral tracking (if this is a referral voucher)
  referralId: varchar("referral_id"), // Links to referrals table if applicable
  referrerCustomerId: integer("referrer_customer_id"), // Who referred this customer (for reward tracking)
  
  // Status tracking
  status: text("status").notNull().default('active'), // 'active', 'redeemed', 'expired', 'cancelled'
  
  // Redemption tracking
  redeemedAt: timestamp("redeemed_at"),
  redeemedBy: text("redeemed_by"), // Tech name/email who scanned it
  redeemedJobId: text("redeemed_job_id"), // ServiceTitan job ID where used
  redeemedJobNumber: text("redeemed_job_number"),
  redeemedJobAmount: integer("redeemed_job_amount"), // Actual job amount in cents
  
  // Expiration
  expiresAt: timestamp("expires_at").notNull(), // Auto-set to createdAt + 6 months
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  codeIdx: uniqueIndex("vouchers_code_idx").on(table.code),
  customerIdIdx: index("vouchers_customer_id_idx").on(table.customerId),
  statusIdx: index("vouchers_status_idx").on(table.status),
  expiresAtIdx: index("vouchers_expires_at_idx").on(table.expiresAt),
  referralIdIdx: index("vouchers_referral_id_idx").on(table.referralId),
  referrerCustomerIdIdx: index("vouchers_referrer_customer_id_idx").on(table.referrerCustomerId),
}));

// Referee welcome emails - sent immediately when someone is referred
export const refereeWelcomeEmails = pgTable("referee_welcome_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Links to referral
  referralId: varchar("referral_id").notNull(),
  
  // Referee info (who receives the email)
  refereeName: text("referee_name").notNull(),
  refereeEmail: text("referee_email").notNull(),
  referrerName: text("referrer_name").notNull(), // Name of person who referred them
  
  // Email content and tracking
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainTextContent: text("plain_text_content").notNull(),
  
  // Status
  status: text("status").notNull().default('queued'), // 'queued', 'sent', 'failed'
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  
  // Engagement tracking
  emailOpens: integer("email_opens").notNull().default(0),
  linkClicks: integer("link_clicks").notNull().default(0),
  
  // AI generation metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(true),
  aiPrompt: text("ai_prompt"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  referralIdIdx: index("referee_welcome_emails_referral_id_idx").on(table.referralId),
  statusIdx: index("referee_welcome_emails_status_idx").on(table.status),
  sentAtIdx: index("referee_welcome_emails_sent_at_idx").on(table.sentAt),
  refereeEmailIdx: index("referee_welcome_emails_referee_email_idx").on(table.refereeEmail),
}));

// Referrer thank you emails - sent when someone submits a referral
export const referrerThankYouEmails = pgTable("referrer_thank_you_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Links to referral
  referralId: varchar("referral_id").notNull(),
  
  // Referrer info (who receives the email)
  referrerName: text("referrer_name").notNull(),
  referrerEmail: text("referrer_email").notNull(),
  referrerCustomerId: integer("referrer_customer_id").notNull(),
  refereeName: text("referee_name").notNull(), // Who they referred
  
  // Email content and tracking
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainTextContent: text("plain_text_content").notNull(),
  
  // Status
  status: text("status").notNull().default('queued'), // 'queued', 'approved', 'sent', 'failed'
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"), // Admin who approved
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  
  // Engagement tracking
  emailOpens: integer("email_opens").notNull().default(0),
  linkClicks: integer("link_clicks").notNull().default(0),
  
  // AI generation metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(true),
  aiPrompt: text("ai_prompt"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  referralIdIdx: index("referrer_thank_you_emails_referral_id_idx").on(table.referralId),
  statusIdx: index("referrer_thank_you_emails_status_idx").on(table.status),
  sentAtIdx: index("referrer_thank_you_emails_sent_at_idx").on(table.sentAt),
  referrerEmailIdx: index("referrer_thank_you_emails_referrer_email_idx").on(table.referrerEmail),
  referrerCustomerIdIdx: index("referrer_thank_you_emails_referrer_customer_id_idx").on(table.referrerCustomerId),
}));

// Referrer success notification emails - sent when referred customer completes first job
export const referrerSuccessEmails = pgTable("referrer_success_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Links to referral
  referralId: varchar("referral_id").notNull(),
  
  // Referrer info (who receives the email)
  referrerName: text("referrer_name").notNull(),
  referrerEmail: text("referrer_email").notNull(),
  referrerCustomerId: integer("referrer_customer_id").notNull(),
  refereeName: text("referee_name").notNull(), // Who completed the job
  
  // Credit details
  creditAmount: integer("credit_amount").notNull(), // Amount in cents ($25 = 2500)
  creditExpiresAt: timestamp("credit_expires_at").notNull(),
  currentBalance: integer("current_balance"), // Total available credits in cents
  
  // Email content and tracking
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainTextContent: text("plain_text_content").notNull(),
  
  // Status
  status: text("status").notNull().default('queued'), // 'queued', 'approved', 'sent', 'failed'
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by"), // Admin who approved
  sentAt: timestamp("sent_at"),
  failureReason: text("failure_reason"),
  
  // Engagement tracking
  emailOpens: integer("email_opens").notNull().default(0),
  linkClicks: integer("link_clicks").notNull().default(0),
  
  // AI generation metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(true),
  aiPrompt: text("ai_prompt"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  referralIdIdx: index("referrer_success_emails_referral_id_idx").on(table.referralId),
  statusIdx: index("referrer_success_emails_status_idx").on(table.status),
  sentAtIdx: index("referrer_success_emails_sent_at_idx").on(table.sentAt),
  referrerEmailIdx: index("referrer_success_emails_referrer_email_idx").on(table.referrerEmail),
  referrerCustomerIdIdx: index("referrer_success_emails_referrer_customer_id_idx").on(table.referrerCustomerId),
}));

// Email Preferences - Granular opt-out controls for customers
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Customer identification (email is primary lookup)
  email: text("email").notNull().unique(),
  customerId: integer("customer_id"), // ServiceTitan customer ID (if known)
  
  // Granular opt-out preferences
  marketingEmails: boolean("marketing_emails").notNull().default(true), // Newsletters, promotions, segments
  reviewRequests: boolean("review_requests").notNull().default(true), // Review request drip campaigns
  referralEmails: boolean("referral_emails").notNull().default(true), // Referral nurture, referee welcome
  serviceReminders: boolean("service_reminders").notNull().default(true), // Maintenance reminders, follow-ups
  transactionalOnly: boolean("transactional_only").notNull().default(false), // Receipts, confirmations only
  
  // Unsubscribe token for secure one-click unsubscribe
  unsubscribeToken: text("unsubscribe_token").notNull().unique(),
  
  // Tracking
  optedOutAt: timestamp("opted_out_at"), // When they first opted out of anything
  fullyUnsubscribedAt: timestamp("fully_unsubscribed_at"), // When they opted out of everything
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("email_preferences_email_idx").on(table.email),
  customerIdIdx: index("email_preferences_customer_id_idx").on(table.customerId),
  tokenIdx: index("email_preferences_token_idx").on(table.unsubscribeToken),
}));

// Pending Referrals - Track contact info from referral landing page before job booking
export const pendingReferrals = pgTable("pending_referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Referrer info (from link)
  referrerCustomerId: integer("referrer_customer_id").notNull(), // ServiceTitan customer ID
  referrerName: text("referrer_name").notNull(),
  
  // Referee info (captured from landing page)
  refereeName: text("referee_name").notNull(),
  refereeEmail: text("referee_email"),
  refereePhone: text("referee_phone"),
  
  // Tracking
  trackingCookie: text("tracking_cookie").unique(), // 30-day cookie for backup tracking
  convertedToReferral: boolean("converted_to_referral").notNull().default(false),
  referralId: varchar("referral_id"), // Links to referrals table when they book
  
  // Timestamps
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
  convertedAt: timestamp("converted_at"), // When they actually booked/became customer
  expiresAt: timestamp("expires_at").notNull(), // capturedAt + 30 days
}, (table) => ({
  referrerIdIdx: index("pending_referrals_referrer_id_idx").on(table.referrerCustomerId),
  emailIdx: index("pending_referrals_email_idx").on(table.refereeEmail),
  phoneIdx: index("pending_referrals_phone_idx").on(table.refereePhone),
  cookieIdx: index("pending_referrals_cookie_idx").on(table.trackingCookie),
  convertedIdx: index("pending_referrals_converted_idx").on(table.convertedToReferral),
}));

// Conversion Events - Track key conversion actions on the website
export const conversionEvents = pgTable("conversion_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Event type
  eventType: text("event_type").notNull(), // 'scheduler_open', 'phone_click', 'form_submission'
  
  // Source information
  source: text("source"), // Where the event happened (page URL, email campaign, etc.)
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  
  // Additional context
  metadata: jsonb("metadata"), // Additional event data (form type, phone number clicked, etc.)
  
  // User identification (optional)
  customerId: integer("customer_id"), // ServiceTitan customer ID if known
  email: text("email"), // Email if provided
  
  // Timestamp
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  eventTypeIdx: index("conversion_events_event_type_idx").on(table.eventType),
  createdAtIdx: index("conversion_events_created_at_idx").on(table.createdAt),
  customerIdIdx: index("conversion_events_customer_id_idx").on(table.customerId),
}));

// =====================================================
// CUSTOM EMAIL CAMPAIGN SYSTEM (5 TABLES)
// Complete system for custom one-time blasts and drip campaigns
// AI-powered content generation, audience segmentation, tracking
// =====================================================

// Customer Segments - Target audiences for campaigns
export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Segment identification
  name: text("name").notNull().unique(), // "VIP Customers", "Recent Water Heater Installs", etc.
  description: text("description").notNull(),
  
  // Segment type
  segmentType: text("segment_type").notNull(), // 'static' (manual), 'dynamic' (auto-updated), 'ai_generated'
  
  // Criteria for segment membership
  targetCriteria: jsonb("target_criteria").notNull(), // {minLifetimeValue: 5000, lastServiceWithin: 180, tags: ['VIP']}
  
  // AI-generated segments
  generatedByAi: boolean("generated_by_ai").notNull().default(false),
  aiPrompt: text("ai_prompt"), // "Customers who spent >$5000 in last 6 months"
  aiReasoning: text("ai_reasoning"), // AI's explanation of the criteria
  aiCriteria: jsonb("ai_criteria"), // Parsed criteria from AI
  
  // Status
  status: text("status").notNull().default('active'), // 'active', 'archived'
  
  // Statistics
  memberCount: integer("member_count").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0),
  totalJobsBooked: integer("total_jobs_booked").notNull().default(0),
  
  // Auto-management flags
  autoEntryEnabled: boolean("auto_entry_enabled").notNull().default(true), // Automatically add matching customers
  autoExitEnabled: boolean("auto_exit_enabled").notNull().default(true), // Automatically remove non-matching customers
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastRefreshedAt: timestamp("last_refreshed_at"), // When dynamic segment was last recalculated
}, (table) => ({
  nameIdx: index("customer_segments_name_idx").on(table.name),
  typeIdx: index("customer_segments_type_idx").on(table.segmentType),
  statusIdx: index("customer_segments_status_idx").on(table.status),
  aiIdx: index("customer_segments_ai_idx").on(table.generatedByAi),
}));

// Segment Membership - Links customers to segments
export const segmentMembership = pgTable("segment_membership", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  segmentId: varchar("segment_id").notNull().references(() => customerSegments.id, { onDelete: 'cascade' }),
  customerId: integer("customer_id").notNull(), // ServiceTitan customer ID
  
  // Metadata
  addedAt: timestamp("added_at").notNull().defaultNow(),
  addedBy: varchar("added_by"), // 'manual', 'ai', 'dynamic_refresh'
}, (table) => ({
  segmentCustomerIdx: uniqueIndex("segment_membership_segment_customer_idx").on(table.segmentId, table.customerId),
  customerIdIdx: index("segment_membership_customer_id_idx").on(table.customerId),
}));

// Custom Email Campaigns - Campaign definitions
export const customEmailCampaigns = pgTable("custom_email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Campaign identification
  name: text("name").notNull().unique(),
  description: text("description"),
  
  // Campaign type
  campaignType: text("campaign_type").notNull(), // 'one_time' (single blast), 'drip' (multi-email sequence)
  
  // Target audience
  segmentId: varchar("segment_id").references(() => customerSegments.id, { onDelete: 'set null' }),
  targetCustomerIds: integer("target_customer_ids").array(), // Manual customer selection (overrides segment)
  
  // Tracking & Attribution
  trackingPhoneNumber: text("tracking_phone_number"), // Campaign-specific phone number
  utmCampaign: text("utm_campaign"), // Auto-generated from campaign name
  utmSource: text("utm_source").default('email'),
  utmMedium: text("utm_medium").default('campaign'),
  
  // Status & Approval
  status: text("status").notNull().default('draft'), // 'draft', 'pending_approval', 'scheduled', 'sending', 'completed', 'paused', 'cancelled'
  approvedBy: varchar("approved_by"), // Admin user who approved
  approvedAt: timestamp("approved_at"),
  
  // Scheduling (for one-time campaigns)
  scheduledFor: timestamp("scheduled_for"), // When to send (null = send immediately)
  
  // Drip sequence settings (for drip campaigns)
  dripIntervalDays: integer("drip_interval_days").array(), // [1, 7, 14, 21] - days between emails
  pauseOnEngagement: boolean("pause_on_engagement").notNull().default(false), // Stop if customer engages
  
  // AI generation metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  aiGoal: text("ai_goal"), // "Promote spring maintenance", "Water heater replacement offers"
  
  // Performance metrics
  totalSent: integer("total_sent").notNull().default(0),
  totalDelivered: integer("total_delivered").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  totalUnsubscribed: integer("total_unsubscribed").notNull().default(0),
  totalBounced: integer("total_bounced").notNull().default(0),
  
  // Attribution
  totalCalls: integer("total_calls").notNull().default(0), // Tracking phone clicks
  totalJobsBooked: integer("total_jobs_booked").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // In cents
  
  // Send limits & safety
  dailySendLimit: integer("daily_send_limit").notNull().default(500),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"), // When campaign started sending
  completedAt: timestamp("completed_at"), // When all emails sent
}, (table) => ({
  nameIdx: index("custom_campaigns_name_idx").on(table.name),
  statusIdx: index("custom_campaigns_status_idx").on(table.status),
  segmentIdIdx: index("custom_campaigns_segment_id_idx").on(table.segmentId),
  scheduledForIdx: index("custom_campaigns_scheduled_for_idx").on(table.scheduledFor),
}));

// Campaign Emails - Individual emails in a campaign
export const customCampaignEmails = pgTable("custom_campaign_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => customEmailCampaigns.id, { onDelete: 'cascade' }),
  
  // Email position in sequence (for drip campaigns)
  sequenceNumber: integer("sequence_number").notNull().default(1), // 1, 2, 3, 4...
  daysAfterStart: integer("days_after_start").notNull().default(0), // Days after campaign start to send this email (for drip)
  
  // Email content
  subject: text("subject").notNull(),
  preheader: text("preheader"), // Preview text
  htmlContent: text("html_content").notNull(), // HTML email body
  plainTextContent: text("plain_text_content").notNull(), // Plain text fallback
  
  // AI generation metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(false),
  aiStrategy: text("ai_strategy"), // 'value', 'urgency', 'social_proof', 'seasonal'
  aiPrompt: text("ai_prompt"),
  
  // A/B testing
  isVariant: boolean("is_variant").notNull().default(false),
  variantOf: varchar("variant_of"), // ID of email this is a variant of
  testPercentage: integer("test_percentage"), // 50 = send to 50% of audience
  
  // Performance metrics
  totalSent: integer("total_sent").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  
  // Status
  enabled: boolean("enabled").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  campaignSequenceIdx: index("custom_campaign_emails_campaign_sequence_idx").on(table.campaignId, table.sequenceNumber),
  variantOfIdx: index("custom_campaign_emails_variant_of_idx").on(table.variantOf),
}));

// Campaign Send Log - Track every email sent in custom campaigns
export const customCampaignSendLog = pgTable("custom_campaign_send_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Campaign and email references
  campaignId: varchar("campaign_id").notNull().references(() => customEmailCampaigns.id, { onDelete: 'cascade' }),
  campaignEmailId: varchar("campaign_email_id").notNull().references(() => customCampaignEmails.id, { onDelete: 'cascade' }),
  
  // Recipient
  customerId: integer("customer_id").notNull(), // ServiceTitan customer ID
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name").notNull(),
  
  // Email provider tracking
  resendEmailId: text("resend_email_id"), // Resend's email ID for tracking
  resendStatus: text("resend_status"), // 'queued', 'sent', 'delivered', 'bounced', 'complained'
  
  // Tracking events (timestamps)
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  complainedAt: timestamp("complained_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  
  // Engagement counters (for webhooks that fire multiple times)
  openCount: integer("open_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  
  // Attribution
  leadToJobBooking: boolean("lead_to_job_booking").notNull().default(false),
  jobId: bigint("job_id", { mode: 'number' }), // ServiceTitan job ID if booked
  revenueAttributed: integer("revenue_attributed").notNull().default(0), // In cents
  
  // Error tracking
  errorMessage: text("error_message"),
}, (table) => ({
  campaignCustomerIdx: index("custom_send_log_campaign_customer_idx").on(table.campaignId, table.customerId),
  campaignEmailIdx: index("custom_send_log_campaign_email_idx").on(table.campaignEmailId),
  sentAtIdx: index("custom_send_log_sent_at_idx").on(table.sentAt),
  resendEmailIdIdx: index("custom_send_log_resend_id_idx").on(table.resendEmailId),
  openedAtIdx: index("custom_send_log_opened_at_idx").on(table.openedAt),
  clickedAtIdx: index("custom_send_log_clicked_at_idx").on(table.clickedAt),
}));

export const customerSuccessStories = pgTable("customer_success_stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  story: text("story").notNull(),
  beforePhotoUrl: text("before_photo_url").notNull(),
  afterPhotoUrl: text("after_photo_url").notNull(),
  collagePhotoUrl: text("collage_photo_url"), // AI-generated before/after composite image (WebP)
  jpegCollagePhotoUrl: text("jpeg_collage_photo_url"), // JPEG version for RSS/social media
  beforeFocalX: integer("before_focal_x"), // Manual focal point override (0-100 from left)
  beforeFocalY: integer("before_focal_y"), // Manual focal point override (0-100 from top)
  afterFocalX: integer("after_focal_x"), // Manual focal point override (0-100 from left)
  afterFocalY: integer("after_focal_y"), // Manual focal point override (0-100 from top)
  serviceCategory: text("service_category").notNull(), // water-heater, drain-cleaning, etc.
  location: text("location").notNull(),
  approved: boolean("approved").notNull().default(false), // Moderation flag
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
}, (table) => ({
  submittedAtIdx: index("customer_success_stories_submitted_at_idx").on(table.submittedAt),
  approvedIdx: index("customer_success_stories_approved_idx").on(table.approved),
  categoryIdx: index("customer_success_stories_category_idx").on(table.serviceCategory),
}));

export const serviceAreas = pgTable("service_areas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cityName: text("city_name").notNull(),
  slug: text("slug").notNull().unique(),
  region: text("region").notNull(), // 'austin' or 'marble-falls'
  metaDescription: text("meta_description").notNull(),
  introContent: text("intro_content").notNull(),
  neighborhoods: text("neighborhoods").array(),
  landmarks: text("landmarks").array(),
  localPainPoints: text("local_pain_points").array(),
  seasonalIssues: text("seasonal_issues").array(),
  uniqueFaqs: text("unique_faqs").array(), // JSON stringified FAQ objects
  testimonials: text("testimonials").array(), // JSON stringified testimonial objects
  population: text("population"),
  zipCodes: text("zip_codes").array(),
  latitude: text("latitude"),
  longitude: text("longitude"),
}, (table) => ({
  regionIdx: index("service_areas_region_idx").on(table.region),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  publishDate: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  submittedAt: true,
});

export const insertCustomerSuccessStorySchema = createInsertSchema(customerSuccessStories).omit({
  id: true,
  submittedAt: true,
  approved: true, // Will be set to false by default, requires admin approval
});

export const googleReviews = pgTable("google_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorName: text("author_name").notNull(),
  authorUrl: text("author_url"),
  profilePhotoUrl: text("profile_photo_url"),
  rating: integer("rating").notNull(),
  text: text("text").notNull(),
  relativeTime: text("relative_time").notNull(),
  timestamp: integer("timestamp").notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  categories: text("categories").array().notNull().default(sql`ARRAY[]::text[]`),
  source: text("source").notNull().default('places_api'), // 'places_api', 'dataforseo', 'facebook', 'gmb_api', 'yelp'
  reviewId: text("review_id"), // External review ID for deduplication and API posting
  
  // Reply tracking
  replyText: text("reply_text"), // Our posted reply
  repliedAt: timestamp("replied_at"), // When we replied
  canReply: boolean("can_reply").notNull().default(false), // Can we reply via API?
}, (table) => ({
  ratingIdx: index("google_reviews_rating_idx").on(table.rating),
  timestampIdx: index("google_reviews_timestamp_idx").on(table.timestamp),
  sourceIdx: index("google_reviews_source_idx").on(table.source),
  repliedIdx: index("google_reviews_replied_idx").on(table.repliedAt),
}));

export const googleOAuthTokens = pgTable("google_oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  service: text("service").notNull().default('google_my_business'), // future-proof for other Google services
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  accountId: text("account_id"), // Google My Business account ID
  locationId: text("location_id"), // Google My Business location ID
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const zoomOAuthTokens = pgTable("zoom_oauth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope"),
  tokenType: text("token_type").notNull().default('bearer'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const pendingPurchases = pgTable("pending_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentIntentId: text("payment_intent_id").notNull().unique(),
  productId: varchar("product_id").notNull(),
  customerType: text("customer_type").notNull(), // 'residential' or 'commercial'
  
  // Residential fields
  customerName: text("customer_name"), // Residential: customer name / Commercial: not used
  
  // Commercial fields
  companyName: text("company_name"), // Commercial only
  contactPersonName: text("contact_person_name"), // Commercial only
  locationPhone: text("location_phone"), // Commercial only
  extension: text("extension"), // Commercial only
  
  // Location address (both types)
  locationName: text("location_name"), // Residential: same as customerName / Commercial: business location name
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  
  // Billing address (both types)
  billingName: text("billing_name"), // Person/company name for billing
  billingStreet: text("billing_street"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  
  // Contact info (both types)
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  paymentIntentIdIdx: index("pending_purchases_payment_intent_id_idx").on(table.paymentIntentId),
}));

// REMOVED: serviceTitanMemberships table - now using live API calls via server/lib/servicetitan/memberships.ts
// Customer Portal fetches memberships directly from ServiceTitan API instead of database cache

// ServiceTitan Customers Cache - synced from ServiceTitan API for fast local search
export const serviceTitanCustomers = pgTable("service_titan_customers", {
  id: integer("id").primaryKey(), // ServiceTitan customer ID (not UUID, this is the actual ST ID)
  name: text("name").notNull(),
  type: text("type").notNull(), // 'Residential' or 'Commercial'
  email: text("email"),
  phone: text("phone"),
  mobilePhone: text("mobile_phone"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  active: boolean("active").notNull().default(true),
  balance: text("balance"), // Stored as text (ServiceTitan format)
  jobCount: integer("job_count").notNull().default(0), // Total completed jobs for leaderboard
  
  // Marketing automation personalization fields
  lastServiceDate: timestamp("last_service_date"), // Most recent completed job date
  lastServiceType: text("last_service_type"), // Most recent service category
  lifetimeValue: integer("lifetime_value").notNull().default(0), // Total revenue in cents
  customerTags: text("customer_tags").array(), // ['VIP', 'Commercial', 'Seasonal']
  preferredContactMethod: text("preferred_contact_method"), // 'email', 'sms', 'phone'
  
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("st_customers_active_idx").on(table.active),
  emailIdx: index("st_customers_email_idx").on(table.email),
  phoneIdx: index("st_customers_phone_idx").on(table.phone),
  mobilePhoneIdx: index("st_customers_mobile_phone_idx").on(table.mobilePhone),
  typeIdx: index("st_customers_type_idx").on(table.type),
  jobCountIdx: index("st_customers_job_count_idx").on(table.jobCount),
  lastSyncedIdx: index("st_customers_last_synced_idx").on(table.lastSyncedAt),
  lastServiceDateIdx: index("st_customers_last_service_date_idx").on(table.lastServiceDate),
  lifetimeValueIdx: index("st_customers_lifetime_value_idx").on(table.lifetimeValue),
  preferredContactIdx: index("st_customers_preferred_contact_idx").on(table.preferredContactMethod),
}));

// ServiceTitan Customer Contacts - stores all contact methods with normalization
// This allows searching by any phone/email format and handles number changes
export const serviceTitanContacts = pgTable("service_titan_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: integer("customer_id").notNull(), // References service_titan_customers.id
  contactType: text("contact_type").notNull(), // 'Phone', 'MobilePhone', 'Email', etc.
  value: text("value").notNull(), // Raw value from ServiceTitan
  normalizedValue: text("normalized_value").notNull(), // Normalized for searching (digits only for phones, lowercase for emails)
  isPrimary: boolean("is_primary").notNull().default(false),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  customerIdIdx: index("service_titan_contacts_customer_id_idx").on(table.customerId),
  // Critical: Fast O(1) lookup by normalized phone/email
  normalizedValueIdx: index("service_titan_contacts_normalized_value_idx").on(table.normalizedValue),
  contactTypeIdx: index("service_titan_contacts_contact_type_idx").on(table.contactType),
}));

// ServiceTitan Zones - Maps ZIP codes to service zones for smart scheduling
// Enables fuel-efficient route clustering by grouping appointments in same zone
export const serviceTitanZones = pgTable("service_titan_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceTitanId: integer("servicetitan_id").unique(), // ServiceTitan's zone ID for syncing
  name: text("name").notNull(), // e.g., "North Austin", "Central", "Hill Country"
  zipCodes: text("zip_codes").array().notNull(), // Array of 5-digit ZIP codes in this zone
  cities: text("cities").array(), // Optional: City names for display
  sortOrder: integer("sort_order").notNull().default(0), // For admin ordering
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("st_zones_active_idx").on(table.active),
  sortOrderIdx: index("st_zones_sort_order_idx").on(table.sortOrder),
  serviceTitanIdIdx: index("st_zones_servicetitan_id_idx").on(table.serviceTitanId),
  // Note: GIN index for zipCodes array will be created manually via migration
  // Standard B-tree index works for small datasets, GIN optimal for large-scale
}));

// NEW XLSX-BASED TABLES - These are the primary tables for customer data
// The old serviceTitanCustomers/Contacts tables will continue to be synced by the API (which we can't stop)
// but all application code will use these XLSX-based tables instead

// XLSX Customers - Primary customer data source (replaces serviceTitanCustomers for application use)
export const customersXlsx = pgTable("customers_xlsx", {
  id: integer("id").primaryKey(), // ServiceTitan customer ID from XLSX
  name: text("name").notNull(),
  type: text("type").notNull(), // 'Residential' or 'Commercial'
  email: text("email"),
  phone: text("phone"),
  mobilePhone: text("mobile_phone"),
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  active: boolean("active").notNull().default(true),
  balance: text("balance"),
  jobCount: integer("job_count").notNull().default(0),
  
  // Marketing automation personalization fields
  lastServiceDate: timestamp("last_service_date"),
  lastServiceType: text("last_service_type"),
  lifetimeValue: integer("lifetime_value").notNull().default(0), // Total revenue in cents
  customerTags: text("customer_tags").array(),
  preferredContactMethod: text("preferred_contact_method"),
  
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("customers_xlsx_active_idx").on(table.active),
  emailIdx: index("customers_xlsx_email_idx").on(table.email),
  phoneIdx: index("customers_xlsx_phone_idx").on(table.phone),
  mobilePhoneIdx: index("customers_xlsx_mobile_phone_idx").on(table.mobilePhone),
  typeIdx: index("customers_xlsx_type_idx").on(table.type),
  jobCountIdx: index("customers_xlsx_job_count_idx").on(table.jobCount),
  lastSyncedIdx: index("customers_xlsx_last_synced_idx").on(table.lastSyncedAt),
  lastServiceDateIdx: index("customers_xlsx_last_service_date_idx").on(table.lastServiceDate),
  lifetimeValueIdx: index("customers_xlsx_lifetime_value_idx").on(table.lifetimeValue),
  preferredContactIdx: index("customers_xlsx_preferred_contact_idx").on(table.preferredContactMethod),
}));

// XLSX Customer Contacts - Primary contact data source (replaces serviceTitanContacts for application use)
export const contactsXlsx = pgTable("contacts_xlsx", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: integer("customer_id").notNull(), // References customers_xlsx.id
  contactType: text("contact_type").notNull(), // 'Phone', 'MobilePhone', 'Email', etc.
  value: text("value").notNull(), // Raw value from XLSX
  normalizedValue: text("normalized_value").notNull(), // Normalized for searching (digits only for phones, lowercase for emails)
  isPrimary: boolean("is_primary").notNull().default(false),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  customerIdIdx: index("contacts_xlsx_customer_id_idx").on(table.customerId),
  normalizedValueIdx: index("contacts_xlsx_normalized_value_idx").on(table.normalizedValue),
  contactTypeIdx: index("contacts_xlsx_contact_type_idx").on(table.contactType),
}));

// SimpleTexting Integration - Lightweight ID mappings (SimpleTexting is source of truth)
export const simpleTextingContacts = pgTable("simpletexting_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: integer("customer_id").notNull(), // Links to customers_xlsx.id
  simpleTextingContactId: text("simpletexting_contact_id").notNull().unique(), // External SimpleTexting contact ID
  phoneNumber: text("phone_number").notNull(), // Phone number synced to SimpleTexting
  consentSource: text("consent_source").notNull(), // 'form_submission', 'customer_portal', 'manual', 'import'
  optInStatus: text("opt_in_status").notNull().default('opted_in'), // 'opted_in', 'opted_out', 'pending'
  addedAt: timestamp("added_at").notNull().defaultNow(),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  customerIdIdx: index("st_contacts_customer_id_idx").on(table.customerId),
  simpleTextingIdIdx: index("st_contacts_simpletexting_id_idx").on(table.simpleTextingContactId),
  phoneIdx: index("st_contacts_phone_idx").on(table.phoneNumber),
  optInStatusIdx: index("st_contacts_opt_in_status_idx").on(table.optInStatus),
}));

// SMS Campaigns - Created in our admin panel, executed via SimpleTexting
export const smsCampaigns = pgTable("sms_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  simpleTextingCampaignId: text("simpletexting_campaign_id").unique(), // External campaign ID (set after creation)
  
  // Campaign details (created in our UI)
  name: text("name").notNull(),
  messageContent: text("message_content").notNull(),
  audienceDefinition: jsonb("audience_definition").notNull(), // { listIds: [], tags: [], customCriteria: {} }
  
  // Scheduling
  status: text("status").notNull().default('draft'), // 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduledFor: timestamp("scheduled_for"),
  
  // Admin tracking
  createdBy: varchar("created_by"), // Admin user email
  createdAt: timestamp("created_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"),
  
  // Stats snapshot (updated via webhooks)
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  deliveredCount: integer("delivered_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  replyCount: integer("reply_count").notNull().default(0),
  
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("sms_campaigns_status_idx").on(table.status),
  createdByIdx: index("sms_campaigns_created_by_idx").on(table.createdBy),
  scheduledIdx: index("sms_campaigns_scheduled_idx").on(table.scheduledFor),
  simpleTextingIdIdx: index("sms_campaigns_simpletexting_id_idx").on(table.simpleTextingCampaignId),
}));

// SMS Campaign Events - Lightweight event snapshots from SimpleTexting webhooks
export const smsCampaignEvents = pgTable("sms_campaign_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(), // References sms_campaigns.id
  eventType: text("event_type").notNull(), // 'sent', 'delivered', 'failed', 'replied', 'opt_out'
  phoneNumber: text("phone_number"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata"), // Additional event data from SimpleTexting
}, (table) => ({
  campaignIdIdx: index("sms_campaign_events_campaign_id_idx").on(table.campaignId),
  eventTypeIdx: index("sms_campaign_events_event_type_idx").on(table.eventType),
  timestampIdx: index("sms_campaign_events_timestamp_idx").on(table.timestamp),
}));

// SMS Conversations - 2-way messaging inbox
export const smsConversations = pgTable("sms_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(), // Customer phone number
  customerId: integer("customer_id"), // Links to customers_xlsx.id if known
  customerName: text("customer_name"),
  
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  lastMessagePreview: text("last_message_preview"), // First 100 chars of last message
  lastMessageDirection: text("last_message_direction"), // 'inbound' or 'outbound'
  
  unreadCount: integer("unread_count").notNull().default(0),
  isArchived: boolean("is_archived").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  phoneIdx: index("sms_conversations_phone_idx").on(table.phoneNumber),
  customerIdIdx: index("sms_conversations_customer_id_idx").on(table.customerId),
  lastMessageIdx: index("sms_conversations_last_message_idx").on(table.lastMessageAt),
  unreadIdx: index("sms_conversations_unread_idx").on(table.unreadCount),
}));

// SMS Messages - Individual messages in conversations
export const smsMessages = pgTable("sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(), // References sms_conversations.id
  simpleTextingMessageId: text("simpletexting_message_id"), // External message ID
  
  direction: text("direction").notNull(), // 'inbound' or 'outbound'
  content: text("content").notNull(),
  phoneNumber: text("phone_number").notNull(), // Redundant but useful for queries
  
  status: text("status").notNull().default('sent'), // 'sent', 'delivered', 'failed'
  sentBy: varchar("sent_by"), // Admin user email (for outbound messages)
  
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  
  metadata: jsonb("metadata"), // Additional data from SimpleTexting
}, (table) => ({
  conversationIdIdx: index("sms_messages_conversation_id_idx").on(table.conversationId),
  directionIdx: index("sms_messages_direction_idx").on(table.direction),
  sentAtIdx: index("sms_messages_sent_at_idx").on(table.sentAt),
  phoneIdx: index("sms_messages_phone_idx").on(table.phoneNumber),
}));

// Customer Data Import History - Tracks XLSX imports from ServiceTitan
// Mailgun webhook attempt logging - tracks EVERY webhook hit (success or failure)
export const mailgunWebhookLogs = pgTable("mailgun_webhook_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Webhook metadata
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  messageId: text("message_id"), // Mailgun message ID
  sender: text("sender"), // From address
  recipient: text("recipient"), // To address
  subject: text("subject"),
  
  // Signature verification
  signatureVerified: boolean("signature_verified").notNull().default(false),
  timestampAge: integer("timestamp_age"), // Seconds old when received
  
  // Attachment detection
  attachmentCount: integer("attachment_count").notNull().default(0),
  xlsxFound: boolean("xlsx_found").notNull().default(false),
  xlsxFileName: text("xlsx_file_name"),
  xlsxSize: integer("xlsx_size"), // Bytes
  
  // Processing result
  status: text("status").notNull(), // 'success', 'failed', 'rejected'
  errorMessage: text("error_message"),
  importId: varchar("import_id"), // Links to customerDataImports if successful
  
  // Timing
  processingTime: integer("processing_time"), // Milliseconds
}, (table) => ({
  receivedAtIdx: index("mailgun_webhook_logs_received_at_idx").on(table.receivedAt),
  statusIdx: index("mailgun_webhook_logs_status_idx").on(table.status),
  messageIdIdx: index("mailgun_webhook_logs_message_id_idx").on(table.messageId),
}));

export const customerDataImports = pgTable("customer_data_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Import metadata
  fileName: text("file_name").notNull(), // Original XLSX filename
  importedBy: text("imported_by"), // Email of admin who triggered import (if manual)
  importSource: text("import_source").notNull().default('manual'), // 'manual', 'email', 'scheduled'
  
  // Import statistics
  totalRows: integer("total_rows").notNull().default(0),
  customersImported: integer("customers_imported").notNull().default(0),
  contactsImported: integer("contacts_imported").notNull().default(0),
  errors: integer("errors").notNull().default(0),
  
  // Metrics snapshot (at time of import)
  totalLifetimeRevenue: integer("total_lifetime_revenue").notNull().default(0), // In cents
  customersWithRevenue: integer("customers_with_revenue").notNull().default(0),
  avgLifetimeRevenue: integer("avg_lifetime_revenue").notNull().default(0), // In cents
  maxLifetimeRevenue: integer("max_lifetime_revenue").notNull().default(0), // In cents
  
  // Significant changes detection
  newCustomers: integer("new_customers").notNull().default(0), // Customers added since last import
  revenueChange: integer("revenue_change").notNull().default(0), // Revenue delta in cents
  
  // Import status
  status: text("status").notNull().default('processing'), // 'processing', 'completed', 'failed'
  errorMessage: text("error_message"),
  
  // Timestamps
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  processingTime: integer("processing_time"), // Milliseconds
}, (table) => ({
  importSourceIdx: index("customer_imports_source_idx").on(table.importSource),
  statusIdx: index("customer_imports_status_idx").on(table.status),
  startedAtIdx: index("customer_imports_started_at_idx").on(table.startedAt),
}));

export const trackingNumbers = pgTable("tracking_numbers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  channelKey: text("channel_key").notNull().unique(), // e.g., 'google', 'facebook', 'yelp'
  channelName: text("channel_name").notNull(), // Display name, e.g., 'Google Ads'
  displayNumber: text("display_number").notNull(), // (512) 368-9159
  rawNumber: text("raw_number").notNull(), // 5123689159
  telLink: text("tel_link").notNull(), // tel:+15123689159
  detectionRules: text("detection_rules").notNull(), // JSON string of detection rules
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // One channel should be default
  sortOrder: integer("sort_order").notNull().default(0), // For ordering in admin panel
  
  // ServiceTitan campaign mapping
  serviceTitanCampaignId: integer("servicetitan_campaign_id"), // Maps channelKey (utm_source) to ST campaign ID
  serviceTitanCampaignName: text("servicetitan_campaign_name"), // Pretty name from ServiceTitan
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  channelKeyIdx: index("tracking_numbers_channel_key_idx").on(table.channelKey),
  isActiveIdx: index("tracking_numbers_is_active_idx").on(table.isActive),
  isDefaultIdx: index("tracking_numbers_is_default_idx").on(table.isDefault),
  stCampaignIdx: index("tracking_numbers_st_campaign_idx").on(table.serviceTitanCampaignId),
}));

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({
  id: true,
});

export const insertTrackingNumberSchema = createInsertSchema(trackingNumbers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoogleReviewSchema = createInsertSchema(googleReviews).omit({
  id: true,
  fetchedAt: true,
});

export const insertGoogleOAuthTokenSchema = createInsertSchema(googleOAuthTokens).omit({
  id: true,
  updatedAt: true,
});

export const insertZoomOAuthTokenSchema = createInsertSchema(zoomOAuthTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPendingPurchaseSchema = createInsertSchema(pendingPurchases).omit({
  id: true,
  createdAt: true,
});

// REMOVED: insertServiceTitanMembershipSchema - table deleted (now using live API)

export const companyCamPhotos = pgTable("companycam_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyCamPhotoId: text("companycam_photo_id").unique(), // Nullable for non-CompanyCam sources
  companyCamProjectId: text("companycam_project_id"), // Nullable for non-CompanyCam sources
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  source: text("source").notNull().default('companycam'), // 'companycam', 'gdrive', 'servicetitan'
  
  // AI-generated categorization
  category: text("category").notNull(), // 'water_heater', 'drain', 'leak', 'toilet', 'faucet', 'gas', 'backflow', 'commercial', 'general'
  aiDescription: text("ai_description"), // What the AI sees in the photo
  tags: text("tags").array(), // Additional tags from AI analysis
  
  // AI quality analysis (OpenAI Vision)
  qualityAnalyzed: boolean("quality_analyzed").notNull().default(false),
  isGoodQuality: boolean("is_good_quality"),
  shouldKeep: boolean("should_keep"),
  qualityScore: integer("quality_score"), // 1-10
  qualityReasoning: text("quality_reasoning"),
  analyzedAt: timestamp("analyzed_at"),
  
  // Focal Point (for image positioning in blogs/pages)
  focalPointX: integer("focal_point_x"), // 0-100 percentage from left
  focalPointY: integer("focal_point_y"), // 0-100 percentage from top
  focalPointReason: text("focal_point_reason"), // Why this focal point was chosen
  
  // Blog topic suggestion (for auto-generation)
  suggestedBlogTopic: text("suggested_blog_topic"), // AI-suggested blog post topic
  blogTopicAnalyzed: boolean("blog_topic_analyzed").notNull().default(false),
  blogTopicAnalyzedAt: timestamp("blog_topic_analyzed_at"),
  
  // Metadata
  uploadedAt: timestamp("uploaded_at"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  
  // Usage tracking
  usedInBlogPostId: varchar("used_in_blog_post_id"),
  usedInPageUrl: text("used_in_page_url"),
}, (table) => ({
  categoryIdx: index("companycam_photos_category_idx").on(table.category),
  projectIdIdx: index("companycam_photos_project_id_idx").on(table.companyCamProjectId),
  qualityIdx: index("companycam_photos_quality_idx").on(table.shouldKeep),
  blogTopicIdx: index("companycam_photos_blog_topic_idx").on(table.blogTopicAnalyzed, table.usedInBlogPostId),
}));

export const insertCompanyCamPhotoSchema = createInsertSchema(companyCamPhotos).omit({
  id: true,
  fetchedAt: true,
});

export const beforeAfterComposites = pgTable("before_after_composites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Source photos
  beforePhotoId: varchar("before_photo_id").notNull(),
  afterPhotoId: varchar("after_photo_id").notNull(),
  
  // Composite images (WebP for web, JPEG for RSS/social)
  compositeUrl: text("composite_url").notNull(),
  jpegCompositeUrl: text("jpeg_composite_url"),
  
  // AI-generated content
  caption: text("caption"), // AI-generated caption for social media
  category: text("category").notNull(), // Inherited from photos
  
  // Metadata
  jobId: text("job_id"), // ServiceTitan job ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  
  // Social media tracking
  postedToFacebook: boolean("posted_to_facebook").notNull().default(false),
  postedToInstagram: boolean("posted_to_instagram").notNull().default(false),
  facebookPostId: text("facebook_post_id"),
  instagramPostId: text("instagram_post_id"),
  postedAt: timestamp("posted_at"),
}, (table) => ({
  categoryIdx: index("before_after_composites_category_idx").on(table.category),
  postedIdx: index("before_after_composites_posted_idx").on(table.postedToFacebook, table.postedToInstagram),
}));

export const insertBeforeAfterCompositeSchema = createInsertSchema(beforeAfterComposites).omit({
  id: true,
  createdAt: true,
});

export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notFoundErrors = pgTable("not_found_errors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestedUrl: text("requested_url").notNull(),
  referrer: text("referrer"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  emailSent: boolean("email_sent").notNull().default(false),
}, (table) => ({
  timestampIdx: index("not_found_errors_timestamp_idx").on(table.timestamp),
  urlIdx: index("not_found_errors_url_idx").on(table.requestedUrl),
}));

export const importedPhotos = pgTable("imported_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(), // Object Storage URL
  category: text("category").notNull(), // 'drain-cleaning', 'water-heater', etc.
  
  // AI Analysis
  isProductionQuality: boolean("is_production_quality").notNull().default(true), // Whether photo is good enough for customer-facing use
  aiQuality: integer("ai_quality"), // 0-100 quality score
  aiQualityScore: integer("ai_quality_score"), // Alias for compatibility
  qualityReason: text("quality_reason"), // Why it passed/failed quality check
  aiDescription: text("ai_description"),
  aiTags: text("ai_tags").array(),
  
  // Focal Point (for image positioning)
  focalPointX: integer("focal_point_x"), // 0-100 percentage from left
  focalPointY: integer("focal_point_y"), // 0-100 percentage from top
  
  // Metadata
  gdriveFileId: text("gdrive_file_id").unique(), // Google Drive file ID for deduplication
  usedInBlog: boolean("used_in_blog").notNull().default(false),
  usedInBlogPostId: text("used_in_blog_post_id"), // Track which blog post uses this photo
  usedInPageUrl: text("used_in_page_url"), // Track which page uses this photo
  uploadDate: timestamp("upload_date"), // When photo was uploaded
  createdAt: timestamp("created_at").notNull().defaultNow(), // When record was created
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("imported_photos_category_idx").on(table.category),
  usedIdx: index("imported_photos_used_idx").on(table.usedInBlog),
  qualityIdx: index("imported_photos_quality_idx").on(table.isProductionQuality),
  gdriveIdx: index("imported_photos_gdrive_idx").on(table.gdriveFileId),
}));

export const insertSystemSettingSchema = createInsertSchema(systemSettings);
export const insertNotFoundErrorSchema = createInsertSchema(notFoundErrors).omit({
  id: true,
  timestamp: true,
});

export const insertImportedPhotoSchema = createInsertSchema(importedPhotos).omit({
  id: true,
  fetchedAt: true,
});

// ServiceTitan Photo Fetch Job Queue
export const serviceTitanPhotoJobs = pgTable("servicetitan_photo_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: bigint("job_id", { mode: "number" }).notNull(), // ServiceTitan Job ID
  invoiceNumber: text("invoice_number").notNull(), // Invoice number from webhook
  customerId: bigint("customer_id", { mode: "number" }), // ServiceTitan Customer ID
  status: text("status").notNull().default('queued'), // queued, processing, completed, failed, retrying
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  photosFound: integer("photos_found"), // Number of photos found
  photosImported: integer("photos_imported"), // Number of quality photos imported
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastProcessedAt: timestamp("last_processed_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  statusIdx: index("servicetitan_photo_jobs_status_idx").on(table.status),
  jobIdIdx: index("servicetitan_photo_jobs_job_id_idx").on(table.jobId),
  createdAtIdx: index("servicetitan_photo_jobs_created_at_idx").on(table.createdAt),
}));

export const insertServiceTitanPhotoJobSchema = createInsertSchema(serviceTitanPhotoJobs).omit({
  id: true,
  createdAt: true,
});

export type ServiceTitanPhotoJob = typeof serviceTitanPhotoJobs.$inferSelect;
export type InsertServiceTitanPhotoJob = z.infer<typeof insertServiceTitanPhotoJobSchema>;

// Commercial customers/clients for trust signal display
export const commercialCustomers = pgTable("commercial_customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  logoUrl: text("logo_url").notNull(),
  websiteUrl: text("website_url"),
  location: text("location"), // Austin, Marble Falls, Liberty Hill, Leander, etc.
  industry: text("industry"), // Restaurant, Auto Services, Coworking, etc.
  customerSince: integer("customer_since"), // Year they became a customer
  displayOrder: integer("display_order").notNull().default(0), // For manual ordering
  active: boolean("active").notNull().default(true), // Show/hide without deleting
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("commercial_customers_active_idx").on(table.active),
  displayOrderIdx: index("commercial_customers_display_order_idx").on(table.displayOrder),
}));

export const insertCommercialCustomerSchema = createInsertSchema(commercialCustomers).omit({
  id: true,
  addedAt: true,
});

// Page metadata for SEO management
// Customer Portal Analytics (track search attempts)
export const portalAnalytics = pgTable("portal_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  searchType: text("search_type").notNull(), // 'phone' or 'email'
  searchValue: text("search_value").notNull(), // The phone/email searched for
  found: boolean("found").notNull(), // Whether customer was found
  customerId: integer("customer_id"), // ServiceTitan customer ID if found
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => ({
  timestampIdx: index("portal_analytics_timestamp_idx").on(table.timestamp),
  foundIdx: index("portal_analytics_found_idx").on(table.found),
}));

// Phone-based login temporary lookups (prevents email harvesting)
export const phoneLoginLookups = pgTable("phone_login_lookups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lookupToken: text("lookup_token").notNull().unique(),
  phone: text("phone").notNull(),
  email: text("email"), // Optional - customers may only have phone or SMS verification
  customerId: integer("customer_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tokenIdx: index("phone_login_lookups_token_idx").on(table.lookupToken),
  expiresIdx: index("phone_login_lookups_expires_idx").on(table.expiresAt),
}));

// Customer Portal Authentication (SMS codes and email magic links)
export const portalVerifications = pgTable("portal_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Verification details
  verificationType: text("verification_type").notNull(), // 'sms' or 'email'
  contactValue: text("contact_value").notNull(), // Phone number or email address
  
  // Code/token
  code: text("code").notNull(), // 6-digit code for SMS, UUID token for email
  
  // Customer info (array to support multiple accounts with shared email/phone)
  customerIds: integer("customer_ids").array().notNull(), // ServiceTitan customer IDs
  
  // Verification status
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  
  // Security & expiry
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), // 10 min for SMS, 1 hour for email
  attempts: integer("attempts").notNull().default(0), // Track failed attempts
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  codeIdx: index("portal_verifications_code_idx").on(table.code),
  contactIdx: index("portal_verifications_contact_idx").on(table.contactValue),
  expiresIdx: index("portal_verifications_expires_idx").on(table.expiresAt),
}));

export const pageMetadata = pgTable("page_metadata", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  path: text("path").notNull().unique(), // URL path like '/commercial-plumbing' or '/about'
  title: text("title").notNull(), // SEO title tag
  description: text("description").notNull(), // Meta description
  keywords: text("keywords"), // Optional meta keywords
  canonicalUrl: text("canonical_url"), // Optional custom canonical URL
  ogImage: text("og_image"), // Optional custom OG image
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pathIdx: index("page_metadata_path_idx").on(table.path),
}));

export const insertPageMetadataSchema = createInsertSchema(pageMetadata).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceTitanCustomerSchema = createInsertSchema(serviceTitanCustomers).omit({
  lastSyncedAt: true,
});

export const insertServiceTitanContactSchema = createInsertSchema(serviceTitanContacts).omit({
  id: true,
  lastSyncedAt: true,
});

export const insertServiceTitanZoneSchema = createInsertSchema(serviceTitanZones).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMailgunWebhookLogSchema = createInsertSchema(mailgunWebhookLogs).omit({
  id: true,
  receivedAt: true,
});

export const insertCustomerDataImportSchema = createInsertSchema(customerDataImports).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export const otpVerifications = pgTable("otp_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  otp: text("otp").notNull(),
  verified: boolean("verified").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  phoneNumberIdx: index("otp_verifications_phone_number_idx").on(table.phoneNumber),
  expiresAtIdx: index("otp_verifications_expires_at_idx").on(table.expiresAt),
}));

export const insertOtpVerificationSchema = createInsertSchema(otpVerifications).omit({
  id: true,
  createdAt: true,
});

// Custom review submissions (direct from website, not Google/Facebook)
export const customReviews = pgTable("custom_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Customer info
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  serviceTitanCustomerId: integer("service_titan_customer_id"), // Link to ServiceTitan if available
  
  // Review content
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"), // Optional review title/headline
  text: text("text").notNull(),
  serviceType: text("service_type"), // What service they received
  jobDate: timestamp("job_date"), // When was the service performed
  
  // Photos (optional - customers can upload photos)
  photoUrls: text("photo_urls").array().default(sql`ARRAY[]::text[]`),
  
  // Moderation workflow
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected', 'spam'
  
  // Reply tracking (custom reviews can be replied to on our website)
  replyText: text("reply_text"), // Our posted reply
  repliedAt: timestamp("replied_at"), // When we replied
  moderatedBy: varchar("moderated_by"), // Admin user ID who approved/rejected
  moderatedAt: timestamp("moderated_at"),
  moderationNotes: text("moderation_notes"), // Internal notes from moderator
  
  // Display settings
  featured: boolean("featured").notNull().default(false), // Highlight on homepage
  displayOnWebsite: boolean("display_on_website").notNull().default(true), // Show publicly
  
  // Metadata
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  ipAddress: text("ip_address"), // For spam prevention
  userAgent: text("user_agent"), // For analytics
  source: text("source").notNull().default('website'), // 'website', 'email_link', 'sms_link'
  requestId: varchar("request_id"), // Links to review_requests table
}, (table) => ({
  statusIdx: index("custom_reviews_status_idx").on(table.status),
  ratingIdx: index("custom_reviews_rating_idx").on(table.rating),
  submittedAtIdx: index("custom_reviews_submitted_at_idx").on(table.submittedAt),
  featuredIdx: index("custom_reviews_featured_idx").on(table.featured),
  customerIdIdx: index("custom_reviews_customer_id_idx").on(table.serviceTitanCustomerId),
}));

export const insertCustomReviewSchema = createInsertSchema(customReviews).omit({
  id: true,
  submittedAt: true,
  moderatedBy: true,
  moderatedAt: true,
});

// Review platform links (Google, Facebook, BBB, Yelp)
export const reviewPlatforms = pgTable("review_platforms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull().unique(), // 'google', 'facebook', 'bbb', 'yelp'
  displayName: text("display_name").notNull(), // 'Google', 'Facebook', 'Better Business Bureau', 'Yelp'
  url: text("url").notNull(), // Direct link to review page
  enabled: boolean("enabled").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0), // Display order
  icon: text("icon"), // Icon name or emoji
  description: text("description"), // Optional description
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ServiceTitan Jobs Staging - Raw API responses for safe processing
export const serviceTitanJobsStaging = pgTable("service_titan_jobs_staging", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: bigint("job_id", { mode: 'number' }).notNull(), // ServiceTitan job ID
  rawData: jsonb("raw_data").notNull(), // Complete job object from API
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  processedAt: timestamp("processed_at"), // When it was normalized to serviceTitanJobs
  processingError: text("processing_error"),
}, (table) => ({
  jobIdIdx: index("st_jobs_staging_job_id_idx").on(table.jobId),
  fetchedAtIdx: index("st_jobs_staging_fetched_at_idx").on(table.fetchedAt),
  processedAtIdx: index("st_jobs_staging_processed_at_idx").on(table.processedAt),
}));

// ServiceTitan Jobs - Normalized job data for fast queries (kept for customer portal)
export const serviceTitanJobs = pgTable("service_titan_jobs", {
  id: bigint("id", { mode: 'number' }).primaryKey(), // ServiceTitan job ID
  jobNumber: varchar("job_number").notNull(),
  customerId: integer("customer_id").notNull(), // References serviceTitanCustomers.id
  jobType: varchar("job_type"),
  businessUnitId: bigint("business_unit_id", { mode: 'number' }),
  
  // Job status
  jobStatus: varchar("job_status").notNull(), // 'Completed', 'Canceled', 'InProgress', etc.
  completedOn: timestamp("completed_on"),
  
  // Financial data
  total: integer("total").notNull().default(0), // Total amount in cents
  invoice: integer("invoice").notNull().default(0), // Invoice amount in cents
  
  // Service info (kept for customer portal display)
  serviceCategory: varchar("service_category"), // 'Plumbing', 'Water Heater', 'Drain Cleaning', etc.
  equipmentInstalled: text("equipment_installed").array(), // ['Tankless Water Heater', 'Water Softener']
  customerSatisfaction: integer("customer_satisfaction"), // 1-5 rating
  
  // Timestamps
  createdOn: timestamp("created_on").notNull(),
  modifiedOn: timestamp("modified_on").notNull(),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  customerIdIdx: index("st_jobs_customer_id_idx").on(table.customerId),
  jobStatusIdx: index("st_jobs_job_status_idx").on(table.jobStatus),
  completedOnIdx: index("st_jobs_completed_on_idx").on(table.completedOn),
  modifiedOnIdx: index("st_jobs_modified_on_idx").on(table.modifiedOn),
  jobNumberIdx: index("st_jobs_job_number_idx").on(table.jobNumber),
  serviceCategoryIdx: index("st_jobs_service_category_idx").on(table.serviceCategory),
  customerSatisfactionIdx: index("st_jobs_customer_satisfaction_idx").on(table.customerSatisfaction),
}));

// Sync Watermarks - Tracks incremental sync progress for ServiceTitan API
export const syncWatermarks = pgTable("sync_watermarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: varchar("sync_type").notNull(), // 'customers', 'jobs', etc.
  lastSuccessfulSyncAt: timestamp("last_successful_sync_at"),
  lastModifiedOnFetched: timestamp("last_modified_on_fetched"), // Watermark timestamp
  recordsProcessed: integer("records_processed").notNull().default(0),
  syncDuration: integer("sync_duration"), // Milliseconds
  lastError: text("last_error"),
  lastErrorAt: timestamp("last_error_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ServiceTitan Job Forms - Form submissions from jobs (for customer portal)
export const serviceTitanJobForms = pgTable("service_titan_job_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: bigint("form_id", { mode: 'number' }).notNull(), // ServiceTitan form ID
  jobId: bigint("job_id", { mode: 'number' }).notNull(), // References serviceTitanJobs.id
  customerId: integer("customer_id").notNull(), // References serviceTitanCustomers.id
  formTemplateId: bigint("form_template_id", { mode: 'number' }),
  formTemplateName: text("form_template_name"),
  rawFormData: jsonb("raw_form_data").notNull(), // Complete form JSON
  parsedFields: jsonb("parsed_fields").notNull(), // Normalized key-value pairs
  technicianNotes: text("technician_notes"),
  customerConcerns: text("customer_concerns").array(),
  recommendationsMade: text("recommendations_made").array(),
  equipmentCondition: text("equipment_condition"),
  submittedOn: timestamp("submitted_on").notNull(),
  submittedBy: text("submitted_by"),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  jobIdIdx: index("st_job_forms_job_id_idx").on(table.jobId),
  customerIdIdx: index("st_job_forms_customer_id_idx").on(table.customerId),
  formIdIdx: index("st_job_forms_form_id_idx").on(table.formId),
}));

// ServiceTitan Estimates - Quotes/estimates from jobs (enhanced for AI analytics)
export const serviceTitanEstimates = pgTable("service_titan_estimates", {
  id: bigint("id", { mode: 'number' }).primaryKey(), // ServiceTitan estimate ID
  jobId: bigint("job_id", { mode: 'number' }), // Optional: linked job ID
  customerId: integer("customer_id").notNull(), // References serviceTitanCustomers.id
  
  // Estimate details
  name: text("name"),
  summary: text("summary"),
  status: varchar("status").notNull(), // 'Open', 'Sold', 'Dismissed'
  soldBy: text("sold_by"), // Salesperson name
  soldOn: timestamp("sold_on"), // When estimate was sold
  dismissedBy: text("dismissed_by"),
  dismissedOn: timestamp("dismissed_on"),
  
  // Financial data
  subtotal: integer("subtotal").notNull().default(0), // Subtotal in cents
  tax: integer("tax").notNull().default(0), // Tax amount in cents
  total: integer("total").notNull().default(0), // Total amount in cents
  
  // Metadata
  createdBy: text("created_by"), // Who created the estimate
  createdOn: timestamp("created_on").notNull(),
  modifiedOn: timestamp("modified_on"),
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  jobIdIdx: index("st_estimates_job_id_idx").on(table.jobId),
  customerIdIdx: index("st_estimates_customer_id_idx").on(table.customerId),
  statusIdx: index("st_estimates_status_idx").on(table.status),
  soldOnIdx: index("st_estimates_sold_on_idx").on(table.soldOn),
  createdOnIdx: index("st_estimates_created_on_idx").on(table.createdOn),
}));

// ServiceTitan Line Items - Individual services, materials, equipment from estimates
export const serviceTitanLineItems = pgTable("service_titan_line_items", {
  id: bigint("id", { mode: 'number' }).primaryKey(), // ServiceTitan line item ID
  estimateId: bigint("estimate_id", { mode: 'number' }).notNull(), // References serviceTitanEstimates.id
  jobId: bigint("job_id", { mode: 'number' }), // Optional: job ID if booked
  customerId: integer("customer_id").notNull(), // References serviceTitanCustomers.id
  
  // Line item details
  itemType: varchar("item_type").notNull(), // 'Service', 'Material', 'Equipment'
  skuId: bigint("sku_id", { mode: 'number' }), // Pricebook SKU ID
  skuName: text("sku_name"), // SKU display name
  description: text("description"),
  
  // Equipment-specific fields (for water heater analytics)
  equipmentManufacturer: text("equipment_manufacturer"), // e.g., 'Rheem', 'Bradford White'
  equipmentModel: text("equipment_model"), // Model number
  equipmentSize: text("equipment_size"), // e.g., '50 gallon', '75,000 BTU'
  equipmentType: text("equipment_type"), // e.g., 'Tankless', 'Tank', 'Heat Pump'
  
  // Pricing
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull().default(0), // Price per unit in cents
  totalPrice: integer("total_price").notNull().default(0), // Total price in cents
  cost: integer("cost").notNull().default(0), // Cost to business in cents
  memberPrice: integer("member_price"), // Member discount price in cents
  
  // Status
  sold: boolean("sold").notNull().default(false),
  soldBy: text("sold_by"),
  soldOn: timestamp("sold_on"),
  
  // Metadata
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  estimateIdIdx: index("st_line_items_estimate_id_idx").on(table.estimateId),
  jobIdIdx: index("st_line_items_job_id_idx").on(table.jobId),
  customerIdIdx: index("st_line_items_customer_id_idx").on(table.customerId),
  itemTypeIdx: index("st_line_items_item_type_idx").on(table.itemType),
  skuIdIdx: index("st_line_items_sku_id_idx").on(table.skuId),
  equipmentTypeIdx: index("st_line_items_equipment_type_idx").on(table.equipmentType),
  soldIdx: index("st_line_items_sold_idx").on(table.sold),
  soldOnIdx: index("st_line_items_sold_on_idx").on(table.soldOn),
}));

// Marketing tables removed - all marketing infrastructure has been removed from the system

export const insertServiceTitanEstimateSchema = createInsertSchema(serviceTitanEstimates).omit({
  lastSyncedAt: true,
});

export const insertServiceTitanLineItemSchema = createInsertSchema(serviceTitanLineItems).omit({
  lastSyncedAt: true,
});

export const insertReviewPlatformSchema = createInsertSchema(reviewPlatforms).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type ImportedPhoto = typeof importedPhotos.$inferSelect;
export type InsertImportedPhoto = z.infer<typeof insertImportedPhotoSchema>;
export type User = typeof users.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type CustomerSuccessStory = typeof customerSuccessStories.$inferSelect;
export type InsertCustomerSuccessStory = z.infer<typeof insertCustomerSuccessStorySchema>;
export type ServiceArea = typeof serviceAreas.$inferSelect;
export type InsertServiceArea = z.infer<typeof insertServiceAreaSchema>;
export type GoogleReview = typeof googleReviews.$inferSelect;
export type InsertGoogleReview = z.infer<typeof insertGoogleReviewSchema>;
export type GoogleOAuthToken = typeof googleOAuthTokens.$inferSelect;
export type InsertGoogleOAuthToken = z.infer<typeof insertGoogleOAuthTokenSchema>;
export type ZoomOAuthToken = typeof zoomOAuthTokens.$inferSelect;
export type InsertZoomOAuthToken = z.infer<typeof insertZoomOAuthTokenSchema>;
export type PendingPurchase = typeof pendingPurchases.$inferSelect;
export type InsertPendingPurchase = z.infer<typeof insertPendingPurchaseSchema>;
// REMOVED: ServiceTitanMembership types - table deleted (now using live API)
export type CompanyCamPhoto = typeof companyCamPhotos.$inferSelect;
export type InsertCompanyCamPhoto = z.infer<typeof insertCompanyCamPhotoSchema>;
export type BeforeAfterComposite = typeof beforeAfterComposites.$inferSelect;
export type InsertBeforeAfterComposite = z.infer<typeof insertBeforeAfterCompositeSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type NotFoundError = typeof notFoundErrors.$inferSelect;
export type InsertNotFoundError = z.infer<typeof insertNotFoundErrorSchema>;
export type TrackingNumber = typeof trackingNumbers.$inferSelect;
export type InsertTrackingNumber = z.infer<typeof insertTrackingNumberSchema>;
export type CommercialCustomer = typeof commercialCustomers.$inferSelect;
export type InsertCommercialCustomer = z.infer<typeof insertCommercialCustomerSchema>;
export type PageMetadata = typeof pageMetadata.$inferSelect;
export type InsertPageMetadata = z.infer<typeof insertPageMetadataSchema>;
export type ServiceTitanCustomer = typeof serviceTitanCustomers.$inferSelect;
export type InsertServiceTitanCustomer = z.infer<typeof insertServiceTitanCustomerSchema>;
export type ServiceTitanContact = typeof serviceTitanContacts.$inferSelect;
export type InsertServiceTitanContact = z.infer<typeof insertServiceTitanContactSchema>;
export type ServiceTitanZone = typeof serviceTitanZones.$inferSelect;
export type InsertServiceTitanZone = z.infer<typeof insertServiceTitanZoneSchema>;
export type ServiceTitanEstimate = typeof serviceTitanEstimates.$inferSelect;
export type InsertServiceTitanEstimate = z.infer<typeof insertServiceTitanEstimateSchema>;
export type ServiceTitanLineItem = typeof serviceTitanLineItems.$inferSelect;
export type InsertServiceTitanLineItem = z.infer<typeof insertServiceTitanLineItemSchema>;
export type MailgunWebhookLog = typeof mailgunWebhookLogs.$inferSelect;
export type InsertMailgunWebhookLog = z.infer<typeof insertMailgunWebhookLogSchema>;
export type CustomerDataImport = typeof customerDataImports.$inferSelect;
export type InsertCustomerDataImport = z.infer<typeof insertCustomerDataImportSchema>;
export type OAuthUser = typeof oauthUsers.$inferSelect;
export type UpsertOAuthUser = typeof oauthUsers.$inferInsert;
export type AdminWhitelist = typeof adminWhitelist.$inferSelect;
export type InsertAdminWhitelist = typeof adminWhitelist.$inferInsert;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type CustomReview = typeof customReviews.$inferSelect;
export type InsertCustomReview = z.infer<typeof insertCustomReviewSchema>;
// Review request types removed - will be rebuilt
export type ReviewPlatform = typeof reviewPlatforms.$inferSelect;
export type InsertReviewPlatform = z.infer<typeof insertReviewPlatformSchema>;
export type ServiceTitanJob = typeof serviceTitanJobs.$inferSelect;
export type ServiceTitanJobStaging = typeof serviceTitanJobsStaging.$inferSelect;
export type SyncWatermark = typeof syncWatermarks.$inferSelect;


// Marketing schemas removed - will be rebuilt

// Review link click schema removed - will be rebuilt

// ServiceTitan job form schema removed - will be rebuilt

// Audience movement and marketing system settings schemas removed - will be rebuilt


// Review Email Preferences - SEPARATE from marketing preferences (transactional)


// Reputation management schemas removed - will be rebuilt

// ============================================================================
// REVIEW & REFERRAL DRIP CAMPAIGN SYSTEM
// ============================================================================

// Job Completions - Track recently completed jobs eligible for review requests
export const jobCompletions = pgTable("job_completions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Dual-source identifiers (webhook vs polling)
  jobId: integer("job_id").unique(), // ServiceTitan job ID (polling) - nullable for webhook-created records
  invoiceNumber: text("invoice_number"), // Invoice number (webhook) - nullable for polling-created records
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  
  // Job metadata
  completionDate: timestamp("completion_date").notNull(),
  serviceName: text("service_name"),
  technicianName: text("technician_name"),
  invoiceTotal: integer("invoice_total"), // In cents
  jobNotes: text("job_notes"),
  
  // Technician rating (1-5 stars, submitted by customer)
  technicianRating: integer("technician_rating"), // null = not yet rated, 1-5 = customer rating
  ratedAt: timestamp("rated_at"), // When customer submitted rating
  
  // Marketing flags
  marketingOptedOut: boolean("marketing_opted_out").notNull().default(false),
  isQuoteOnly: boolean("is_quote_only").notNull().default(false), // $0 jobs - quotes/estimates without completed work
  
  // Source tracking for dual-mode operation (webhook primary + polling fallback)
  source: reviewSource("source").notNull().default("polling"), // 'webhook', 'polling', 'manual', 'api'
  sourceMetadata: jsonb("source_metadata"), // {mailgunMessageId, invoiceNumber, etc}
  
  // Tracking
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  completionDateIdx: index("job_completions_completion_date_idx").on(table.completionDate),
  customerIdIdx: index("job_completions_customer_id_idx").on(table.customerId),
  // Partial unique indexes for dual-source idempotency
  jobIdUnique: uniqueIndex("job_completions_job_id_not_null_idx")
    .on(table.jobId)
    .where(sql`${table.jobId} IS NOT NULL`),
  customerInvoiceUnique: uniqueIndex("job_completions_customer_invoice_idx")
    .on(table.customerId, table.invoiceNumber)
    .where(sql`${table.invoiceNumber} IS NOT NULL`),
}));

// Invoice Processing Log - Track invoice PDF webhook attempts from ServiceTitan
export const invoiceProcessingLog = pgTable("invoice_processing_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Email metadata
  emailSubject: text("email_subject"),
  emailFrom: text("email_from"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  
  // PDF details
  pdfUrl: text("pdf_url"),
  pdfFilename: text("pdf_filename"),
  attachmentSize: integer("attachment_size"), // In bytes
  
  // Processing status
  status: text("status").notNull().default('pending'), // 'pending', 'parsed', 'matched', 'completed', 'failed'
  errorMessage: text("error_message"),
  
  // Extracted data (stored as JSON)
  extractedData: jsonb("extracted_data"), // {customerName, email, phone, invoiceNumber, amount, date, services}
  
  // Customer matching result
  matchedCustomerId: integer("matched_customer_id"),
  matchMethod: text("match_method"), // 'email', 'phone', 'fuzzy_name', 'manual', 'no_match'
  matchConfidence: integer("match_confidence"), // 0-100
  requiresManualReview: boolean("requires_manual_review").notNull().default(false),
  
  // Job completion created
  jobCompletionId: varchar("job_completion_id"), // Links to jobCompletions table
  jobCompletionCreated: boolean("job_completion_created").notNull().default(false),
  
  // Campaign triggered
  reviewRequestId: varchar("review_request_id"), // Links to reviewRequests table
  reviewRequestTriggered: boolean("review_request_triggered").notNull().default(false),
  
  // Admin actions
  manuallyLinkedAt: timestamp("manually_linked_at"),
  manuallyLinkedBy: varchar("manually_linked_by"),
  adminNotes: text("admin_notes"),
  
  // Timestamps
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  receivedAtIdx: index("invoice_processing_log_received_at_idx").on(table.receivedAt),
  statusIdx: index("invoice_processing_log_status_idx").on(table.status),
  matchedCustomerIdx: index("invoice_processing_log_matched_customer_idx").on(table.matchedCustomerId),
  requiresReviewIdx: index("invoice_processing_log_requires_review_idx").on(table.requiresManualReview),
}));

// Estimate Processing Log - Track estimate PDF webhook attempts from ServiceTitan
export const estimateProcessingLog = pgTable("estimate_processing_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Email metadata
  emailSubject: text("email_subject"),
  emailFrom: text("email_from"),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  
  // PDF details
  pdfUrl: text("pdf_url"),
  pdfFilename: text("pdf_filename"),
  attachmentSize: integer("attachment_size"), // In bytes
  
  // Processing status
  status: text("status").notNull().default('pending'), // 'pending', 'parsed', 'matched', 'completed', 'skipped', 'failed'
  errorMessage: text("error_message"),
  skipReason: text("skip_reason"), // 'zero_amount', 'duplicate', 'invalid_data'
  
  // Extracted data (stored as JSON)
  extractedData: jsonb("extracted_data"), // {customerName, email, phone, estimateNumber, amount, date, services}
  
  // Customer matching result
  matchedCustomerId: integer("matched_customer_id"),
  matchMethod: text("match_method"), // 'email', 'phone', 'fuzzy_name', 'manual', 'no_match'
  matchConfidence: integer("match_confidence"), // 0-100
  requiresManualReview: boolean("requires_manual_review").notNull().default(false),
  
  // Quote tracking created
  quoteFollowupId: varchar("quote_followup_id"), // Links to future quote follow-up campaign table
  quoteFollowupTriggered: boolean("quote_followup_triggered").notNull().default(false),
  estimateAmount: integer("estimate_amount"), // Amount in cents
  
  // Admin actions
  manuallyLinkedAt: timestamp("manually_linked_at"),
  manuallyLinkedBy: varchar("manually_linked_by"),
  adminNotes: text("admin_notes"),
  
  // Timestamps
  processedAt: timestamp("processed_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  receivedAtIdx: index("estimate_processing_log_received_at_idx").on(table.receivedAt),
  statusIdx: index("estimate_processing_log_status_idx").on(table.status),
  matchedCustomerIdx: index("estimate_processing_log_matched_customer_idx").on(table.matchedCustomerId),
  requiresReviewIdx: index("estimate_processing_log_requires_review_idx").on(table.requiresManualReview),
}));

// Review Requests - 4-email drip campaign over 21 days
export const reviewRequests = pgTable("review_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Links to job
  jobCompletionId: varchar("job_completion_id").notNull(),
  customerId: integer("customer_id").notNull(),
  customerEmail: text("customer_email").notNull(),
  
  // Campaign status
  status: text("status").notNull().default('queued'), // 'queued', 'email1_sent', 'email2_sent', 'email3_sent', 'email4_sent', 'completed', 'stopped'
  stopReason: text("stop_reason"), // 'review_submitted', 'opted_out', 'email_bounced'
  
  // Email tracking (4 emails in drip)
  email1SentAt: timestamp("email1_sent_at"),
  email2SentAt: timestamp("email2_sent_at"),
  email3SentAt: timestamp("email3_sent_at"),
  email4SentAt: timestamp("email4_sent_at"),
  
  // Response tracking
  reviewSubmitted: boolean("review_submitted").notNull().default(false),
  reviewSubmittedAt: timestamp("review_submitted_at"),
  reviewRating: integer("review_rating"), // 1-5 stars
  reviewPlatform: text("review_platform"), // 'google', 'facebook', 'internal'
  
  // Engagement
  emailOpens: integer("email_opens").notNull().default(0),
  linkClicks: integer("link_clicks").notNull().default(0),
  
  // Source tracking (cascaded from parent jobCompletion)
  source: reviewSource("source").notNull().default("polling"), // Inherited from jobCompletion
  sourceMetadata: jsonb("source_metadata"), // Inherited or override metadata
  
  // Timestamps
  scheduledStart: timestamp("scheduled_start"), // Optional: delay campaign start (null = immediate)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  statusIdx: index("review_requests_status_idx").on(table.status),
  customerIdIdx: index("review_requests_customer_id_idx").on(table.customerId),
  createdAtIdx: index("review_requests_created_at_idx").on(table.createdAt),
}));

// Review Feedback - Internal feedback from <4 star reviews
export const reviewFeedback = pgTable("review_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Links to review request
  reviewRequestId: varchar("review_request_id").notNull(),
  customerId: integer("customer_id").notNull(),
  
  // Feedback details
  rating: integer("rating").notNull(), // 1-5 stars (typically <4)
  feedbackText: text("feedback_text"),
  wouldRecommend: boolean("would_recommend"),
  
  // Admin follow-up
  followedUp: boolean("followed_up").notNull().default(false),
  followedUpAt: timestamp("followed_up_at"),
  followUpNotes: text("follow_up_notes"),
  resolved: boolean("resolved").notNull().default(false),
  
  // Timestamps
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
}, (table) => ({
  reviewRequestIdIdx: index("review_feedback_review_request_idx").on(table.reviewRequestId),
  followedUpIdx: index("review_feedback_followed_up_idx").on(table.followedUp),
  ratingIdx: index("review_feedback_rating_idx").on(table.rating),
}));

// Referral Nurture Campaigns - 4-email drip over 6 months for happy reviewers
export const referralNurtureCampaigns = pgTable("referral_nurture_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Links to customer
  customerId: integer("customer_id").notNull().unique(), // One campaign per customer
  customerEmail: text("customer_email").notNull(),
  originalReviewId: varchar("original_review_id"), // The review that triggered this campaign
  
  // Campaign status
  status: text("status").notNull().default('queued'), // 'queued', 'email1_sent', 'email2_sent', 'email3_sent', 'email4_sent', 'completed', 'paused'
  pauseReason: text("pause_reason"), // 'referral_submitted', 'opted_out', 'low_engagement'
  
  // Email tracking (4 emails over 6 months)
  email1SentAt: timestamp("email1_sent_at"), // Day 14
  email2SentAt: timestamp("email2_sent_at"), // Day 60
  email3SentAt: timestamp("email3_sent_at"), // Day 150
  email4SentAt: timestamp("email4_sent_at"), // Day 210
  
  // Engagement tracking
  consecutiveUnopened: integer("consecutive_unopened").notNull().default(0), // Auto-pause after 2
  totalOpens: integer("total_opens").notNull().default(0),
  totalClicks: integer("total_clicks").notNull().default(0),
  
  // Referral tracking
  referralsSubmitted: integer("referrals_submitted").notNull().default(0),
  lastReferralAt: timestamp("last_referral_at"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  statusIdx: index("referral_nurture_status_idx").on(table.status),
  customerIdIdx: index("referral_nurture_customer_id_idx").on(table.customerId),
  createdAtIdx: index("referral_nurture_created_at_idx").on(table.createdAt),
}));

// Quote Follow-Up Campaigns - 3-email drip over 2-3 weeks for estimates
export const quoteFollowupCampaigns = pgTable("quote_followup_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Links to customer and estimate
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  estimateNumber: text("estimate_number"), // Job number from ServiceTitan
  estimateAmount: integer("estimate_amount"), // Amount in cents
  
  // Campaign status
  status: text("status").notNull().default('queued'), // 'queued', 'email1_sent', 'email2_sent', 'email3_sent', 'completed', 'paused', 'converted'
  pauseReason: text("pause_reason"), // 'job_booked', 'opted_out', 'low_engagement', 'customer_declined'
  
  // Email tracking (3 emails over 2-3 weeks)
  email1SentAt: timestamp("email1_sent_at"), // Day 2 after estimate
  email2SentAt: timestamp("email2_sent_at"), // Day 7 after estimate
  email3SentAt: timestamp("email3_sent_at"), // Day 14 after estimate
  
  // Engagement tracking
  consecutiveUnopened: integer("consecutive_unopened").notNull().default(0), // Auto-pause after 2
  totalOpens: integer("total_opens").notNull().default(0),
  totalClicks: integer("total_clicks").notNull().default(0),
  
  // Conversion tracking
  jobBookedAt: timestamp("job_booked_at"), // When customer scheduled job
  jobNumber: text("job_number"), // ServiceTitan job number if converted
  conversionSource: text("conversion_source"), // 'email_click', 'phone_call', 'scheduler_direct'
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pausedAt: timestamp("paused_at"),
  completedAt: timestamp("completed_at"),
}, (table) => ({
  statusIdx: index("quote_followup_status_idx").on(table.status),
  customerIdIdx: index("quote_followup_customer_id_idx").on(table.customerId),
  createdAtIdx: index("quote_followup_created_at_idx").on(table.createdAt),
  estimateNumberIdx: index("quote_followup_estimate_number_idx").on(table.estimateNumber),
}));

// Review Email Templates - Customizable templates for campaign emails
export const reviewEmailTemplates = pgTable("review_email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template identification
  campaignType: text("campaign_type").notNull(), // 'review_request', 'referral_nurture', 'quote_followup'
  emailNumber: integer("email_number").notNull(), // 1-4
  
  // Template content
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainTextContent: text("plain_text_content").notNull(),
  
  // Dynamic merge fields used (for reference)
  mergeFields: text("merge_fields").array(), // ['customerName', 'technicianName', 'serviceName', etc.]
  
  // Admin customization
  isDefault: boolean("is_default").notNull().default(false),
  customized: boolean("customized").notNull().default(false),
  lastEditedBy: varchar("last_edited_by"),
  lastEditedAt: timestamp("last_edited_at"),
  
  // AI generation metadata
  aiGenerated: boolean("ai_generated").notNull().default(false),
  aiPrompt: text("ai_prompt"), // The prompt used to generate this template
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  campaignTypeIdx: index("review_email_templates_campaign_type_idx").on(table.campaignType),
  emailNumberIdx: index("review_email_templates_email_number_idx").on(table.emailNumber),
  uniqueCampaignEmail: uniqueIndex("review_email_templates_campaign_email_unique").on(table.campaignType, table.emailNumber),
}));

// Email Send Log - Tracks all campaign email sends for engagement tracking
export const emailSendLog = pgTable("email_send_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Campaign identification
  campaignType: text("campaign_type").notNull(), // 'review_request', 'referral_nurture', 'quote_followup'
  campaignRecordId: varchar("campaign_record_id").notNull(), // ID of reviewRequest or referralNurtureCampaign
  emailNumber: integer("email_number").notNull(), // 1-4
  
  // Recipient info
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  customerId: integer("customer_id").notNull(),
  
  // Email provider details
  resendEmailId: text("resend_email_id").unique(), // Resend's email ID for webhook tracking
  resendStatus: text("resend_status"), // 'queued', 'sent', 'delivered', 'bounced', 'complained'
  
  // Tracking events
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  complainedAt: timestamp("complained_at"),
  
  // Error tracking
  errorMessage: text("error_message"),
}, (table) => ({
  resendEmailIdIdx: index("email_send_log_resend_email_id_idx").on(table.resendEmailId),
  campaignTypeIdx: index("email_send_log_campaign_type_idx").on(table.campaignType),
  campaignRecordIdx: index("email_send_log_campaign_record_idx").on(table.campaignRecordId),
  recipientEmailIdx: index("email_send_log_recipient_email_idx").on(table.recipientEmail),
}));

// Email Suppression List - Hard bounces, spam complaints (NEVER email these)
export const emailSuppressionList = pgTable("email_suppression_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  
  // Suppression reason
  reason: text("reason").notNull(), // 'hard_bounce', 'spam_complaint', 'manual_suppression'
  reasonDetails: text("reason_details"),
  
  // Source tracking
  resendEmailId: text("resend_email_id"),
  campaignRecordId: varchar("campaign_record_id"),
  
  // Timestamps
  addedAt: timestamp("added_at").notNull().defaultNow(),
}, (table) => ({
  emailIdx: index("email_suppression_list_email_idx").on(table.email),
  reasonIdx: index("email_suppression_list_reason_idx").on(table.reason),
}));

// ============================================================================
// SYSTEM RELIABILITY & MONITORING
// ============================================================================

// Webhook Failure Queue - Stores failed webhook events for retry
export const webhookFailureQueue = pgTable("webhook_failure_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Webhook details
  webhookType: text("webhook_type").notNull(), // 'resend', 'stripe', 'twilio', etc.
  webhookEvent: text("webhook_event").notNull(), // 'email.delivered', 'email.bounced', etc.
  rawPayload: jsonb("raw_payload").notNull(), // Complete webhook payload
  
  // HTTP request details
  headers: jsonb("headers").notNull(), // Webhook headers for verification
  signature: text("signature"), // Original signature for retry verification
  
  // Retry tracking
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  nextRetryAt: timestamp("next_retry_at"), // When to retry next
  lastAttemptAt: timestamp("last_attempt_at"),
  lastError: text("last_error"), // Error message from last attempt
  
  // Status
  status: text("status").notNull().default('pending'), // 'pending', 'retrying', 'succeeded', 'dead_letter'
  processedAt: timestamp("processed_at"), // When successfully processed
  movedToDeadLetterAt: timestamp("moved_to_dead_letter_at"), // When moved to dead letter queue
  
  // Timestamps
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  statusIdx: index("webhook_failure_queue_status_idx").on(table.status),
  nextRetryAtIdx: index("webhook_failure_queue_next_retry_at_idx").on(table.nextRetryAt),
  webhookTypeIdx: index("webhook_failure_queue_type_idx").on(table.webhookType),
}));

// Campaign Send Idempotency - Prevents duplicate email/SMS sends

// SimpleTexting Integration - Insert schemas
export const insertSimpleTextingContactSchema = createInsertSchema(simpleTextingContacts).omit({
  id: true,
  addedAt: true,
  lastSyncedAt: true,
});

export const insertSmsCampaignSchema = createInsertSchema(smsCampaigns).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertSmsCampaignEventSchema = createInsertSchema(smsCampaignEvents).omit({
  id: true,
  timestamp: true,
});

export const insertSmsConversationSchema = createInsertSchema(smsConversations).omit({
  id: true,
  createdAt: true,
});

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  sentAt: true,
});

// System Reliability & Monitoring insert schemas
export const insertWebhookFailureQueueSchema = createInsertSchema(webhookFailureQueue).omit({
  id: true,
  receivedAt: true,
  createdAt: true,
  processedAt: true,
  movedToDeadLetterAt: true,
  lastAttemptAt: true,
});

// SimpleTexting Integration - Type exports
export type SimpleTextingContact = typeof simpleTextingContacts.$inferSelect;
export type InsertSimpleTextingContact = z.infer<typeof insertSimpleTextingContactSchema>;
export type SmsCampaign = typeof smsCampaigns.$inferSelect;
export type InsertSmsCampaign = z.infer<typeof insertSmsCampaignSchema>;
export type SmsCampaignEvent = typeof smsCampaignEvents.$inferSelect;
export type InsertSmsCampaignEvent = z.infer<typeof insertSmsCampaignEventSchema>;
export type SmsConversation = typeof smsConversations.$inferSelect;
export type InsertSmsConversation = z.infer<typeof insertSmsConversationSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;

export type WebhookFailureQueue = typeof webhookFailureQueue.$inferSelect;
export type InsertWebhookFailureQueue = z.infer<typeof insertWebhookFailureQueueSchema>;
// System health check types removed - will be rebuilt

// Chatbot types and schemas
export const insertChatbotConversationSchema = createInsertSchema(chatbotConversations).omit({
  id: true,
  startedAt: true,
  feedbackPositive: true,
  feedbackNegative: true,
});

export const insertChatbotMessageSchema = createInsertSchema(chatbotMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChatbotAnalyticsSchema = createInsertSchema(chatbotAnalytics).omit({
  id: true,
  lastAsked: true,
  count: true,
});

export const insertChatbotQuickResponseSchema = createInsertSchema(chatbotQuickResponses).omit({
  id: true,
});

export type ChatbotConversation = typeof chatbotConversations.$inferSelect;
export type InsertChatbotConversation = z.infer<typeof insertChatbotConversationSchema>;
export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = z.infer<typeof insertChatbotMessageSchema>;
export type ChatbotAnalytics = typeof chatbotAnalytics.$inferSelect;
export type InsertChatbotAnalytics = z.infer<typeof insertChatbotAnalyticsSchema>;
export type ChatbotQuickResponse = typeof chatbotQuickResponses.$inferSelect;
export type InsertChatbotQuickResponse = z.infer<typeof insertChatbotQuickResponseSchema>;

// Review & Referral Drip Campaign Schemas
export const insertJobCompletionSchema = createInsertSchema(jobCompletions).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceProcessingLogSchema = createInsertSchema(invoiceProcessingLog).omit({
  id: true,
  receivedAt: true,
  processedAt: true,
  completedAt: true,
});

export const insertEstimateProcessingLogSchema = createInsertSchema(estimateProcessingLog).omit({
  id: true,
  receivedAt: true,
  processedAt: true,
  completedAt: true,
});

export const insertReviewRequestSchema = createInsertSchema(reviewRequests).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertReviewFeedbackSchema = createInsertSchema(reviewFeedback).omit({
  id: true,
  submittedAt: true,
  followedUpAt: true,
});

export const insertReferralNurtureCampaignSchema = createInsertSchema(referralNurtureCampaigns).omit({
  id: true,
  createdAt: true,
  pausedAt: true,
  completedAt: true,
});

export const insertReviewEmailTemplateSchema = createInsertSchema(reviewEmailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSendLogSchema = createInsertSchema(emailSendLog).omit({
  id: true,
  sentAt: true,
});

export const insertEmailSuppressionListSchema = createInsertSchema(emailSuppressionList).omit({
  id: true,
  addedAt: true,
});

export const insertReferralCreditUsageSchema = createInsertSchema(referralCreditUsage).omit({
  id: true,
  processedAt: true,
});

export const insertVoucherSchema = createInsertSchema(vouchers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRefereeWelcomeEmailSchema = createInsertSchema(refereeWelcomeEmails).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export const insertReferrerThankYouEmailSchema = createInsertSchema(referrerThankYouEmails).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  sentAt: true,
});

export const insertReferrerSuccessEmailSchema = createInsertSchema(referrerSuccessEmails).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  sentAt: true,
});

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertPendingReferralSchema = createInsertSchema(pendingReferrals).omit({
  id: true,
  capturedAt: true,
  convertedAt: true,
});

// Referral Codes
export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
});

// Referrals - Main referral submissions
export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  submittedAt: true,
  updatedAt: true,
  contactedAt: true,
  firstJobDate: true,
  creditedAt: true,
  expiresAt: true,
}).extend({
  // Override contact fields to allow missing values (not just null)
  // Form sends empty strings, API should convert to null before validation
  referrerEmail: z.string().optional().nullable(),
  referrerPhone: z.string().optional().nullable(),
  refereeEmail: z.string().optional().nullable(),
  refereePhone: z.string().optional().nullable(),
});

// Referral form submission schema for public/portal forms
// Validates user input before database insertion
export const referralFormSchema = z.object({
  // Referrer info
  referrerName: z.string().min(2, "Your name must be at least 2 characters"),
  referrerEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  referrerPhone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
  
  // Referee info  
  refereeName: z.string().min(2, "Friend's name must be at least 2 characters"),
  refereeEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  refereePhone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
}).refine(
  (data) => data.referrerEmail || data.referrerPhone,
  {
    message: "Please provide either your email or phone number",
    path: ["referrerEmail"],
  }
).refine(
  (data) => data.refereeEmail || data.refereePhone,
  {
    message: "Please provide either your friend's email or phone number",
    path: ["refereeEmail"],
  }
);

export const insertConversionEventSchema = createInsertSchema(conversionEvents).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerSegmentSchema = createInsertSchema(customerSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSegmentMembershipSchema = createInsertSchema(segmentMembership).omit({
  id: true,
  addedAt: true,
});

export const insertCustomEmailCampaignSchema = createInsertSchema(customEmailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomCampaignEmailSchema = createInsertSchema(customCampaignEmails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomCampaignSendLogSchema = createInsertSchema(customCampaignSendLog).omit({
  id: true,
  sentAt: true,
});

// Scheduler - Appointment booking requests
export const schedulerRequests = pgTable("scheduler_requests", {
  id: serial("id").primaryKey(),
  
  // Customer info
  serviceTitanCustomerId: integer("servicetitan_customer_id"), // ST customer ID if exists
  serviceTitanLocationId: integer("servicetitan_location_id"), // ST location ID if exists
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone").notNull(),
  address: text("address").notNull(),
  city: text("city"),
  state: text("state").default("TX"),
  zipCode: text("zip_code"),
  
  // Service details
  requestedService: text("requested_service").notNull(), // Service type requested
  preferredDate: timestamp("preferred_date"),
  preferredTimeSlot: text("preferred_time_slot"), // "morning", "afternoon", "evening"
  specialInstructions: text("special_instructions"),
  
  // Source tracking
  bookingSource: text("booking_source").notNull(), // website, referral, portal, backflow, coupon
  
  // Booking tracking
  status: text("status").notNull().default("pending"), // pending, confirmed, failed, cancelled
  serviceTitanJobId: integer("servicetitan_job_id"), // ST job ID when successfully booked
  serviceTitanAppointmentId: integer("servicetitan_appointment_id"), // ST appointment ID
  serviceTitanInvoiceId: integer("servicetitan_invoice_id"), // ST invoice ID
  serviceTitanPaymentId: integer("servicetitan_payment_id"), // ST payment ID
  
  // Payment (for prepaid services like backflow)
  paymentAmount: numeric("payment_amount"), // Payment amount
  paymentMethod: text("payment_method"), // Payment method
  stripePaymentId: text("stripe_payment_id"), // Stripe payment ID
  
  // Metadata and errors
  errorMessage: text("error_message"), // Error details if booking failed
  bookedAt: timestamp("booked_at"), // When successfully booked in ServiceTitan
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Payment tracking (added after initial schema)
  paymentIntentId: text("payment_intent_id"), // Stripe payment intent ID for idempotency
  paymentStatus: text("payment_status"), // pending, succeeded, failed, refunded
  isPrepaid: boolean("is_prepaid").notNull().default(false)
}, (table) => ({
  statusIdx: index("scheduler_requests_status_idx").on(table.status),
  createdAtIdx: index("scheduler_requests_created_at_idx").on(table.createdAt),
  stCustomerIdIdx: index("scheduler_requests_st_customer_id_idx").on(table.serviceTitanCustomerId),
  stJobIdIdx: index("scheduler_requests_st_job_id_idx").on(table.serviceTitanJobId),
  bookingSourceIdx: index("scheduler_requests_booking_source_idx").on(table.bookingSource),
  // Unique constraint on paymentIntentId for idempotency (allows NULL for non-prepaid bookings)
  paymentIntentIdUnique: uniqueIndex("scheduler_requests_payment_intent_id_unique").on(table.paymentIntentId),
}));

export const insertSchedulerRequestSchema = createInsertSchema(schedulerRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type JobCompletion = typeof jobCompletions.$inferSelect;
export type InsertJobCompletion = z.infer<typeof insertJobCompletionSchema>;
export type InvoiceProcessingLog = typeof invoiceProcessingLog.$inferSelect;
export type InsertInvoiceProcessingLog = z.infer<typeof insertInvoiceProcessingLogSchema>;
export type EstimateProcessingLog = typeof estimateProcessingLog.$inferSelect;
export type InsertEstimateProcessingLog = z.infer<typeof insertEstimateProcessingLogSchema>;
export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type InsertReviewRequest = z.infer<typeof insertReviewRequestSchema>;
export type ReviewFeedback = typeof reviewFeedback.$inferSelect;
export type InsertReviewFeedback = z.infer<typeof insertReviewFeedbackSchema>;
export type ReferralNurtureCampaign = typeof referralNurtureCampaigns.$inferSelect;
export type InsertReferralNurtureCampaign = z.infer<typeof insertReferralNurtureCampaignSchema>;
export type ReviewEmailTemplate = typeof reviewEmailTemplates.$inferSelect;
export type InsertReviewEmailTemplate = z.infer<typeof insertReviewEmailTemplateSchema>;
export type EmailSendLog = typeof emailSendLog.$inferSelect;
export type InsertEmailSendLog = z.infer<typeof insertEmailSendLogSchema>;
export type EmailSuppressionList = typeof emailSuppressionList.$inferSelect;
export type InsertEmailSuppressionList = z.infer<typeof insertEmailSuppressionListSchema>;
export type ReferralCreditUsage = typeof referralCreditUsage.$inferSelect;
export type InsertReferralCreditUsage = z.infer<typeof insertReferralCreditUsageSchema>;
export type Voucher = typeof vouchers.$inferSelect;
export type InsertVoucher = z.infer<typeof insertVoucherSchema>;
export type RefereeWelcomeEmail = typeof refereeWelcomeEmails.$inferSelect;
export type InsertRefereeWelcomeEmail = z.infer<typeof insertRefereeWelcomeEmailSchema>;
export type ReferrerThankYouEmail = typeof referrerThankYouEmails.$inferSelect;
export type InsertReferrerThankYouEmail = z.infer<typeof insertReferrerThankYouEmailSchema>;
export type ReferrerSuccessEmail = typeof referrerSuccessEmails.$inferSelect;
export type InsertReferrerSuccessEmail = z.infer<typeof insertReferrerSuccessEmailSchema>;
export type EmailPreference = typeof emailPreferences.$inferSelect;
export type InsertEmailPreference = z.infer<typeof insertEmailPreferencesSchema>;
export type PendingReferral = typeof pendingReferrals.$inferSelect;
export type InsertPendingReferral = z.infer<typeof insertPendingReferralSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type ReferralFormData = z.infer<typeof referralFormSchema>;
export type ConversionEvent = typeof conversionEvents.$inferSelect;
export type InsertConversionEvent = z.infer<typeof insertConversionEventSchema>;
export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;
export type SegmentMembership = typeof segmentMembership.$inferSelect;
export type InsertSegmentMembership = z.infer<typeof insertSegmentMembershipSchema>;
export type CustomEmailCampaign = typeof customEmailCampaigns.$inferSelect;
export type InsertCustomEmailCampaign = z.infer<typeof insertCustomEmailCampaignSchema>;
export type CustomCampaignEmail = typeof customCampaignEmails.$inferSelect;
export type InsertCustomCampaignEmail = z.infer<typeof insertCustomCampaignEmailSchema>;
export type CustomCampaignSendLog = typeof customCampaignSendLog.$inferSelect;
export type InsertCustomCampaignSendLog = z.infer<typeof insertCustomCampaignSendLogSchema>;
export type SchedulerRequest = typeof schedulerRequests.$inferSelect;
export type InsertSchedulerRequest = z.infer<typeof insertSchedulerRequestSchema>;

// ============================================================================
// SEO AUDIT SYSTEM - Local testing tools (Lighthouse, site-audit-seo, seo-analyzer)
// ============================================================================

// Batch definitions for reusable page sets (homepage, service pages, city pages, etc.)
export const seoAuditBatches = pgTable("seo_audit_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(), // e.g., "Service Pages", "City Pages", "Homepage + Key Pages"
  description: text("description"),
  pages: jsonb("pages").notNull(), // Array of { url: string, label: string }
  createdBy: varchar("created_by"), // Admin user who created this batch
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index("seo_audit_batches_created_at_idx").on(table.createdAt),
}));

// SEO audit jobs (queued, running, completed, failed)
export const seoAuditJobs = pgTable("seo_audit_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Tool and scope
  tool: text("tool").notNull(), // 'lighthouse', 'site-audit-seo', 'seo-analyzer'
  scope: text("scope").notNull(), // 'single', 'batch', 'full-crawl'
  targetUrl: text("target_url"), // For single URL audits
  batchId: varchar("batch_id"), // For batch audits (FK to seo_audit_batches)
  
  // Job status
  status: text("status").notNull().default('queued'), // queued, running, succeeded, failed, cancelled
  errorMessage: text("error_message"),
  
  // Configuration
  config: jsonb("config"), // Tool-specific config (depth, mobile/desktop, etc.)
  
  // Execution tracking
  queuedAt: timestamp("queued_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  triggeredBy: varchar("triggered_by"), // Admin user who triggered this audit
}, (table) => ({
  statusIdx: index("seo_audit_jobs_status_idx").on(table.status),
  toolIdx: index("seo_audit_jobs_tool_idx").on(table.tool),
  queuedAtIdx: index("seo_audit_jobs_queued_at_idx").on(table.queuedAt),
  batchIdIdx: index("seo_audit_jobs_batch_id_idx").on(table.batchId),
}));

// SEO audit results (parsed scores, issues, recommendations)
export const seoAuditResults = pgTable("seo_audit_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull(), // FK to seo_audit_jobs
  
  // Summary scores (for Lighthouse)
  lighthouseScores: jsonb("lighthouse_scores"), // { performance: 95, seo: 88, accessibility: 92, bestPractices: 90 }
  
  // SEO findings (for all tools)
  seoFindings: jsonb("seo_findings"), // Array of { severity: 'critical'|'high'|'medium'|'low', issue, url, recommendation }
  
  // Top recommendations
  topRecommendations: text("top_recommendations").array(), // String array of most important fixes
  
  // Stats
  pageCount: integer("page_count"), // Number of pages audited (for crawls)
  duration: integer("duration"), // Execution time in seconds
  
  // Raw output (compressed)
  rawOutput: text("raw_output"), // JSON string or CSV output from CLI tool
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  jobIdIdx: index("seo_audit_results_job_id_idx").on(table.jobId),
  createdAtIdx: index("seo_audit_results_created_at_idx").on(table.createdAt),
}));

export const insertSeoAuditBatchSchema = createInsertSchema(seoAuditBatches).omit({
  id: true,
  createdAt: true,
});

export const insertSeoAuditJobSchema = createInsertSchema(seoAuditJobs).omit({
  id: true,
  queuedAt: true,
});

export const insertSeoAuditResultSchema = createInsertSchema(seoAuditResults).omit({
  id: true,
  createdAt: true,
});

export type SeoAuditBatch = typeof seoAuditBatches.$inferSelect;
export type InsertSeoAuditBatch = z.infer<typeof insertSeoAuditBatchSchema>;
export type SeoAuditJob = typeof seoAuditJobs.$inferSelect;
export type InsertSeoAuditJob = z.infer<typeof insertSeoAuditJobSchema>;
export type SeoAuditResult = typeof seoAuditResults.$inferSelect;
export type InsertSeoAuditResult = z.infer<typeof insertSeoAuditResultSchema>;

// Generated plumbing images (dogs/cats doing plumbing - fun marketing pages)
export const generatedPlumbingImages = pgTable("generated_plumbing_images", {
  id: serial("id").primaryKey(),
  animalType: varchar("animal_type", { length: 10 }).notNull(), // 'dog' or 'cat'
  imageUrl: text("image_url").notNull(),
  breed: text("breed"), // e.g., "Border Collie", "Russian Blue"
  scenario: text("scenario"), // e.g., "precision pipe fitting", "blueprint review"
  location: text("location"), // e.g., "Downtown Austin loft"
  season: text("season"), // "winter", "spring", "summer", "fall"
  alt: text("alt"), // SEO-friendly alt text
  caption: text("caption"), // Social media caption
  hashtags: text("hashtags").array(), // Platform-specific hashtags
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  createdAtIdx: index("generated_plumbing_images_created_at_idx").on(table.createdAt),
  animalTypeIdx: index("generated_plumbing_images_animal_type_idx").on(table.animalType),
}));

export const insertGeneratedPlumbingImageSchema = createInsertSchema(generatedPlumbingImages).omit({ id: true, createdAt: true });
export type GeneratedPlumbingImage = typeof generatedPlumbingImages.$inferSelect;
export type InsertGeneratedPlumbingImage = z.infer<typeof insertGeneratedPlumbingImageSchema>;

// Late API Social Media Profiles
// Stores connected social media profiles and accounts for sharing content
export const lateProfiles = pgTable("late_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lateProfileId: text("late_profile_id").notNull().unique(), // ID from Late API
  name: text("name").notNull(), // Profile name (e.g., "Economy Plumbing Main", "Client: XYZ")
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  lateProfileIdIdx: index("late_profiles_late_profile_id_idx").on(table.lateProfileId),
  createdAtIdx: index("late_profiles_created_at_idx").on(table.createdAt),
}));

export const latePlatform = pgEnum("late_platform", [
  "facebook",
  "instagram", 
  "linkedin",
  "twitter",
  "threads",
  "tiktok",
  "youtube",
  "pinterest",
  "reddit",
  "bluesky"
]);

export const lateAccounts = pgTable("late_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: varchar("profile_id").notNull(), // FK to late_profiles
  lateAccountId: text("late_account_id").notNull().unique(), // Account ID from Late API
  platform: latePlatform("platform").notNull(),
  username: text("username"), // Platform username/handle
  displayName: text("display_name"), // Account display name
  isActive: boolean("is_active").notNull().default(true), // Can be disabled without deleting
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at"), // Track last time this account was used to post
}, (table) => ({
  profileIdIdx: index("late_accounts_profile_id_idx").on(table.profileId),
  platformIdx: index("late_accounts_platform_idx").on(table.platform),
  isActiveIdx: index("late_accounts_is_active_idx").on(table.isActive),
  lateAccountIdIdx: index("late_accounts_late_account_id_idx").on(table.lateAccountId),
}));

// Track social media posts created via Late API
export const latePosts = pgTable("late_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  latePostId: text("late_post_id").notNull().unique(), // Post ID from Late API
  sourceType: text("source_type").notNull(), // 'review', 'blog', 'manual', 'announcement'
  sourceId: varchar("source_id"), // FK to reviews, blog_posts, etc.
  content: text("content").notNull(),
  platforms: text("platforms").array().notNull(), // Array of platform names
  accountIds: text("account_ids").array().notNull(), // Array of late_accounts IDs
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'published', 'failed'
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  createdBy: varchar("created_by"), // Admin user who created the post
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  sourceTypeIdx: index("late_posts_source_type_idx").on(table.sourceType),
  sourceIdIdx: index("late_posts_source_id_idx").on(table.sourceId),
  statusIdx: index("late_posts_status_idx").on(table.status),
  createdAtIdx: index("late_posts_created_at_idx").on(table.createdAt),
  latePostIdIdx: index("late_posts_late_post_id_idx").on(table.latePostId),
}));

export const insertLateProfileSchema = createInsertSchema(lateProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLateAccountSchema = createInsertSchema(lateAccounts).omit({
  id: true,
  connectedAt: true,
});

export const insertLatePostSchema = createInsertSchema(latePosts).omit({
  id: true,
  createdAt: true,
});

export type LateProfile = typeof lateProfiles.$inferSelect;
export type InsertLateProfile = z.infer<typeof insertLateProfileSchema>;
export type LateAccount = typeof lateAccounts.$inferSelect;
export type InsertLateAccount = z.infer<typeof insertLateAccountSchema>;
export type LatePost = typeof latePosts.$inferSelect;
export type InsertLatePost = z.infer<typeof insertLatePostSchema>;
