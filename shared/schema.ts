import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index, bigint, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
}, (table) => ({
  submittedAtIdx: index("contact_submissions_submitted_at_idx").on(table.submittedAt),
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
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Referrer info (existing customer)
  referralCode: text("referral_code"), // The code used (e.g., "JOHN-SMITH") - links to referralCodes table
  referrerName: text("referrer_name").notNull(),
  referrerPhone: text("referrer_phone").notNull(),
  referrerCustomerId: integer("referrer_customer_id"), // ServiceTitan customer ID (null if not found yet)
  
  // Referee info (person being referred)
  refereeName: text("referee_name").notNull(),
  refereePhone: text("referee_phone").notNull(),
  refereeEmail: text("referee_email"),
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
  source: text("source").notNull().default('places_api'), // 'places_api', 'dataforseo', 'facebook', 'gmb_api'
  reviewId: text("review_id"), // External review ID for deduplication
}, (table) => ({
  ratingIdx: index("google_reviews_rating_idx").on(table.rating),
  timestampIdx: index("google_reviews_timestamp_idx").on(table.timestamp),
  sourceIdx: index("google_reviews_source_idx").on(table.source),
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

export const serviceTitanMemberships = pgTable("service_titan_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerType: text("customer_type").notNull(), // 'residential' or 'commercial'
  
  // Residential customer fields
  customerName: text("customer_name"),
  
  // Commercial customer fields
  companyName: text("company_name"),
  contactPersonName: text("contact_person_name"),
  locationPhone: text("location_phone"),
  extension: text("extension"),
  
  // Location address (both types)
  locationName: text("location_name"),
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  
  // Billing address (both types)
  billingName: text("billing_name"),
  billingStreet: text("billing_street"),
  billingCity: text("billing_city"),
  billingState: text("billing_state"),
  billingZip: text("billing_zip"),
  
  // Contact info
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  
  // ServiceTitan configuration
  serviceTitanMembershipTypeId: text("service_titan_membership_type_id").notNull(), // ST membership type from product
  
  // ServiceTitan IDs (populated after sync)
  serviceTitanCustomerId: text("service_titan_customer_id"), // ST customer ID
  serviceTitanMembershipId: text("service_titan_membership_id"), // ST membership ID
  serviceTitanInvoiceId: text("service_titan_invoice_id"), // ST invoice ID
  
  // Product and payment info
  productId: varchar("product_id").notNull(), // Links to products table
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),
  amount: integer("amount").notNull(), // Amount in cents
  
  // Sync status
  syncStatus: text("sync_status").notNull().default('pending'), // 'pending', 'syncing', 'synced', 'failed'
  syncError: text("sync_error"),
  lastSyncAttempt: timestamp("last_sync_attempt"),
  syncedAt: timestamp("synced_at"),
  
  // Timestamps
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
}, (table) => ({
  customerTypeIdx: index("st_memberships_customer_type_idx").on(table.customerType),
  syncStatusIdx: index("st_memberships_sync_status_idx").on(table.syncStatus),
  serviceTitanCustomerIdIdx: index("st_memberships_st_customer_id_idx").on(table.serviceTitanCustomerId),
  productIdIdx: index("st_memberships_product_id_idx").on(table.productId),
}));

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
  customerIdIdx: index("st_contacts_customer_id_idx").on(table.customerId),
  // Critical: Fast O(1) lookup by normalized phone/email
  normalizedValueIdx: index("st_contacts_normalized_value_idx").on(table.normalizedValue),
  contactTypeIdx: index("st_contacts_contact_type_idx").on(table.contactType),
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  channelKeyIdx: index("tracking_numbers_channel_key_idx").on(table.channelKey),
  isActiveIdx: index("tracking_numbers_is_active_idx").on(table.isActive),
  isDefaultIdx: index("tracking_numbers_is_default_idx").on(table.isDefault),
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

export const insertServiceTitanMembershipSchema = createInsertSchema(serviceTitanMemberships).omit({
  id: true,
  purchasedAt: true,
  lastSyncAttempt: true,
  syncedAt: true,
});

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

// Customer Portal Authentication (SMS codes and email magic links)
export const portalVerifications = pgTable("portal_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Verification details
  verificationType: text("verification_type").notNull(), // 'sms' or 'email'
  contactValue: text("contact_value").notNull(), // Phone number or email address
  
  // Code/token
  code: text("code").notNull(), // 6-digit code for SMS, UUID token for email
  
  // Customer info
  customerId: integer("customer_id").notNull(), // ServiceTitan customer ID
  
  // Verification status
  verified: boolean("verified").notNull().default(false),
  verifiedAt: timestamp("verified_at"),
  
  // Security & expiry
  expiresAt: timestamp("expires_at").notNull(), // 10 min for SMS, 1 hour for email
  attempts: integer("attempts").notNull().default(0), // Track failed attempts
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// Review requests sent to customers
export const reviewRequests = pgTable("review_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Customer info
  customerName: text("customer_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  serviceTitanCustomerId: integer("service_titan_customer_id"),
  serviceTitanJobId: integer("service_titan_job_id"), // The job that triggered this request
  
  // Request details
  method: text("method").notNull(), // 'email', 'sms', 'both'
  status: text("status").notNull().default('pending'), // 'pending', 'sent', 'failed', 'clicked', 'completed'
  uniqueToken: text("unique_token").notNull().unique(), // UUID for personalized review link
  
  // Tracking
  sentAt: timestamp("sent_at"),
  clickedAt: timestamp("clicked_at"), // When they clicked the review link
  completedAt: timestamp("completed_at"), // When they submitted the review
  reviewId: varchar("review_id"), // Links to customReviews table
  
  // Content sent
  emailSubject: text("email_subject"),
  emailBody: text("email_body"),
  smsBody: text("sms_body"),
  
  // Error tracking
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").notNull().default(0),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  automatedSend: boolean("automated_send").notNull().default(false), // Auto-sent after job vs manual
}, (table) => ({
  statusIdx: index("review_requests_status_idx").on(table.status),
  tokenIdx: index("review_requests_token_idx").on(table.uniqueToken),
  customerIdIdx: index("review_requests_customer_id_idx").on(table.serviceTitanCustomerId),
  createdAtIdx: index("review_requests_created_at_idx").on(table.createdAt),
}));

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

// ServiceTitan Jobs - Normalized job data for fast queries
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
  
  // Marketing automation personalization fields
  serviceCategory: varchar("service_category"), // 'Plumbing', 'Water Heater', 'Drain Cleaning', etc.
  equipmentInstalled: text("equipment_installed").array(), // ['Tankless Water Heater', 'Water Softener']
  customerSatisfaction: integer("customer_satisfaction"), // 1-5 rating
  campaignId: varchar("campaign_id"), // Links to email_campaigns for attribution
  
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
  campaignIdIdx: index("st_jobs_campaign_id_idx").on(table.campaignId),
}));

