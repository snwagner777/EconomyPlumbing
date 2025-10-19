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
  street: text("street"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  active: boolean("active").notNull().default(true),
  balance: text("balance"), // Stored as text (ServiceTitan format)
  lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
}, (table) => ({
  activeIdx: index("st_customers_active_idx").on(table.active),
  typeIdx: index("st_customers_type_idx").on(table.type),
  lastSyncedIdx: index("st_customers_last_synced_idx").on(table.lastSyncedAt),
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
