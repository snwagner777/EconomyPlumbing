import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  author: text("author").notNull().default("Economy Plumbing"),
  publishDate: timestamp("publish_date").notNull().defaultNow(),
  category: text("category").notNull(),
  featuredImage: text("featured_image"),
  metaDescription: text("meta_description"),
  published: boolean("published").notNull().default(true),
}, (table) => ({
  publishDateIdx: index("blog_posts_publish_date_idx").on(table.publishDate),
  categoryIdx: index("blog_posts_category_idx").on(table.category),
  publishedIdx: index("blog_posts_published_idx").on(table.published),
}));

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // in cents
  category: text("category").notNull(), // 'membership' or 'product'
  image: text("image"),
  stripeProductId: text("stripe_product_id"),
  stripePriceId: text("stripe_price_id"),
  features: text("features").array(),
  active: boolean("active").notNull().default(true),
  
  // ServiceTitan integration fields (for memberships)
  serviceTitanMembershipTypeId: text("service_titan_membership_type_id"), // Maps product to ST membership type
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
  customerType: text("customer_type").notNull(),
  customerName: text("customer_name"),
  companyName: text("company_name"),
  contactPersonName: text("contact_person_name"),
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
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
  
  // Structured address fields (required by ServiceTitan API)
  street: text("street").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zip: text("zip").notNull(),
  
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

export const insertServiceAreaSchema = createInsertSchema(serviceAreas).omit({
  id: true,
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
  companyCamPhotoId: text("companycam_photo_id").notNull().unique(),
  companyCamProjectId: text("companycam_project_id").notNull(),
  photoUrl: text("photo_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  
  // AI-generated categorization
  category: text("category").notNull(), // 'water_heater', 'drain', 'leak', 'toilet', 'faucet', 'gas', 'backflow', 'commercial', 'general'
  aiDescription: text("ai_description"), // What the AI sees in the photo
  tags: text("tags").array(), // Additional tags from AI analysis
  
  // Metadata
  uploadedAt: timestamp("uploaded_at"),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  
  // Usage tracking
  usedInBlogPostId: varchar("used_in_blog_post_id"),
  usedInPageUrl: text("used_in_page_url"),
}, (table) => ({
  categoryIdx: index("companycam_photos_category_idx").on(table.category),
  projectIdIdx: index("companycam_photos_project_id_idx").on(table.companyCamProjectId),
}));

export const insertCompanyCamPhotoSchema = createInsertSchema(companyCamPhotos).omit({
  id: true,
  fetchedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
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