// Sync Watermarks - Track incremental sync progress
export const syncWatermarks = pgTable("sync_watermarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: varchar("sync_type").notNull().unique(), // 'customers', 'jobs', 'invoices'
  lastSuccessfulSyncAt: timestamp("last_successful_sync_at"), // Last successful sync completion
  lastModifiedOnFetched: timestamp("last_modified_on_fetched"), // Highest modifiedOn from last fetch (for incremental sync)
  recordsProcessed: integer("records_processed").notNull().default(0),
  syncDuration: integer("sync_duration"), // Duration in milliseconds
  lastError: text("last_error"),
  lastErrorAt: timestamp("last_error_at"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  syncTypeIdx: index("sync_watermarks_sync_type_idx").on(table.syncType),
}));

export const insertCustomReviewSchema = createInsertSchema(customReviews).omit({
  id: true,
  submittedAt: true,
  moderatedAt: true,
  moderatedBy: true,
});

export const insertReviewRequestSchema = createInsertSchema(reviewRequests).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  clickedAt: true,
  completedAt: true,
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
export type ServiceTitanMembership = typeof serviceTitanMemberships.$inferSelect;
export type InsertServiceTitanMembership = z.infer<typeof insertServiceTitanMembershipSchema>;
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
export type OAuthUser = typeof oauthUsers.$inferSelect;
export type UpsertOAuthUser = typeof oauthUsers.$inferInsert;
export type AdminWhitelist = typeof adminWhitelist.$inferSelect;
export type InsertAdminWhitelist = typeof adminWhitelist.$inferInsert;
export type OtpVerification = typeof otpVerifications.$inferSelect;
export type InsertOtpVerification = z.infer<typeof insertOtpVerificationSchema>;
export type CustomReview = typeof customReviews.$inferSelect;
export type InsertCustomReview = z.infer<typeof insertCustomReviewSchema>;
export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type InsertReviewRequest = z.infer<typeof insertReviewRequestSchema>;
export type ReviewPlatform = typeof reviewPlatforms.$inferSelect;
export type InsertReviewPlatform = z.infer<typeof insertReviewPlatformSchema>;
export type ServiceTitanJob = typeof serviceTitanJobs.$inferSelect;
export type ServiceTitanJobStaging = typeof serviceTitanJobsStaging.$inferSelect;
export type SyncWatermark = typeof syncWatermarks.$inferSelect;

// ============================================================================
// MARKETING AUTOMATION SYSTEM
// ============================================================================

// Customer Segments - AI-generated customer groups for targeted campaigns
export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "Unsold Water Heater Estimates", "Win-Back: 12+ Months"
  description: text("description").notNull(), // Detailed segment criteria
  segmentType: text("segment_type").notNull(), // 'evergreen' (runs forever) or 'one_time' (temporary)
  targetCriteria: jsonb("target_criteria").notNull(), // JSON criteria for auto-entry (e.g., {estimateAge: ">30 days", serviceType: "water heater"})
  
  // AI-generated metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(false),
  aiPrompt: text("ai_prompt"), // The prompt used to generate this segment
  aiReasoning: text("ai_reasoning"), // Why AI suggested this segment
  
  // Status
  status: text("status").notNull().default('active'), // 'active', 'paused', 'archived'
  memberCount: integer("member_count").notNull().default(0), // Cached count for performance
  
  // Performance metrics
  totalRevenue: integer("total_revenue").notNull().default(0), // Total revenue attributed to this segment (cents)
  totalJobsBooked: integer("total_jobs_booked").notNull().default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastRefreshedAt: timestamp("last_refreshed_at"), // Last time AI refreshed content for evergreen segments
}, (table) => ({
  segmentTypeIdx: index("customer_segments_type_idx").on(table.segmentType),
  statusIdx: index("customer_segments_status_idx").on(table.status),
  generatedByAIIdx: index("customer_segments_ai_idx").on(table.generatedByAI),
}));

// Segment Membership - Tracks which customers belong to which segments
export const segmentMembership = pgTable("segment_membership", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  segmentId: varchar("segment_id").notNull().references(() => customerSegments.id, { onDelete: 'cascade' }),
  serviceTitanCustomerId: integer("service_titan_customer_id").notNull(),
  
  // Customer snapshot (denormalized for performance)
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  
  // Entry/Exit tracking
  enteredAt: timestamp("entered_at").notNull().defaultNow(),
  exitedAt: timestamp("exited_at"), // null if still in segment
  entryReason: text("entry_reason"), // "New unsold estimate created", "12 months since last service"
  exitReason: text("exit_reason"), // "Job booked", "Estimate sold", "Manual removal"
  
  // Campaign tracking
  emailsSent: integer("emails_sent").notNull().default(0),
  emailsOpened: integer("emails_opened").notNull().default(0),
  emailsClicked: integer("emails_clicked").notNull().default(0),
  callsMade: integer("calls_made").notNull().default(0), // Tracked via phone number
  jobsBooked: integer("jobs_booked").notNull().default(0),
  revenueGenerated: integer("revenue_generated").notNull().default(0), // In cents
}, (table) => ({
  segmentCustomerIdx: index("segment_membership_segment_customer_idx").on(table.segmentId, table.serviceTitanCustomerId),
  customerIdIdx: index("segment_membership_customer_id_idx").on(table.serviceTitanCustomerId),
  exitedAtIdx: index("segment_membership_exited_at_idx").on(table.exitedAt), // Query active members (exitedAt IS NULL)
  enteredAtIdx: index("segment_membership_entered_at_idx").on(table.enteredAt),
}));

// Email Campaigns - Campaign definitions (evergreen or one-time)
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  segmentId: varchar("segment_id").notNull().references(() => customerSegments.id, { onDelete: 'cascade' }),
  
  // Campaign type
  campaignType: text("campaign_type").notNull(), // 'drip' (multi-email sequence), 'one_time' (single blast)
  isEvergreen: boolean("is_evergreen").notNull().default(false), // Runs forever vs one-time
  
  // ServiceTitan integration
  serviceTitanCampaignId: bigint("service_titan_campaign_id", { mode: 'number' }), // Created via Marketing API
  serviceTitanCampaignName: text("service_titan_campaign_name"),
  trackingPhoneNumber: text("tracking_phone_number"), // FREE ServiceTitan tracking number
  
  // Status & approval
  status: text("status").notNull().default('awaiting_phone_number'), // 'awaiting_phone_number', 'ready_to_send', 'active', 'paused', 'completed'
  approvedBy: varchar("approved_by"), // Admin user who approved
  approvedAt: timestamp("approved_at"),
  
  // AI-generated metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  hasOffer: boolean("has_offer").notNull().default(false), // Flags campaigns with discounts for approval
  offerDetails: jsonb("offer_details"), // {type: "percentage", value: 10, description: "$200 off water heaters"}
  offerApproved: boolean("offer_approved").default(false),
  
  // Performance metrics
  totalSent: integer("total_sent").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  totalCalls: integer("total_calls").notNull().default(0),
  totalJobsBooked: integer("total_jobs_booked").notNull().default(0),
  totalRevenue: integer("total_revenue").notNull().default(0), // In cents
  
  // Send limits & safety
  dailySendLimit: integer("daily_send_limit").notNull().default(500),
  sendEnabled: boolean("send_enabled").notNull().default(false), // MASTER SWITCH per campaign
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"), // When campaign went live
  completedAt: timestamp("completed_at"), // For one-time campaigns
}, (table) => ({
  segmentIdIdx: index("email_campaigns_segment_id_idx").on(table.segmentId),
  statusIdx: index("email_campaigns_status_idx").on(table.status),
  isEvergreenIdx: index("email_campaigns_evergreen_idx").on(table.isEvergreen),
  hasOfferIdx: index("email_campaigns_has_offer_idx").on(table.hasOffer),
  sendEnabledIdx: index("email_campaigns_send_enabled_idx").on(table.sendEnabled),
}));

// Campaign Emails - Individual emails in drip sequences
export const campaignEmails = pgTable("campaign_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: 'cascade' }),
  
  // Email sequence
  sequenceNumber: integer("sequence_number").notNull(), // 1, 2, 3 (Day 0, Day 3, Day 7)
  dayOffset: integer("day_offset").notNull(), // 0, 3, 7, 14 (days after customer enters segment)
  
  // Email content (with merge tags)
  subject: text("subject").notNull(), // "{firstName}, still thinking about that water heater?"
  preheader: text("preheader"), // Preview text
  htmlContent: text("html_content").notNull(), // HTML email body with {mergeTags}
  textContent: text("text_content").notNull(), // Plain text fallback
  
  // AI-generated metadata
  generatedByAI: boolean("generated_by_ai").notNull().default(false),
  aiPrompt: text("ai_prompt"),
  aiVersion: integer("ai_version").notNull().default(1), // Track content refresh versions for evergreen
  
  // A/B testing
  isVariant: boolean("is_variant").notNull().default(false), // true if this is an A/B test variant
  variantOf: varchar("variant_of"), // ID of original email
  testPercentage: integer("test_percentage"), // 50 = send to 50% of audience
  
  // Performance metrics
  totalSent: integer("total_sent").notNull().default(0),
  totalOpened: integer("total_opened").notNull().default(0),
  totalClicked: integer("total_clicked").notNull().default(0),
  totalUnsubscribed: integer("total_unsubscribed").notNull().default(0),
  totalBounced: integer("total_bounced").notNull().default(0),
  
  // Status
  enabled: boolean("enabled").notNull().default(true),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  campaignSequenceIdx: index("campaign_emails_campaign_sequence_idx").on(table.campaignId, table.sequenceNumber),
  variantOfIdx: index("campaign_emails_variant_of_idx").on(table.variantOf),
}));

// Email Send Log - Complete history of every email sent
export const emailSendLog = pgTable("email_send_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => emailCampaigns.id),
  campaignEmailId: varchar("campaign_email_id").notNull().references(() => campaignEmails.id),
  serviceTitanCustomerId: integer("service_titan_customer_id").notNull(),
  
  // Recipient info (denormalized)
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name").notNull(),
  
  // Personalization data used
  mergeTagData: jsonb("merge_tag_data").notNull(), // {firstName: "Sarah", lastServiceDate: "2023-10-15", ...}
  
  // Email provider details
  resendEmailId: text("resend_email_id"), // Resend's email ID for tracking
  resendStatus: text("resend_status"), // 'queued', 'sent', 'delivered', 'bounced', 'complained'
  
  // Tracking events
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  bouncedAt: timestamp("bounced_at"),
  complainedAt: timestamp("complained_at"), // Spam complaint
  unsubscribedAt: timestamp("unsubscribed_at"),
  
  // Error tracking
  errorMessage: text("error_message"),
  
  // Attribution
  leadToJobBooking: boolean("lead_to_job_booking").notNull().default(false), // Did this email result in a job?
  jobId: bigint("job_id", { mode: 'number' }), // ServiceTitan job ID if booked
  revenueAttributed: integer("revenue_attributed").notNull().default(0), // In cents
}, (table) => ({
  campaignCustomerIdx: index("email_send_log_campaign_customer_idx").on(table.campaignId, table.serviceTitanCustomerId),
  sentAtIdx: index("email_send_log_sent_at_idx").on(table.sentAt),
  resendEmailIdIdx: index("email_send_log_resend_id_idx").on(table.resendEmailId),
}));

// Email Preferences - Unsubscribe categories per customer
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceTitanCustomerId: integer("service_titan_customer_id").unique(),
  email: text("email").notNull(),
  
  // Unsubscribe categories (granular control)
  unsubscribedMarketing: boolean("unsubscribed_marketing").notNull().default(false), // Promotional emails
  unsubscribedReviews: boolean("unsubscribed_reviews").notNull().default(false), // Review requests
  unsubscribedServiceReminders: boolean("unsubscribed_service_reminders").notNull().default(false), // Annual maintenance reminders
  unsubscribedReferrals: boolean("unsubscribed_referrals").notNull().default(false), // Referral program emails
  
  // Global unsubscribe
  unsubscribedAll: boolean("unsubscribed_all").notNull().default(false), // Opted out of everything
  
  // Preference metadata
  preferredContactMethod: text("preferred_contact_method"), // 'email', 'sms', 'phone'
  languagePreference: text("language_preference").default('en'), // 'en', 'es'
  
  // Tracking
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
  source: text("source"), // 'preference_center', 'one_click_unsubscribe', 'complaint'
}, (table) => ({
  emailIdx: index("email_preferences_email_idx").on(table.email),
  customerIdIdx: index("email_preferences_customer_id_idx").on(table.serviceTitanCustomerId),
}));

// Email Suppression List - Hard bounces, spam complaints (NEVER email these)
export const emailSuppressionList = pgTable("email_suppression_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  
  // Suppression reason
  reason: text("reason").notNull(), // 'hard_bounce', 'spam_complaint', 'manual_suppression', 'invalid_email'
  reasonDetails: text("reason_details"), // Additional context
  
  // Source tracking
  resendEmailId: text("resend_email_id"), // Email that triggered suppression
  campaignId: varchar("campaign_id"), // Campaign that triggered suppression
  
  // Timestamps
  addedAt: timestamp("added_at").notNull().defaultNow(),
  lastAttemptedAt: timestamp("last_attempted_at"), // Last time we tried to email (for debugging)
}, (table) => ({
  emailIdx: index("email_suppression_list_email_idx").on(table.email),
  reasonIdx: index("email_suppression_list_reason_idx").on(table.reason),
}));

// Review Link Clicks - Track every review button click for remarketing
export const reviewLinkClicks = pgTable("review_link_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Customer info
  serviceTitanCustomerId: integer("service_titan_customer_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  
  // Click details
  platformClicked: text("platform_clicked").notNull(), // 'google', 'facebook', 'yelp', 'bbb'
  sourcePage: text("source_page").notNull(), // '/request-review' or '/customer-portal'
  
  // Conversion tracking
  conversionStatus: text("conversion_status").notNull().default('pending'), // 'pending', 'reviewed', 'expired'
  matchedReviewId: varchar("matched_review_id"), // Link to customReviews when they submit
  reviewedAt: timestamp("reviewed_at"),
  
  // Remarketing tracking
  remarketingEmailsSent: integer("remarketing_emails_sent").notNull().default(0),
  lastRemarketingEmailAt: timestamp("last_remarketing_email_at"),
  
  // Analytics
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  // Timestamps
  clickedAt: timestamp("clicked_at").notNull().defaultNow(),
}, (table) => ({
  customerIdIdx: index("review_link_clicks_customer_id_idx").on(table.serviceTitanCustomerId),
  platformIdx: index("review_link_clicks_platform_idx").on(table.platformClicked),
  conversionStatusIdx: index("review_link_clicks_conversion_idx").on(table.conversionStatus),
  clickedAtIdx: index("review_link_clicks_clicked_at_idx").on(table.clickedAt),
}));

// ServiceTitan Job Forms - Technician notes and recommendations for AI analysis
export const serviceTitanJobForms = pgTable("service_titan_job_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: bigint("form_id", { mode: 'number' }).notNull().unique(), // ServiceTitan form ID
  jobId: bigint("job_id", { mode: 'number' }).notNull(),
  customerId: integer("customer_id").notNull(),
  
  // Form metadata
  formTemplateId: bigint("form_template_id", { mode: 'number' }),
  formTemplateName: text("form_template_name"),
  
  // Form data (raw + parsed)
  rawFormData: jsonb("raw_form_data").notNull(), // Complete form object from API
  parsedFields: jsonb("parsed_fields").notNull(), // {fieldName: value} for easy querying
  
  // Key extracted fields (for fast querying without parsing JSON)
  technicianNotes: text("technician_notes"), // Combined notes from all fields
  customerConcerns: text("customer_concerns").array(), // ["water heater aging", "low water pressure"]
  recommendationsMade: text("recommendations_made").array(), // ["Replace water heater within 1 year", "Consider water softener"]
  equipmentCondition: text("equipment_condition"), // "Good", "Fair", "Poor", "Critical"
  
  // Timestamps
  submittedOn: timestamp("submitted_on").notNull(),
  submittedBy: text("submitted_by"), // Technician name
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  jobIdIdx: index("st_job_forms_job_id_idx").on(table.jobId),
  customerIdIdx: index("st_job_forms_customer_id_idx").on(table.customerId),
  formIdIdx: index("st_job_forms_form_id_idx").on(table.formId),
  equipmentConditionIdx: index("st_job_forms_equipment_condition_idx").on(table.equipmentCondition),
}));

// Audience Movement Logs - Complete audit trail of segment entry/exit
export const audienceMovementLogs = pgTable("audience_movement_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  segmentId: varchar("segment_id").notNull().references(() => customerSegments.id),
  serviceTitanCustomerId: integer("service_titan_customer_id").notNull(),
  
  // Customer snapshot (denormalized)
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  
  // Movement details
  action: text("action").notNull(), // 'entered', 'exited'
  reason: text("reason").notNull(), // "New unsold estimate created", "Job booked", "Manual addition"
  triggeringEvent: text("triggering_event"), // "estimate_created", "job_completed", "manual"
  eventData: jsonb("event_data"), // Additional context {estimateId: 123, jobId: 456}
  
  // Attribution
  campaignId: varchar("campaign_id"), // Campaign that triggered this (if applicable)
  
  // Timestamp
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
}, (table) => ({
  segmentCustomerIdx: index("audience_movement_logs_segment_customer_idx").on(table.segmentId, table.serviceTitanCustomerId),
  occurredAtIdx: index("audience_movement_logs_occurred_at_idx").on(table.occurredAt),
  actionIdx: index("audience_movement_logs_action_idx").on(table.action),
}));

// System Settings for Marketing Automation
export const marketingSystemSettings = pgTable("marketing_system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: varchar("updated_by"),
});

// Insert schemas and types
export const insertCustomerSegmentSchema = createInsertSchema(customerSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastRefreshedAt: true,
});

export const insertSegmentMembershipSchema = createInsertSchema(segmentMembership).omit({
  id: true,
  enteredAt: true,
  exitedAt: true,
});

export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertCampaignEmailSchema = createInsertSchema(campaignEmails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmailSendLogSchema = createInsertSchema(emailSendLog).omit({
  id: true,
  sentAt: true,
  deliveredAt: true,
  openedAt: true,
  clickedAt: true,
  bouncedAt: true,
  complainedAt: true,
  unsubscribedAt: true,
});

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  lastUpdatedAt: true,
});

export const insertEmailSuppressionSchema = createInsertSchema(emailSuppressionList).omit({
  id: true,
  addedAt: true,
  lastAttemptedAt: true,
});

export const insertReviewLinkClickSchema = createInsertSchema(reviewLinkClicks).omit({
  id: true,
  clickedAt: true,
  reviewedAt: true,
  lastRemarketingEmailAt: true,
});

export const insertServiceTitanJobFormSchema = createInsertSchema(serviceTitanJobForms).omit({
  id: true,
  lastSyncedAt: true,
});

export const insertAudienceMovementLogSchema = createInsertSchema(audienceMovementLogs).omit({
  id: true,
  occurredAt: true,
});

export const insertMarketingSystemSettingSchema = createInsertSchema(marketingSystemSettings).omit({
  id: true,
  updatedAt: true,
});

// Export types
export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;
export type SegmentMembership = typeof segmentMembership.$inferSelect;
export type InsertSegmentMembership = z.infer<typeof insertSegmentMembershipSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type CampaignEmail = typeof campaignEmails.$inferSelect;
export type InsertCampaignEmail = z.infer<typeof insertCampaignEmailSchema>;
export type EmailSendLog = typeof emailSendLog.$inferSelect;
export type InsertEmailSendLog = z.infer<typeof insertEmailSendLogSchema>;
export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type EmailSuppression = typeof emailSuppressionList.$inferSelect;
export type InsertEmailSuppression = z.infer<typeof insertEmailSuppressionSchema>;
export type ReviewLinkClick = typeof reviewLinkClicks.$inferSelect;
export type InsertReviewLinkClick = z.infer<typeof insertReviewLinkClickSchema>;
export type ServiceTitanJobForm = typeof serviceTitanJobForms.$inferSelect;
export type InsertServiceTitanJobForm = z.infer<typeof insertServiceTitanJobFormSchema>;
export type AudienceMovementLog = typeof audienceMovementLogs.$inferSelect;
export type InsertAudienceMovementLog = z.infer<typeof insertAudienceMovementLogSchema>;
export type MarketingSystemSetting = typeof marketingSystemSettings.$inferSelect;
export type InsertMarketingSystemSetting = z.infer<typeof insertMarketingSystemSettingSchema>;
