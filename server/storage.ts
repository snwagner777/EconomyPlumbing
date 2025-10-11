import { 
  type User, 
  type InsertUser,
  type BlogPost,
  type InsertBlogPost,
  type Product,
  type InsertProduct,
  type ContactSubmission,
  type InsertContactSubmission,
  type CustomerSuccessStory,
  type InsertCustomerSuccessStory,
  type ServiceArea,
  type InsertServiceArea,
  type GoogleReview,
  type InsertGoogleReview,
  type GoogleOAuthToken,
  type InsertGoogleOAuthToken,
  type PendingPurchase,
  type InsertPendingPurchase,
  type ServiceTitanMembership,
  type InsertServiceTitanMembership,
  type CompanyCamPhoto,
  type InsertCompanyCamPhoto,
  type BeforeAfterComposite,
  type InsertBeforeAfterComposite,
  type NotFoundError,
  type InsertNotFoundError,
  type ImportedPhoto,
  type InsertImportedPhoto,
  type TrackingNumber,
  type InsertTrackingNumber,
  type CommercialCustomer,
  type InsertCommercialCustomer,
  type PageMetadata,
  type InsertPageMetadata,
  type OAuthUser,
  type UpsertOAuthUser,
  type AdminWhitelist,
  type InsertAdminWhitelist,
  users,
  blogPosts,
  products,
  contactSubmissions,
  customerSuccessStories,
  serviceAreas,
  googleReviews,
  googleOAuthTokens,
  pendingPurchases,
  serviceTitanMemberships,
  companyCamPhotos,
  beforeAfterComposites,
  notFoundErrors,
  importedPhotos,
  trackingNumbers,
  commercialCustomers,
  pageMetadata,
  oauthUsers,
  adminWhitelist
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Blog posts
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  // Contact submissions
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  
  // Customer success stories
  createCustomerSuccessStory(story: InsertCustomerSuccessStory): Promise<CustomerSuccessStory>;
  getApprovedSuccessStories(): Promise<CustomerSuccessStory[]>;
  getAllSuccessStories(): Promise<CustomerSuccessStory[]>;
  approveSuccessStory(id: string, collagePhotoUrl: string): Promise<CustomerSuccessStory>;
  unapproveSuccessStory(id: string): Promise<CustomerSuccessStory>;
  deleteSuccessStory(id: string): Promise<void>;
  
  // Service areas
  getServiceAreaBySlug(slug: string): Promise<ServiceArea | undefined>;
  getAllServiceAreas(): Promise<ServiceArea[]>;
  createServiceArea(area: InsertServiceArea): Promise<ServiceArea>;
  
  // Google reviews
  getGoogleReviews(): Promise<GoogleReview[]>;
  saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<void>;
  deleteGoogleReviews(ids: string[]): Promise<void>;
  clearGoogleReviews(): Promise<void>;
  replaceGoogleReviews(reviews: InsertGoogleReview[]): Promise<void>;
  
  // Google OAuth tokens
  getGoogleOAuthToken(service?: string): Promise<GoogleOAuthToken | undefined>;
  saveGoogleOAuthToken(token: InsertGoogleOAuthToken): Promise<GoogleOAuthToken>;
  updateGoogleOAuthToken(id: string, token: Partial<InsertGoogleOAuthToken>): Promise<GoogleOAuthToken>;
  
  // ServiceTitan memberships
  createServiceTitanMembership(membership: InsertServiceTitanMembership): Promise<ServiceTitanMembership>;
  updateServiceTitanMembership(id: string, updates: Partial<ServiceTitanMembership>): Promise<ServiceTitanMembership>;
  getServiceTitanMembershipById(id: string): Promise<ServiceTitanMembership | undefined>;
  getPendingServiceTitanMemberships(): Promise<ServiceTitanMembership[]>;
  
  // Pending purchases
  createPendingPurchase(purchase: InsertPendingPurchase): Promise<PendingPurchase>;
  getPendingPurchaseByPaymentIntent(paymentIntentId: string): Promise<PendingPurchase | undefined>;
  deletePendingPurchase(id: string): Promise<void>;
  
  // CompanyCam/ServiceTitan photos
  savePhotos(photos: InsertCompanyCamPhoto[]): Promise<CompanyCamPhoto[]>;
  getAllPhotos(): Promise<CompanyCamPhoto[]>;
  getPhotosByCategory(category: string): Promise<CompanyCamPhoto[]>;
  getPhotosByJob(jobId: string): Promise<CompanyCamPhoto[]>;
  getUnusedPhotos(category?: string): Promise<CompanyCamPhoto[]>;
  getPhotosWithoutBlogTopic(): Promise<CompanyCamPhoto[]>;
  getPhotoById(id: string): Promise<CompanyCamPhoto | undefined>;
  markPhotoAsUsed(id: string, blogPostId?: string, pageUrl?: string): Promise<CompanyCamPhoto>;
  updatePhotoWithBlogTopic(id: string, topic: string): Promise<CompanyCamPhoto>;
  
  // Before/After composites
  saveBeforeAfterComposite(composite: InsertBeforeAfterComposite): Promise<BeforeAfterComposite>;
  getBeforeAfterComposites(): Promise<BeforeAfterComposite[]>;
  getUnusedComposites(): Promise<BeforeAfterComposite[]>;
  markCompositeAsPosted(id: string, facebookPostId: string | null, instagramPostId: string | null): Promise<BeforeAfterComposite>;
  
  // 404 Error tracking
  create404Error(error: InsertNotFoundError): Promise<NotFoundError>;
  get404Errors(limit?: number): Promise<NotFoundError[]>;
  
  // Imported Photos (Google Drive)
  createImportedPhoto(photo: InsertImportedPhoto): Promise<ImportedPhoto>;
  getAllImportedPhotos(): Promise<ImportedPhoto[]>;
  
  // Tracking Numbers (Dynamic Phone Numbers)
  getAllTrackingNumbers(): Promise<TrackingNumber[]>;
  getActiveTrackingNumbers(): Promise<TrackingNumber[]>;
  getTrackingNumberByKey(channelKey: string): Promise<TrackingNumber | undefined>;
  getDefaultTrackingNumber(): Promise<TrackingNumber | undefined>;
  createTrackingNumber(number: InsertTrackingNumber): Promise<TrackingNumber>;
  updateTrackingNumber(id: string, updates: Partial<InsertTrackingNumber>): Promise<TrackingNumber>;
  deleteTrackingNumber(id: string): Promise<void>;
  
  // Commercial Customers
  getActiveCommercialCustomers(): Promise<CommercialCustomer[]>;
  getAllCommercialCustomers(): Promise<CommercialCustomer[]>;
  getCommercialCustomerById(id: string): Promise<CommercialCustomer | undefined>;
  createCommercialCustomer(customer: InsertCommercialCustomer): Promise<CommercialCustomer>;
  updateCommercialCustomer(id: string, updates: Partial<InsertCommercialCustomer>): Promise<CommercialCustomer>;
  deleteCommercialCustomer(id: string): Promise<void>;
  
  // Page Metadata
  getAllPageMetadata(): Promise<PageMetadata[]>;
  getPageMetadataByPath(path: string): Promise<PageMetadata | undefined>;
  upsertPageMetadata(metadata: InsertPageMetadata): Promise<PageMetadata>;
  deletePageMetadata(id: string): Promise<void>;
  
  // OAuth Users
  getOAuthUser(id: string): Promise<OAuthUser | undefined>;
  upsertOAuthUser(user: UpsertOAuthUser): Promise<OAuthUser>;
  
  // Admin Whitelist
  isEmailWhitelisted(email: string): Promise<boolean>;
  addToWhitelist(data: InsertAdminWhitelist): Promise<AdminWhitelist>;
  removeFromWhitelist(email: string): Promise<void>;
  getAllWhitelistedEmails(): Promise<AdminWhitelist[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private blogPosts: Map<string, BlogPost>;
  private products: Map<string, Product>;
  private contactSubmissions: Map<string, ContactSubmission>;
  private customerSuccessStories: Map<string, CustomerSuccessStory>;
  private serviceAreas: Map<string, ServiceArea>;
  private googleReviews: Map<string, GoogleReview>;
  private serviceTitanMemberships: Map<string, ServiceTitanMembership>;

  constructor() {
    this.users = new Map();
    this.blogPosts = new Map();
    this.products = new Map();
    this.contactSubmissions = new Map();
    this.customerSuccessStories = new Map();
    this.serviceAreas = new Map();
    this.googleReviews = new Map();
    this.serviceTitanMemberships = new Map();
    
    // Seed with some blog posts
    this.seedBlogPosts();
    this.seedProducts();
    this.seedServiceAreas();
  }

  private seedBlogPosts() {
    const posts: BlogPost[] = [
      {
        id: randomUUID(),
        title: "3 Steps to Drain Restoration",
        slug: "3-steps-to-drain-restoration",
        content: `Drain problems can escalate quickly if not addressed properly. Homeowners in Austin and Marble Falls often face significant issues with their drainage systems. Regular drain cleaning and maintenance are essential not only for optimal plumbing function but also for preventing costly repairs down the line. This comprehensive guide will walk you through the steps of drain cleaning, maintenance, and restoration, ensuring your plumbing system remains efficient.

## Step 1: Assessment and Inspection

The first step in drain restoration is a thorough assessment of your drainage system. This involves identifying problem areas, understanding the root cause of blockages, and determining the best course of action. Professional plumbers use advanced camera inspection technology to get a clear view of what's happening inside your pipes.

During the inspection phase, we look for:

- Tree root intrusion
- Pipe damage or deterioration
- Grease and debris buildup
- Structural issues affecting drainage
- Foreign objects causing blockages

## Step 2: Professional Cleaning and Clearing

Once we've identified the issues, the next step is professional cleaning and clearing. This involves using specialized equipment and techniques to remove blockages and restore proper flow. Depending on the severity of the problem, we may use:

- **Hydro Jetting:** High-pressure water cleaning that removes stubborn blockages and buildup
- **Rooter Services:** Mechanical cutting tools to remove tree roots and tough obstructions
- **Chemical Treatments:** Safe, professional-grade solutions for specific types of blockages
- **Manual Removal:** Physical extraction of foreign objects and debris

Our team at Economy Plumbing Services uses environmentally safe methods that won't damage your pipes or harm the surrounding environment. We take care to protect your property while ensuring thorough cleaning.

## Step 3: Prevention and Maintenance

The final step in drain restoration is establishing a prevention and maintenance plan. This is crucial for avoiding future problems and extending the life of your drainage system. Regular maintenance is far more cost-effective than emergency repairs.

Our maintenance recommendations include:

- Regular professional drain cleaning (annually or bi-annually)
- Proper disposal of grease and food waste
- Installing drain screens and filters
- Being mindful of what goes down your drains
- Scheduling periodic inspections

## Why Choose Professional Drain Restoration?

While DIY drain cleaning products are readily available, professional drain restoration offers several advantages:

- **Thorough Solutions:** We address the root cause, not just the symptoms
- **Advanced Equipment:** Professional-grade tools that homeowners don't have access to
- **Safety:** Proper handling of chemicals and equipment
- **Long-term Results:** Solutions that last longer than temporary fixes
- **Warranty Protection:** Professional work comes with guarantees

## Serving Austin and Marble Falls

At Economy Plumbing Services, we understand the unique challenges that Central Texas homeowners face with their drainage systems. From the clay soils common in Austin to the limestone terrain around Marble Falls, we have the experience and expertise to handle any drain restoration project.

Our team is available for both emergency drain cleaning and scheduled maintenance services. We pride ourselves on transparent pricing, quality workmanship, and customer satisfaction.

### Need Professional Drain Restoration?

Don't let drain problems escalate into costly repairs. Contact Economy Plumbing Services today for professional drain cleaning, restoration, and maintenance services in Austin and Marble Falls.

Call (512) 368-9159 or schedule service online.`,
        excerpt: "Learn the three essential steps to professional drain restoration and how to prevent future plumbing problems.",
        author: "Economy Plumbing",
        publishDate: new Date("2025-05-20"),
        category: "Drain Cleaning",
        featuredImage: "/attached_assets/stock_images/professional_plumber_f5e4b5a9.jpg",
        metaDescription: "Professional drain restoration in 3 steps. Expert drain cleaning services in Austin and Marble Falls from Economy Plumbing.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      },
      {
        id: randomUUID(),
        title: "Backflow: Why You Should Hire a Plumber",
        slug: "backflow-why-you-should-hire-a-plumber",
        content: `When it comes to safeguarding your property's plumbing system, backflow testing is one of the most critical maintenance tasks to consider. In the dynamic ecosystems of Austin and Marble Falls, water quality is paramount for both residential and commercial properties. Hiring a specialized plumber, like Economy Plumbing Services, for backflow testing, maintenance, and repairs not only enhances your plumbing system's efficiency but also ensures the safety of your water supply.

## What is Backflow?

Backflow occurs when water flows in the opposite direction from its intended path in a plumbing system. This can happen due to changes in water pressure, creating a situation where contaminated water can enter your clean water supply. This poses serious health risks and can compromise the safety of your drinking water.

There are two main types of backflow:

- **Backpressure:** When downstream pressure exceeds upstream pressure
- **Backsiphonage:** When upstream pressure drops below downstream pressure

## Why Professional Backflow Testing is Essential

Backflow testing requires specialized knowledge, equipment, and certification. Here's why you should always hire a professional plumber for this critical service:

### 1. Legal Compliance

In Texas, backflow testing is required by law for many commercial and residential properties. Professional plumbers are certified to perform these tests and provide the necessary documentation to local authorities. Failure to comply can result in fines and water service disconnection.

### 2. Specialized Equipment

Backflow testing requires precision instruments that measure water pressure and flow rates. Professional plumbers have access to calibrated testing equipment that ensures accurate results. This equipment is expensive and requires regular calibration, making it impractical for homeowners to purchase.

### 3. Expert Knowledge

Understanding backflow prevention systems requires extensive training and experience. Professional plumbers know how to identify potential problems, interpret test results, and recommend appropriate solutions. They can spot issues that untrained individuals might miss.

### 4. Safety Considerations

Backflow testing involves working with water systems under pressure. Improper handling can lead to injuries or damage to your plumbing system. Professional plumbers have the training and experience to perform these tests safely.

## The Backflow Testing Process

When you hire Economy Plumbing Services for backflow testing, here's what you can expect:

1. **Initial Inspection:** We examine your backflow prevention device and surrounding plumbing
2. **Pressure Testing:** Using specialized gauges, we test the device under various pressure conditions
3. **Flow Testing:** We verify that water flows in the correct direction under all circumstances
4. **Documentation:** We provide detailed reports and submit required paperwork to local authorities
5. **Recommendations:** If issues are found, we provide clear recommendations for repairs or replacements

## Common Backflow Prevention Devices

There are several types of backflow prevention devices, each designed for specific applications:

- **Reduced Pressure Zone (RPZ) Assemblies:** Highest level of protection, required for high-hazard applications
- **Double Check Valve Assemblies:** Suitable for low to moderate hazard applications
- **Pressure Vacuum Breakers:** Used for irrigation systems and other specific applications
- **Atmospheric Vacuum Breakers:** Simple devices for basic protection

## When to Schedule Backflow Testing

Most jurisdictions require annual backflow testing, but there are other times when testing may be necessary:

- After installation of a new backflow prevention device
- Following any repairs or maintenance to the device
- When there are changes to your water system
- If you notice unusual water pressure or quality issues
- As part of regular preventive maintenance

## Protecting Austin and Marble Falls Water Systems

At Economy Plumbing Services, we understand the unique challenges of maintaining water quality in Central Texas. Our certified technicians are experienced in testing and maintaining all types of backflow prevention devices. We work with residential, commercial, and industrial clients to ensure their water systems remain safe and compliant.

Our backflow services include:

- Annual backflow testing and certification
- Backflow device installation and replacement
- Emergency backflow repairs
- Compliance documentation and reporting
- Preventive maintenance programs

### Schedule Your Backflow Testing Today

Don't risk your water quality or legal compliance. Contact Economy Plumbing Services to schedule professional backflow testing and ensure your water system is safe and compliant.

Call (512) 368-9159 or schedule service online.`,
        excerpt: "Understanding the importance of professional backflow testing and why it's essential for protecting your water supply.",
        author: "Economy Plumbing",
        publishDate: new Date("2025-05-15"),
        category: "Backflow Testing",
        featuredImage: "/attached_assets/stock_images/professional_plumber_13d3a463.jpg",
        metaDescription: "Learn why professional backflow testing is essential for water safety. Expert backflow services in Austin and Marble Falls.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      },
      {
        id: randomUUID(),
        title: "Clara's Story",
        slug: "claras-story",
        content: `A real customer experience with Economy Plumbing Services in Austin, Texas.

In the heart of Austin, a busy professional named Clara Jacobs found herself facing an all-too-familiar frustration: a clogged kitchen sink. After a search for a reliable plumber, she chose Economy Plumbing Services, known for their exceptional service and transparent pricing.

## The Problem

Clara's kitchen sink had been draining slowly for weeks, but she kept putting off calling a plumber, hoping the problem would resolve itself. Like many busy professionals in Austin, she was juggling work deadlines and family responsibilities, leaving little time to deal with household maintenance issues.

One morning, the inevitable happened – the sink stopped draining completely. Standing water filled with food particles and grease created an unsanitary mess that made her kitchen unusable. Clara knew she couldn't delay any longer.

## Finding the Right Plumber

Clara began her search online, looking for a reputable plumbing company in Austin. She read reviews, compared prices, and called several companies for quotes. What set Economy Plumbing Services apart was their immediate response, transparent pricing, and genuine concern for her situation.

"When I called Economy Plumbing Services, they didn't just give me a generic response," Clara recalls. "They asked specific questions about my problem, explained what might be causing it, and gave me a clear timeline for when they could come out."

## The Solution

Sean Wagner, the lead technician from Economy Plumbing Services, arrived at Clara's home within the promised timeframe. He quickly diagnosed the problem: a combination of grease buildup and food particles had created a stubborn blockage deep in the drain line.

"Sean was incredibly professional and knowledgeable," Clara says. "He explained exactly what was wrong, showed me the blockage using his camera equipment, and outlined the best approach to fix it permanently."

Using professional-grade drain cleaning equipment, Sean cleared the blockage completely and performed a thorough inspection of the entire drain system to ensure there were no other issues lurking beneath the surface.

## Beyond the Fix

What impressed Clara most was that Sean didn't just fix the immediate problem – he took time to educate her about proper drain maintenance. He provided practical tips for preventing future clogs and recommended simple maintenance practices that would keep her drains flowing smoothly.

"Sean gave me a list of do's and don'ts for kitchen sink maintenance. He explained why certain things shouldn't go down the drain and showed me how to perform simple maintenance that would prevent future problems. It was like getting a mini-education in plumbing care."

## The Economy Plumbing Difference

Clara's experience with Economy Plumbing Services exemplifies what sets the company apart in the competitive Austin plumbing market:

- **Transparent Pricing:** No hidden fees or surprise charges
- **Professional Expertise:** Experienced technicians who diagnose problems accurately
- **Customer Education:** Taking time to help customers understand their plumbing systems
- **Reliable Service:** Showing up on time and completing work as promised
- **Long-term Solutions:** Fixing problems properly the first time

## A Lasting Relationship

Six months after the initial service call, Clara's kitchen sink continues to drain perfectly. More importantly, she now has a trusted plumbing partner she can rely on for any future issues.

"I've already recommended Economy Plumbing Services to several friends and neighbors," Clara says. "When you find a company that treats you fairly, does quality work, and stands behind their service, you want to share that with others."

#### Experience the Economy Plumbing Difference

Like Clara, you can trust Economy Plumbing Services for reliable, professional plumbing solutions in Austin and surrounding areas. We're committed to providing transparent pricing, quality workmanship, and exceptional customer service.

Call (512) 368-9159 or schedule service online.`,
        excerpt: "Read how Economy Plumbing Services helped Clara solve her kitchen drain problem with professional service and expert care.",
        author: "Economy Plumbing",
        publishDate: new Date("2025-06-03"),
        category: "Customer Stories",
        featuredImage: "/attached_assets/stock_images/flooded_kitchen_wate_26c22e36.jpg",
        metaDescription: "Customer success story: How Economy Plumbing Services solved Clara's kitchen drain problem in Austin, TX.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      },
      {
        id: randomUUID(),
        title: "Fall Plumbing Tips",
        slug: "fall-plumbing-tips",
        content: `Essential fall maintenance tips to keep your plumbing system running smoothly through the colder months.

## Fall Plumbing Tips for Homeowners

As the temperatures begin to drop and fall settles in across Central Texas, it's the perfect time to prepare your plumbing system for the cooler months ahead. Taking proactive steps now can prevent costly repairs and ensure your home's plumbing continues to function efficiently throughout the fall and winter seasons.

### Protect Your Pipes from Temperature Drops

Even in Texas, unexpected cold snaps can cause serious damage to your plumbing. Insulate exposed pipes in crawl spaces, basements, and exterior walls. Pay special attention to pipes in unheated areas like garages and attics.

### Clean Your Gutters and Downspouts

Falling leaves can quickly clog gutters and downspouts, leading to water backup and potential foundation issues. Regular cleaning prevents water from pooling around your home's foundation, which can affect your plumbing system.

### Check Your Water Heater

As temperatures drop, your water heater will work harder to maintain comfortable water temperatures. Schedule a professional inspection to ensure it's operating efficiently. Consider flushing the tank to remove sediment buildup that can reduce efficiency.

### Inspect Outdoor Faucets and Hoses

Disconnect and drain garden hoses to prevent freezing. Check outdoor faucets for leaks and consider installing frost-proof spigots if you don't already have them. Turn off water supply to outdoor faucets if possible.

### Schedule Professional Maintenance

Fall is an ideal time to schedule professional plumbing maintenance. A qualified plumber can identify potential issues before they become major problems, saving you money and preventing inconvenient breakdowns during colder weather.

#### Need Professional Help?

Economy Plumbing Services is here to help you prepare your plumbing system for fall and winter. Our experienced technicians can perform comprehensive inspections and maintenance to keep your system running smoothly.

Call (512) 368-9159 or schedule service online.`,
        excerpt: "Prepare your plumbing for fall and winter with these essential maintenance tips from Economy Plumbing Services.",
        author: "Economy Plumbing",
        publishDate: new Date("2024-10-15"),
        category: "Seasonal Tips",
        featuredImage: "/attached_assets/stock_images/autumn_fall_home_mai_feea54cb.jpg",
        metaDescription: "Essential fall plumbing tips for Central Texas homeowners. Prepare your plumbing system for cooler weather.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      },
      {
        id: randomUUID(),
        title: "Rubber Washing Machine Hoses: Why They Should Be Replaced",
        slug: "rubber-washing-machine-hoses-why-they-should-be-replaced",
        content: `When it comes to household plumbing emergencies, rubber washing machine hoses are the number one culprits behind insurance claims for water damage. These failures can lead to devastating floods, costing homeowners an average of $10,000 or more. If you reside in the Austin area, including Leander, Round Rock, Pflugerville, or Marble Falls, it is crucial to understand the risks associated with these hoses and the steps you can take to prevent such disasters.

## The Hidden Danger in Your Laundry Room

Most homeowners never give their washing machine hoses a second thought – until disaster strikes. These seemingly innocent rubber tubes carry water under significant pressure, and when they fail, they can release hundreds of gallons of water into your home within minutes.

The statistics are sobering: washing machine hose failures account for more than $150 million in property damage annually in the United States. In Central Texas, where many homes have washing machines located on upper floors or in interior rooms, the potential for extensive damage is even greater.

## Why Rubber Hoses Fail

Several factors contribute to rubber washing machine hose failures:

### Age and Deterioration

Rubber hoses typically last 3-5 years before the material begins to deteriorate. Over time, the rubber becomes brittle, develops cracks, and loses its ability to withstand water pressure. Many homeowners use the same hoses for 10+ years without replacement, significantly increasing the risk of failure.

### Constant Pressure

Unlike other plumbing fixtures that experience intermittent water flow, washing machine hoses are under constant pressure when the water supply valves are open. This continuous stress accelerates wear and increases the likelihood of sudden failure.

### Temperature Fluctuations

The hot water supply to washing machines can reach temperatures of 140°F or higher. These temperature extremes cause rubber to expand and contract repeatedly, leading to fatigue and eventual failure.

### Manufacturing Defects

Some rubber hoses have inherent manufacturing defects or use substandard materials that make them prone to premature failure. These defects may not be apparent until the hose is under stress.

## The Cost of Failure

When a washing machine hose fails, the consequences can be devastating:

- **Water Damage:** Hundreds of gallons can flood your home within hours
- **Structural Damage:** Water can damage floors, walls, and ceilings
- **Mold Growth:** Moisture creates ideal conditions for mold development
- **Personal Property Loss:** Furniture, electronics, and belongings can be ruined
- **Displacement:** Severe damage may require temporary relocation
- **Insurance Issues:** Some policies may not cover preventable maintenance failures

## Prevention: The Smart Investment

Preventing washing machine hose failure is far more cost-effective than dealing with the aftermath. Here are the key prevention strategies:

### Replace Rubber Hoses with Stainless Steel

Stainless steel braided hoses are significantly more durable than rubber alternatives. They resist bursting, handle pressure fluctuations better, and typically last 10+ years. While they cost more upfront, they provide superior protection and peace of mind.

### Install Water Shut-Off Valves

Automatic shut-off valves can detect unusual water flow and immediately stop the water supply when a hose fails. These devices can prevent thousands of dollars in damage by limiting the amount of water released during a failure.

### Regular Inspection

Inspect your washing machine hoses every six months for signs of wear, including:

- Cracks or splits in the rubber
- Bulging or swelling
- Rust or corrosion on fittings
- Loose connections
- Signs of previous leaks

### Turn Off Water When Not in Use

Consider turning off the water supply valves when the washing machine is not in use, especially when traveling. This simple step eliminates pressure on the hoses and reduces the risk of failure when you're not home to respond quickly.

## Professional Installation and Maintenance

While replacing washing machine hoses might seem like a simple DIY project, professional installation ensures proper fitting, appropriate torque on connections, and compliance with local plumbing codes. A qualified plumber can also assess your entire laundry room setup and recommend additional protective measures.

Professional plumbers can also install water leak detection systems, upgrade your water supply lines, and ensure your washing machine is properly connected to prevent other potential issues.

## When to Call a Professional

Contact a professional plumber immediately if you notice:

- Any signs of water damage around your washing machine
- Unusual water pressure fluctuations
- Visible wear on existing hoses
- Hoses that are more than 5 years old
- Loose or corroded connections

#### Don't Wait for Disaster

The small investment in replacing your rubber washing machine hoses with stainless steel alternatives can save you thousands of dollars in water damage. Economy Plumbing Services can assess your current setup and provide professional installation of high-quality, durable hoses.

Call (512) 368-9159 or schedule inspection online.`,
        excerpt: "Learn why rubber washing machine hoses are a major risk and how to prevent costly water damage in your home.",
        author: "Economy Plumbing",
        publishDate: new Date("2025-04-10"),
        category: "Maintenance",
        featuredImage: "/attached_assets/stock_images/washing_machine_hose_16bcd8a5.jpg",
        metaDescription: "Prevent water damage from washing machine hose failures. Expert advice on upgrading to stainless steel hoses.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      },
      {
        id: randomUUID(),
        title: "The Importance of Maintenance",
        slug: "the-importance-of-maintenance",
        content: `As a homeowner in Austin, maintaining your plumbing system is crucial for preventing costly repairs and ensuring the longevity of your fixtures. Regular inspections, timely repairs, and proper maintenance can save you from emergencies and extend the life of your plumbing. In this blog post, we will highlight key aspects of plumbing maintenance, such as regular inspections, water heater flushing, and the importance of addressing issues before they escalate.

## Why Plumbing Maintenance Matters

Your home's plumbing system works around the clock, delivering clean water and removing waste. Like any hardworking system, it requires regular attention to function properly. Neglecting maintenance can lead to:

- Unexpected and expensive emergency repairs
- Water damage to your home's structure and belongings
- Higher utility bills due to inefficient systems
- Shortened lifespan of plumbing fixtures and appliances
- Health hazards from contaminated water or sewage backups

## Essential Plumbing Maintenance Tasks

### 1. Regular Inspections

Professional plumbing inspections should be conducted annually, or more frequently for older homes. During an inspection, a qualified plumber will:

- Check for leaks in pipes, faucets, and fixtures
- Inspect water pressure and flow rates
- Examine the condition of pipes and connections
- Test shut-off valves and safety devices
- Assess the overall health of your plumbing system

### 2. Water Heater Maintenance

Your water heater is one of the hardest-working appliances in your home. Regular maintenance includes:

- **Annual Flushing:** Removes sediment buildup that reduces efficiency and shortens lifespan
- **Anode Rod Inspection:** This sacrificial component protects your tank from corrosion
- **Temperature and Pressure Relief Valve Testing:** Ensures safety mechanisms are working properly
- **Insulation Check:** Proper insulation improves energy efficiency

Water heater flushing is particularly important in Central Texas due to our hard water conditions. Mineral deposits can significantly impact performance and efficiency if not addressed regularly.

### 3. Drain Cleaning and Maintenance

Keeping your drains clear prevents backups and maintains proper flow throughout your plumbing system:

- Professional drain cleaning removes buildup that household cleaners can't handle
- Camera inspections identify potential problems before they become emergencies
- Root removal prevents tree roots from damaging your sewer lines
- Grease trap cleaning for commercial properties

### 4. Fixture Maintenance

Regular attention to your plumbing fixtures can prevent small problems from becoming major issues:

- Replace worn washers and seals in faucets
- Clean mineral deposits from showerheads and aerators
- Check toilet components for proper operation
- Inspect caulking around tubs and showers

## The Cost of Prevention vs. Repair

Many homeowners hesitate to invest in regular maintenance, viewing it as an unnecessary expense. However, the cost of prevention is always less than the cost of major repairs:

#### Prevention Costs vs. Emergency Repairs:

- Annual water heater flush: $150 vs. Water heater replacement: $1,500-$3,000
- Drain cleaning: $200 vs. Sewer line replacement: $3,000-$10,000
- Leak detection: $300 vs. Water damage restoration: $5,000-$15,000
- Regular inspection: $200 vs. Emergency plumbing call: $500-$1,000+

## Signs Your Plumbing Needs Attention

Don't wait for a major problem to develop. Watch for these warning signs:

- Slow drains or frequent clogs
- Low water pressure
- Unusual noises from pipes or fixtures
- Discolored or foul-smelling water
- Visible leaks or water stains
- Higher than normal water bills
- Fluctuating water temperatures

## Creating a Maintenance Schedule

Establishing a regular maintenance schedule helps ensure nothing is overlooked:

#### Recommended Maintenance Schedule:

- **Monthly:** Check for visible leaks, test water pressure
- **Quarterly:** Clean drain stoppers, check toilet components
- **Semi-annually:** Inspect exposed pipes, clean showerheads
- **Annually:** Professional inspection, water heater flush, drain cleaning

## Why Choose Professional Maintenance

While some maintenance tasks can be performed by homeowners, professional service offers several advantages:

- **Expertise:** Trained professionals can identify problems you might miss
- **Proper Tools:** Specialized equipment for thorough cleaning and inspection
- **Safety:** Professional handling of potentially dangerous situations
- **Warranty:** Work performed by licensed professionals is typically guaranteed
- **Efficiency:** Professionals can complete maintenance tasks quickly and thoroughly

### Schedule Your Plumbing Maintenance Today

Don't wait for problems to develop. Contact Economy Plumbing Services to schedule comprehensive plumbing maintenance and protect your Austin home from costly repairs.

Call (512) 368-9159 or schedule service online.`,
        excerpt: "Discover why regular plumbing maintenance is essential for preventing costly repairs and extending the life of your plumbing system.",
        author: "Economy Plumbing",
        publishDate: new Date("2025-03-25"),
        category: "Maintenance",
        featuredImage: "/attached_assets/stock_images/plumbing_maintenance_91eba3a0.jpg",
        metaDescription: "Essential plumbing maintenance guide for Austin homeowners. Prevent costly repairs with regular inspections and maintenance.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      },
      {
        id: randomUUID(),
        title: "Hydro Jetting Drainage Solutions",
        slug: "hydro-jetting-drainage-solutions",
        content: `Discover how hydro jetting can effectively resolve drainage issues in commercial properties in our comprehensive guide. Commercial properties face unique drainage challenges that require powerful, efficient solutions.

## Understanding Commercial Drainage Challenges

Commercial properties face significantly more complex drainage issues than residential buildings. With higher usage volumes, diverse waste types, and more extensive plumbing systems, commercial drainage problems can quickly escalate into costly business disruptions.

Common commercial drainage issues include:

- Grease and oil buildup in restaurant and food service facilities
- Hair and soap accumulation in hotels and fitness centers
- Paper and debris blockages in office buildings
- Scale and mineral deposits in manufacturing facilities
- Root intrusion in older commercial properties
- Heavy usage leading to accelerated wear and blockages

## What is Hydro Jetting?

Hydro jetting is a powerful drain cleaning method that uses high-pressure water streams to clear blockages and clean pipe walls. Unlike traditional snaking methods that simply punch holes through blockages, hydro jetting completely removes debris, grease, and buildup from the entire pipe diameter.

The process involves:

1. Inserting a specialized nozzle into the drain or sewer line
2. Releasing water at pressures up to 4,000 PSI
3. The high-pressure water cuts through blockages and scours pipe walls
4. Debris is flushed downstream and out of the system

## Why Hydro Jetting is Ideal for Commercial Properties

### 1. Thorough Cleaning Power

Commercial properties generate more waste and debris than residential buildings. Hydro jetting's powerful cleaning action removes not just blockages, but also the buildup that causes recurring problems. This is especially important for restaurants dealing with grease accumulation or hotels managing high volumes of hair and soap residue.

### 2. Environmentally Safe

Unlike chemical drain cleaners that can harm the environment and damage pipes, hydro jetting uses only water. This makes it safe for businesses concerned about environmental impact and regulatory compliance. It's particularly important for food service establishments that must maintain strict health and safety standards.

### 3. Cost-Effective Long-Term Solution

While the initial cost of hydro jetting may be higher than traditional snaking, it provides longer-lasting results. By completely cleaning pipe walls, hydro jetting prevents rapid re-accumulation of debris, reducing the frequency of service calls and minimizing business disruptions.

### 4. Versatility for Different Pipe Materials

Commercial properties often have diverse plumbing systems with various pipe materials. Hydro jetting can be safely used on most pipe types, including:

- PVC and plastic pipes
- Cast iron and steel pipes
- Clay and concrete sewer lines
- Copper and brass pipes (with appropriate pressure settings)

## Commercial Applications of Hydro Jetting

### Restaurants and Food Service

Restaurants face unique challenges with grease, oil, and food debris. Hydro jetting effectively removes grease buildup that can cause severe blockages and health code violations. Regular hydro jetting maintenance helps restaurants maintain compliance with local health regulations.

### Hotels and Hospitality

Hotels deal with high volumes of hair, soap, and personal care products that can quickly clog drains. Hydro jetting provides the thorough cleaning needed to handle this constant influx of debris while minimizing guest disruptions.

### Manufacturing Facilities

Manufacturing operations often produce unique waste products that can accumulate in drainage systems. Hydro jetting can handle industrial debris, scale, and mineral deposits that traditional methods cannot effectively remove.

### Office Buildings

Even office buildings benefit from hydro jetting, particularly in restroom facilities and break rooms where paper products, food waste, and personal care items can cause blockages.

## When to Consider Hydro Jetting

Commercial properties should consider hydro jetting when experiencing:

- Recurring drain blockages despite regular maintenance
- Slow drainage throughout the building
- Foul odors coming from drains
- Multiple drain backups occurring simultaneously
- Grease or oil-related drainage issues
- Preparation for camera inspection or pipe lining

## The Hydro Jetting Process for Commercial Properties

Professional hydro jetting for commercial properties involves several steps:

1. **Initial Assessment:** Evaluation of the drainage system and identification of problem areas
2. **Camera Inspection:** Video inspection to locate blockages and assess pipe condition
3. **Pressure Selection:** Choosing appropriate water pressure based on pipe material and condition
4. **Hydro Jetting Process:** Systematic cleaning of the entire drainage system
5. **Final Inspection:** Post-cleaning camera inspection to verify results
6. **Maintenance Planning:** Developing a schedule for ongoing maintenance

## Preventive Maintenance Programs

The most effective approach to commercial drainage management is implementing a preventive maintenance program that includes regular hydro jetting. This proactive approach:

- Prevents emergency blockages and business disruptions
- Extends the life of plumbing systems
- Maintains compliance with health and safety regulations
- Reduces overall maintenance costs
- Improves customer and employee satisfaction

### Professional Hydro Jetting Services

Economy Plumbing Services provides professional hydro jetting solutions for commercial properties throughout Austin and Central Texas. Our experienced team uses state-of-the-art equipment to solve your drainage challenges efficiently and effectively.

Call (512) 368-9159 or schedule service online.`,
        excerpt: "Learn how hydro jetting provides powerful, environmentally safe drainage solutions for commercial properties.",
        author: "Economy Plumbing",
        publishDate: new Date("2025-02-18"),
        category: "Drain Cleaning",
        featuredImage: "/attached_assets/stock_images/commercial_restauran_f944a7d9.jpg",
        metaDescription: "Professional hydro jetting services for commercial drainage solutions. Powerful, eco-friendly drain cleaning in Austin.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      },
      {
        id: randomUUID(),
        title: "Don't Miss Our Limited Time Plumbing Specials on Groupon",
        slug: "dont-miss-our-limited-time-plumbing-specials-on-groupon-your-trusted-plumber-in-austin-is-offering-amazing-deals",
        content: `Are you a homeowner in Austin, TX, facing a leaky faucet, a running toilet, or maybe even considering a water heater tune-up? Now is the perfect time to take care of those plumbing needs! Economy Plumbing Services, your reliable and local Plumber Austin, is excited to announce some incredible limited-time specials available right now on Groupon!

We understand that plumbing issues can be stressful and often unexpected. That's why we're committed to providing top-notch service at affordable prices. And now, thanks to our special offers on Groupon, getting the quality plumbing care you deserve has never been more budget-friendly.

## What Kind of Deals Can You Expect?

While specific deals may vary, keep an eye out for offers like:

- **Drain Cleaning Services:** Professional drain cleaning at discounted rates
- **Water Heater Maintenance:** Comprehensive water heater tune-ups and inspections
- **Plumbing Inspections:** Thorough home plumbing system evaluations
- **Fixture Repairs:** Faucet, toilet, and other fixture repair services
- **Emergency Service Discounts:** Reduced rates for urgent plumbing needs

## Why Choose Economy Plumbing Services?

As Austin's trusted plumbing professionals, we bring years of experience and a commitment to excellence to every job. Here's what sets us apart:

### Licensed and Insured

Our team consists of fully licensed and insured plumbing professionals. You can have peace of mind knowing that your plumbing work is being handled by qualified experts who stand behind their work.

### Transparent Pricing

We believe in honest, upfront pricing with no hidden fees or surprise charges. When you book through Groupon, you'll know exactly what you're paying for, and our technicians will provide clear estimates before beginning any work.

### Quality Workmanship

Whether it's a simple faucet repair or a complex water heater installation, we approach every job with the same level of professionalism and attention to detail. Our goal is to solve your plumbing problems right the first time.

### Local Austin Expertise

As a local Austin plumbing company, we understand the unique challenges that Central Texas homes face. From hard water issues to the effects of our clay soil on plumbing systems, we have the local knowledge to address your specific needs.

## How to Take Advantage of Our Groupon Deals

Taking advantage of our Groupon specials is easy:

1. **Visit Groupon:** Search for "Economy Plumbing Services" or "Austin plumber" on the Groupon website or app
2. **Choose Your Deal:** Select the plumbing service that best fits your needs
3. **Purchase Your Voucher:** Complete your purchase through Groupon's secure platform
4. **Schedule Your Service:** Contact us to schedule your appointment and mention your Groupon voucher
5. **Enjoy Professional Service:** Our team will arrive on time and provide the quality service you expect

## Common Plumbing Services We Offer

Our Groupon deals may include any of our comprehensive plumbing services:

#### Residential Services

- Drain cleaning and unclogging
- Water heater repair and replacement
- Leak detection and repair
- Toilet and faucet repairs
- Garbage disposal services

#### Emergency Services

- Emergency repairs
- Burst pipe repairs
- Sewer line issues
- Water heater emergencies
- Flooding and water damage prevention

## Don't Wait - Limited Time Offers!

These special Groupon deals won't last forever! Plumbing problems don't wait for convenient times, and neither should you. Whether you're dealing with an immediate issue or want to be proactive about maintenance, now is the perfect time to book our services at these special rates.

## Customer Satisfaction Guaranteed

Even with our discounted Groupon rates, we never compromise on quality. Every service comes with our satisfaction guarantee. If you're not completely happy with our work, we'll make it right. That's our promise to you.

## Serving All of Austin and Surrounding Areas

Our Groupon deals are available to customers throughout the Austin metropolitan area, including:

- Downtown Austin
- South Austin
- North Austin
- East Austin
- West Austin
- Cedar Park
- Round Rock
- Leander
- Pflugerville
- And surrounding communities

### Ready to Save on Quality Plumbing Services?

Don't miss out on these limited-time Groupon specials! Visit Groupon today to find our current deals, or contact Economy Plumbing Services directly to learn more about our services and current promotions.

Call (512) 368-9159 or schedule service online.`,
        excerpt: "Save big on professional plumbing services with our limited-time Groupon specials. Quality service at affordable prices.",
        author: "Economy Plumbing",
        publishDate: new Date("2025-01-12"),
        category: "Promotions",
        featuredImage: "/attached_assets/stock_images/professional_plumber_d3924ca6.jpg",
        metaDescription: "Limited time plumbing specials on Groupon. Save on drain cleaning, water heater service, and more from Economy Plumbing.",
        published: true,
        imageId: null,
        isScheduled: false,
        scheduledFor: null,
        generatedByAI: false
      }
    ];

    posts.forEach(post => this.blogPosts.set(post.id, post));
  }

  private seedProducts() {
    const products: Product[] = [
      {
        id: randomUUID(),
        name: "Bio-Pure Septic & Drain + RV Restore & Maintain 32 oz.",
        slug: "bio-pure-septic-drain-rv-restore-maintain-32-oz",
        description: "Proprietary Microbial Bio-Enzyme Power Breaks Down, Digests Waste & Eliminates Odors (24/7) - Wonderful Citrus Ginger Scent - 4 Septic Treatments + 16 Drain Treatments or 1 Septic Shock",
        price: 2953, // $29.53
        category: "product",
        image: "https://irp.cdn-website.com/90e1856f/dms3rep/multi/bio-pure.png",
        stripeProductId: null,
        stripePriceId: null,
        features: [
          "Perfect for septic systems or as a drain maintenance product",
          "Great for frequently clogged drains",
          "Citrus Ginger scent",
          "4 Septic Treatments + 16 Drain Treatments or 1 Septic Shock"
        ],
        active: true,
        serviceTitanMembershipTypeId: null,
        serviceTitanEnabled: false
      },
      {
        id: randomUUID(),
        name: "Silver VIP Membership - Tank Type",
        slug: "silver-vip-membership-tank",
        description: "Includes water heater flush of up to two (2) tank-type water heaters (in one service visit) with general plumbing checkup & entitles customer to preferred customer pricing for the duration of 1 year, as well as preferred customer emergency scheduling.",
        price: 13925, // $139.25
        category: "membership",
        image: "https://irp.cdn-website.com/90e1856f/dms3rep/multi/silver-tank-type.png",
        stripeProductId: null,
        stripePriceId: null,
        features: [
          "Water heater flush for up to 2 tank-type water heaters",
          "General plumbing checkup",
          "Preferred customer pricing for 1 year",
          "Preferred customer emergency scheduling"
        ],
        active: true,
        serviceTitanMembershipTypeId: null,
        serviceTitanEnabled: false
      },
      {
        id: randomUUID(),
        name: "Silver VIP Membership - Tankless",
        slug: "silver-vip-membership-tankless",
        description: "Includes water heater flush of up to two (2) tankless water heaters (in one service visit) with general plumbing checkup & entitles customer to preferred customer pricing for the duration of 1 year, as well as preferred customer emergency scheduling.",
        price: 21212, // $212.12
        category: "membership",
        image: "https://irp.cdn-website.com/90e1856f/dms3rep/multi/tankless+vip+silver.png",
        stripeProductId: null,
        stripePriceId: null,
        features: [
          "Water heater flush for up to 2 tankless water heaters",
          "General plumbing checkup",
          "Preferred customer pricing for 1 year",
          "Preferred customer emergency scheduling"
        ],
        active: true,
        serviceTitanMembershipTypeId: null,
        serviceTitanEnabled: false
      },
      {
        id: randomUUID(),
        name: "Platinum VIP Membership - Tank Type",
        slug: "platinum-vip-membership-tank",
        description: "Includes (3) annual water heater flush of up to two (2) tank-type water heaters (in one service visit) with general plumbing checkup & entitles customer to preferred customer pricing for the duration of 3 years, as well as preferred customer emergency scheduling.",
        price: 31977, // $319.77
        category: "membership",
        image: "https://irp.cdn-website.com/90e1856f/dms3rep/multi/platinum-tank-type.png",
        stripeProductId: null,
        stripePriceId: null,
        features: [
          "3 annual water heater flushes for up to 2 tank-type water heaters",
          "General plumbing checkup (3 times over 3 years)",
          "Preferred customer pricing for 3 years",
          "Preferred customer emergency scheduling"
        ],
        active: true,
        serviceTitanMembershipTypeId: null,
        serviceTitanEnabled: false
      },
      {
        id: randomUUID(),
        name: "Platinum VIP Membership - Tankless",
        slug: "platinum-vip-membership-tankless",
        description: "Includes (3) annual water heater flush of up to two (2) tankless water heaters (in one service visit) with general plumbing checkup & entitles customer to preferred customer pricing for the duration of 3 years, as well as preferred customer emergency scheduling.",
        price: 59980, // $599.80
        category: "membership",
        image: "https://irp.cdn-website.com/90e1856f/dms3rep/multi/platinum-tankless.png",
        stripeProductId: null,
        stripePriceId: null,
        features: [
          "3 annual water heater flushes for up to 2 tankless water heaters",
          "General plumbing checkup (3 times over 3 years)",
          "Preferred customer pricing for 3 years",
          "Preferred customer emergency scheduling"
        ],
        active: true,
        serviceTitanMembershipTypeId: null,
        serviceTitanEnabled: false
      },
      {
        id: randomUUID(),
        name: "Commercial VIP",
        slug: "commercial-vip",
        description: "Enroll your business in our commercial VIP program today! Become a VIP customer at your business & receive Priority Service for emergencies, Membership savings on EVERY service item, and Yearly plumbing inspection at no charge.",
        price: 11900, // $119.00
        category: "membership",
        image: "https://irp.cdn-website.com/90e1856f/dms3rep/multi/commercial+VIP-98834175.png",
        stripeProductId: null,
        stripePriceId: null,
        features: [
          "Priority service for emergencies",
          "Membership savings on every service item",
          "Yearly plumbing inspection at no charge",
          "No auto-renewal - no obligation"
        ],
        active: true,
        serviceTitanMembershipTypeId: null,
        serviceTitanEnabled: false
      },
      {
        id: randomUUID(),
        name: "Rental VIP",
        slug: "rental-vip",
        description: "Enroll all your rental properties in our VIP program today! Every rental property in our coverage area will get Priority service in the event of an emergency and Savings on every task completed.",
        price: 10910, // $109.10
        category: "membership",
        image: "https://irp.cdn-website.com/90e1856f/dms3rep/multi/commercial+VIP-98834175.png",
        stripeProductId: null,
        stripePriceId: null,
        features: [
          "Priority service in emergency situations",
          "Savings on every task completed",
          "Ideal for property managers",
          "Covers all rental properties in coverage area"
        ],
        active: true,
        serviceTitanMembershipTypeId: null,
        serviceTitanEnabled: false
      }
    ];

    products.forEach(product => this.products.set(product.id, product));
  }

  private seedServiceAreas() {
    const areas: ServiceArea[] = [
      {
        id: randomUUID(),
        cityName: "Austin",
        slug: "austin",
        region: "austin",
        metaDescription: "Expert plumbing services in Austin, TX. Serving downtown, South Congress, Mueller, and all Austin neighborhoods. 24/7 emergency plumbing available.",
        introContent: "As Austin's trusted plumbing service provider since our founding, Economy Plumbing understands the unique challenges facing homeowners in the Live Music Capital of the World. From the historic Victorian homes of Hyde Park to modern high-rises downtown, Austin's diverse housing stock requires experienced plumbers who understand both classic and contemporary plumbing systems.",
        neighborhoods: ["Downtown Austin", "South Congress (SoCo)", "East Austin", "Hyde Park", "Mueller", "Zilker", "Tarrytown", "Clarksville", "Bouldin Creek", "Rosedale"],
        landmarks: ["Texas State Capitol", "Lady Bird Lake", "Barton Springs Pool", "University of Texas", "Sixth Street"],
        localPainPoints: [
          "Hard water from the Edwards Aquifer causing scale buildup in pipes and water heaters",
          "Aging cast iron pipes in historic downtown and Hyde Park homes requiring replacement",
          "High-rise plumbing challenges in downtown condos and apartments",
          "Tree root intrusion from Austin's numerous heritage oak trees damaging sewer lines",
          "Outdated galvanized pipes in pre-1960s homes throughout central Austin"
        ],
        seasonalIssues: [
          "Summer demand spikes during Austin City Limits and SXSW putting stress on water heaters",
          "Flash flood damage to outdoor plumbing and irrigation systems during spring storms",
          "Frozen pipe emergencies during rare winter freezes like the 2021 Texas winter storm",
          "Increased water usage during triple-digit summer temperatures straining water heaters"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Why is my Austin water so hard?",
            answer: "Austin's water comes from the Highland Lakes and the Edwards Aquifer, which naturally contain high levels of calcium and magnesium. This hard water can cause scale buildup in pipes, water heaters, and fixtures. We recommend water softeners or regular descaling treatments for Austin homes."
          }),
          JSON.stringify({
            question: "Do oak tree roots commonly damage sewer lines in Austin?",
            answer: "Yes, Austin's beloved heritage oak trees have aggressive root systems that frequently infiltrate and damage sewer lines, especially in older neighborhoods like Hyde Park and Tarrytown. We offer camera inspections to identify root intrusion and trenchless repair solutions to fix the damage."
          })
        ],
        testimonials: null, // Use actual Google reviews - no fake testimonials
        population: "978,908",
        zipCodes: ["78701", "78702", "78703", "78704", "78705", "78712", "78717", "78719", "78721", "78722", "78723", "78724", "78725", "78726", "78727", "78728", "78729", "78730", "78731", "78732", "78733", "78734", "78735", "78736", "78737", "78738", "78739", "78741", "78742", "78744", "78745", "78746", "78747", "78748", "78749", "78750", "78751", "78752", "78753", "78754", "78756", "78757", "78758", "78759"],
        latitude: "30.2672",
        longitude: "-97.7431"
      },
      {
        id: randomUUID(),
        cityName: "Cedar Park",
        slug: "cedar-park",
        region: "austin",
        metaDescription: "Professional plumbing services in Cedar Park, TX. Serving Buttercup Creek, Whitestone, and all Cedar Park communities. Same-day service available.",
        introContent: "Cedar Park's rapid growth from a quiet bedroom community to one of the fastest-growing cities in America has created unique plumbing challenges. Economy Plumbing has been serving Cedar Park families since the community's expansion began, and we understand the specific needs of both newer subdivisions and established neighborhoods in this vibrant Hill Country city.",
        neighborhoods: ["Buttercup Creek", "Whitestone", "Vista Oaks", "Cypress Creek", "Anderson Mill", "Brushy Creek", "Heritage Park", "Twin Creeks"],
        landmarks: ["HEB Center at Cedar Park", "Brushy Creek Lake Park", "Cedar Park Center"],
        localPainPoints: [
          "New construction plumbing failures in rapidly built subdivisions requiring warranty repairs",
          "Well water system issues in older Cedar Park properties built before city water expansion",
          "Slab foundation cracks in Hill Country soil causing hidden slab leaks",
          "Undersized water heaters in new construction homes not meeting family needs",
          "Hard water from Lake Travis supply causing premature fixture and appliance failure"
        ],
        seasonalIssues: [
          "Foundation shifts during summer drought cycles creating pipe stress and leaks",
          "Flash flooding along Brushy Creek impacting homes in low-lying areas",
          "Increased demand during summer recreation season at nearby parks and pools",
          "Winter freeze protection needed for exposed outdoor plumbing and irrigation systems"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Why do Cedar Park homes have so many slab leaks?",
            answer: "Cedar Park is built on expansive clay soil that shifts with moisture changes. During our hot, dry summers, the soil contracts, and during wet periods it expands. This constant movement can stress pipes embedded in concrete slabs, leading to cracks and leaks. We specialize in slab leak detection and rerouting solutions for Cedar Park homes."
          }),
          JSON.stringify({
            question: "Should I replace my well water system with city water?",
            answer: "Many older Cedar Park properties still use well water. While city water is now available throughout Cedar Park, some homeowners prefer to keep their wells for irrigation. We can help you evaluate your options and convert to city water if desired, or maintain your existing well system."
          })
        ],
        testimonials: null, // Use actual Google reviews - no fake testimonials
        population: "77,595",
        zipCodes: ["78613", "78641"],
        latitude: "30.5052",
        longitude: "-97.8203"
      },
      {
        id: randomUUID(),
        cityName: "Leander",
        slug: "leander",
        region: "austin",
        metaDescription: "Top-rated plumbing services in Leander, TX. Serving Crystal Falls, Mason Hills, Summerlyn, and all Leander neighborhoods. Fast response, expert service.",
        introContent: "Leander's explosive growth from a quiet railroad town to one of America's fastest-growing cities has created unique plumbing challenges that require local expertise. Economy Plumbing has served Leander families through every phase of this transformation, from the historic downtown area to the newest master-planned communities like Crystal Falls and Summerlyn. As Leander's population has soared from 26,000 in 2010 to over 87,000 today, we've expanded our services to meet the evolving needs of this dynamic Hill Country city. Leander's location along the CapMetro Red Line and proximity to major employers makes it a magnet for young families, and our team understands the specific plumbing demands of modern family homes. The city's unique position straddling both Travis and Williamson Counties means homes may receive water from different sources, creating varied water quality challenges across neighborhoods. Our technicians are intimately familiar with every subdivision in Leander, from the luxury estates of Crystal Falls Golf Course to the family-friendly streets of Mason Hills and Northline.",
        neighborhoods: ["Crystal Falls", "Mason Hills", "Summerlyn", "Lakeline Ranch", "Northline", "Grand Mesa", "Block House Creek", "Benbrook Ranch"],
        landmarks: ["Crystal Falls Golf Course", "Leander Station (CapMetro Rail)", "Veterans Memorial Park", "Largest H-E-B in Central Texas", "Brushy Creek Regional Trail"],
        localPainPoints: [
          "Rapidly aging plumbing in homes built during Leander's 2000s building boom now experiencing widespread failures",
          "Hard water from multiple source systems causing inconsistent scale buildup across different neighborhoods",
          "Undersized water heaters in spec homes from growth period unable to serve modern family demands",
          "Slab leaks in newer construction due to expansive clay soil settlement as subdivisions mature",
          "Water pressure fluctuations during peak demand hours as infrastructure struggles to keep pace with population growth"
        ],
        seasonalIssues: [
          "Summer strain on aging water mains during peak irrigation season causing pressure drops",
          "Winter freeze damage to exposed outdoor plumbing in newer homes built with minimal cold weather protection",
          "Spring foundation shifts from wet season causing pipe stress in homes built on expansive clay",
          "Fall HVAC changeover revealing water heater inefficiencies accumulated over hot summer months"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Why does my water pressure drop so much in the evening in Leander?",
            answer: "Leander's rapid growth has outpaced water infrastructure in some neighborhoods, particularly in Crystal Falls and Summerlyn. During peak evening hours when families are cooking, bathing, and running sprinklers, the system experiences high demand. Additionally, the elevation changes throughout Leander (especially in hillside developments) can create natural pressure variations. We can install pressure boosting systems or whole-house pressure regulators to ensure consistent flow regardless of neighborhood demand."
          }),
          JSON.stringify({
            question: "Should I be concerned about plumbing in a home built during Leander's 2000-2010 building boom?",
            answer: "Yes, homes built during Leander's rapid expansion period often had plumbing installed quickly to meet demand, and these systems are now 15-25 years old. We frequently see undersized water heaters (40-gallon tanks in 4-bedroom homes), builder-grade fixtures failing, and the first generation of PEX connections developing leaks. We recommend a comprehensive plumbing inspection for any Leander home built before 2010, with special attention to water heater capacity, slab leak risk assessment, and main water line condition."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Jennifer L.",
            neighborhood: "Crystal Falls",
            text: "Our 2008 home had the original water heater fail during a holiday party. Economy Plumbing had someone at our Crystal Falls house within 90 minutes and installed a new tankless system the same day. They knew exactly which models work best in our neighborhood!",
            rating: 5
          }),
          JSON.stringify({
            name: "David H.",
            neighborhood: "Mason Hills",
            text: "Found a slab leak under our Mason Hills home's foundation. Economy Plumbing used their electronic detection equipment to pinpoint it without destroying our floors, then rerouted the line through the attic. Professional work at a fair price.",
            rating: 5
          })
        ],
        population: "87,511",
        zipCodes: ["78641", "78645", "78646"],
        latitude: "30.5788",
        longitude: "-97.8531"
      },
      {
        id: randomUUID(),
        cityName: "Round Rock",
        slug: "round-rock",
        region: "austin",
        metaDescription: "Expert plumbing services in Round Rock, TX. Serving Brushy Creek, Forest Creek, Teravista, and all Round Rock areas. 24/7 emergency service available.",
        introContent: "Round Rock's transformation from a historic railroad town to the Sports Capital of Texas has made it one of Central Texas's most desirable communities, and Economy Plumbing has been here through it all. With over 124,000 residents and continuing growth, Round Rock presents unique plumbing challenges that range from aging systems in historic downtown to cutting-edge demands in newer master-planned communities like Teravista and La Frontera. The city's diverse housing stock spans from charming early 1900s homes near the famous Round Rock to modern smart homes in developments built this decade. Our technicians understand the specific needs of each era and neighborhood, from repiping Victorian-era homes with outdated galvanized pipes to servicing high-efficiency tankless systems in new construction. Round Rock's position as a major tech hub with Dell's headquarters means many homes have professional-grade requirements including dedicated hot water recirculation systems and whole-house water treatment. The city's extensive park system and year-round sports facilities at places like the Dell Diamond create seasonal demand spikes that stress residential plumbing systems.",
        neighborhoods: ["Brushy Creek", "Forest Creek", "Teravista", "Mayfield Ranch", "La Frontera Village", "Canyon Creek", "Settlers Park", "Chandler Creek", "Hidden Glen", "Oak Hollow"],
        landmarks: ["Dell Diamond", "Old Settlers Park", "Kalahari Resorts", "The Round Rock (historic landmark)", "Downtown Round Rock"],
        localPainPoints: [
          "Old galvanized pipes in historic downtown homes causing rusty water and low pressure requiring complete repiping",
          "Hard water from Lake Travis supply creating severe scale buildup in water heaters and reducing efficiency by up to 30%",
          "High-density subdivision plumbing in Teravista and La Frontera experiencing simultaneous fixture use overwhelming undersized systems",
          "Sports complex proximity causing seasonal demand surges that reveal hidden plumbing weaknesses during tournament seasons",
          "Mixed soil conditions across the city (clay in east, limestone in west) creating different foundation movement patterns affecting underground pipes"
        ],
        seasonalIssues: [
          "Summer tournament season at Dell Diamond coinciding with irrigation demands creating neighborhood-wide pressure drops",
          "Winter freeze events damaging outdoor kitchen plumbing and pool equipment at higher rates than surrounding cities",
          "Spring flash floods along Brushy Creek affecting homes in low-lying areas with backflow and drainage issues",
          "Fall water heater failures as families return from summer activities and resume normal usage patterns revealing accumulated wear"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Why is Round Rock's water so hard and what can I do about it?",
            answer: "Round Rock receives water from Lake Travis, which flows through limestone formations giving it hardness levels of 25-35 grains per gallon - among the hardest in Texas. This causes white buildup on fixtures, reduces water heater efficiency, and shortens appliance life. We recommend whole-house water softeners for Round Rock homes, particularly high-efficiency dual-tank systems that can handle the extreme hardness. For homes in Teravista and newer developments, we often install combination softener-filter systems that also address chlorine and sediment issues."
          }),
          JSON.stringify({
            question: "My Round Rock home was built in 2005-2010. What plumbing issues should I watch for?",
            answer: "Homes built during Round Rock's major expansion period often have three key issues: first-generation PEX piping that's now showing connection failures, undersized 40-gallon water heaters inadequate for modern family needs, and builder-grade fixtures reaching end-of-life. Additionally, the expansive clay soil in eastern Round Rock neighborhoods has had 15-20 years to cycle through wet and dry periods, often causing slab leaks in homes from this era. We recommend comprehensive plumbing inspections including slab leak detection for any Round Rock home from this period."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Tom R.",
            neighborhood: "Brushy Creek",
            text: "Economy Plumbing completely repiped our 1995 Brushy Creek home, replacing all the old galvanized lines. They worked clean, finished in three days, and our water pressure is incredible now. Best investment we've made in the house!",
            rating: 5
          }),
          JSON.stringify({
            name: "Amanda S.",
            neighborhood: "Forest Creek",
            text: "Our Forest Creek neighborhood has extremely hard water. Economy Plumbing installed a whole-house softener and the difference is amazing - no more scale on fixtures and our water heater is running more efficiently. They really know Round Rock's water issues!",
            rating: 5
          })
        ],
        population: "124,790",
        zipCodes: ["78664", "78665", "78680", "78681", "78682", "78683"],
        latitude: "30.5083",
        longitude: "-97.6789"
      },
      {
        id: randomUUID(),
        cityName: "Georgetown",
        slug: "georgetown",
        region: "austin",
        metaDescription: "Reliable plumbing services in Georgetown, TX. Serving Sun City, Wolf Ranch, Berry Creek, and all Georgetown communities. Expert technicians, honest pricing.",
        introContent: "Georgetown's unique character as both a historic Victorian town and a modern retirement destination creates plumbing challenges unlike anywhere else in Central Texas. As the county seat of Williamson County and home to Southwestern University (Texas's oldest university), Georgetown balances preservation of 19th-century architecture with cutting-edge amenities in master-planned communities like Sun City and Wolf Ranch. Economy Plumbing understands this duality, offering specialized services for everything from repiping century-old homes around the historic square to maintaining modern water systems in 55+ active adult communities. The city's position along the San Gabriel River and proximity to Lake Georgetown means water quality varies significantly across neighborhoods, with some areas receiving hard lake water while others rely on well systems. Georgetown's explosive growth - particularly in the Wolf Ranch area and Sun City developments - has strained infrastructure in ways that affect residential plumbing. Our team has deep expertise in Georgetown's unique challenges, from dealing with limestone bedrock that makes underground repairs difficult to understanding the specific needs of the city's large retiree population who demand reliable, efficient plumbing systems.",
        neighborhoods: ["Sun City", "Wolf Ranch", "Berry Creek", "River Chase", "Georgetown Village", "Heritage Oaks", "Rancho Siena", "Serenada", "Historic Downtown", "Lakewood Estates"],
        landmarks: ["Downtown Georgetown Historic Square", "Southwestern University", "San Gabriel River", "Lake Georgetown", "Blue Hole Park"],
        localPainPoints: [
          "Victorian-era homes in historic district with original cast iron and galvanized pipes requiring sensitive restoration-quality repiping",
          "Sun City's high concentration of retirees demanding water heater systems with consistent temperature and pressure for medical needs",
          "Wolf Ranch's rapid construction creating premature plumbing failures in homes less than 10 years old due to builder-grade materials",
          "Limestone bedrock throughout Georgetown making trenchless sewer repair the only viable option in many neighborhoods",
          "Mixed water sources across the city (lake, well, and city systems) creating wildly different hardness levels and treatment needs"
        ],
        seasonalIssues: [
          "Summer heat causing increased water heater demand in Sun City as retirees run multiple appliances and irrigation systems",
          "Winter freezes particularly damaging in historic homes with exposed plumbing in uninsulated walls and crawl spaces",
          "Spring San Gabriel River flooding affecting homes along Rivery and River Chase with backflow prevention needs",
          "Fall when Sun City snowbirds return en masse revealing plumbing issues that developed during summer months of vacancy"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "I live in historic Georgetown. Can you repipe without damaging my Victorian home's character?",
            answer: "Absolutely. We specialize in historic home repiping in Georgetown's Victorian district. We use techniques like fishing PEX lines through existing wall cavities, accessing from attics and crawl spaces, and making minimal, reversible access points that can be properly restored. We work with local historic preservation guidelines and can coordinate with your contractor for any cosmetic restoration. Our goal is modern plumbing performance while maintaining your home's architectural integrity and historic value."
          }),
          JSON.stringify({
            question: "What plumbing considerations are unique to Sun City Georgetown?",
            answer: "Sun City homes have specific needs: consistent water temperature for safety (avoiding scalding), easily accessible shutoff valves, water heater systems designed for one-story living, and often medical-grade requirements for oxygen equipment or dialysis. We also see higher demand for low-maintenance fixtures, touchless faucets for mobility issues, and leak detection systems for snowbirds who leave homes vacant. Additionally, Sun City's homes are now 15-20 years old, meaning original water heaters and fixtures are reaching end-of-life and need proactive replacement."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Robert and Helen M.",
            neighborhood: "Sun City",
            text: "We're snowbirds and needed our Sun City home's plumbing inspected before leaving for the summer. Economy Plumbing found a small leak we didn't know about, replaced our aging water heater, and installed a leak detection system. Peace of mind when we're away!",
            rating: 5
          }),
          JSON.stringify({
            name: "Patricia K.",
            neighborhood: "Historic District",
            text: "Economy Plumbing repiped our 1895 Victorian home near the square. They were incredibly careful with our original woodwork and plaster, and the new system works beautifully. They understand historic Georgetown homes!",
            rating: 5
          })
        ],
        population: "67,176",
        zipCodes: ["78626", "78627", "78628", "78633"],
        latitude: "30.6333",
        longitude: "-97.6780"
      },
      {
        id: randomUUID(),
        cityName: "Pflugerville",
        slug: "pflugerville",
        region: "austin",
        metaDescription: "Professional plumbing services in Pflugerville, TX. Serving Blackhawk, Falcon Pointe, Lake Pflugerville area, and all Pflugerville neighborhoods.",
        introContent: "Pflugerville's transformation from a German farming community to a diverse, thriving Austin suburb has created a unique tapestry of plumbing needs. Founded in 1860 by German immigrants, Pflugerville today is a vibrant city of over 65,000 residents with a strong sense of community and some of the most diverse housing stock in the Austin metro area. Economy Plumbing has served Pflugerville families through every phase of growth, from maintaining historic farmhouses in the original town center to servicing cutting-edge smart home systems in master-planned communities like Falcon Pointe and Blackhawk. The city's position straddling Travis and Williamson Counties, combined with proximity to major tech employers along State Highway 130, means homes range from modest starter properties to luxury estates. Pflugerville's extensive park system, including the centerpiece 180-acre Lake Pflugerville, creates unique outdoor plumbing demands for irrigation and pool systems. The city's rapid growth period in the 2000s means many homes are now reaching the 15-20 year mark where major plumbing components need replacement. Our technicians know every Pflugerville subdivision, from the golf course community of Blackhawk to the family-friendly neighborhoods of Falcon Pointe, and we understand the specific challenges each area presents.",
        neighborhoods: ["Blackhawk", "Falcon Pointe", "Sorento", "Carmel", "Heatherwilde", "Windermere", "Wells Point", "Highland Park", "Avalon Park", "Springbrook"],
        landmarks: ["Lake Pflugerville", "Blackhawk Golf Club", "Pfluger Park", "Stone Hill Town Center", "Historic Downtown Pflugerville"],
        localPainPoints: [
          "First-generation master-planned community plumbing in Blackhawk and Falcon Pointe now showing widespread fixture and water heater failures",
          "Lake Pflugerville irrigation systems creating severe summer demand spikes revealing undersized water mains in surrounding neighborhoods",
          "Diverse water quality across different subdivisions due to multiple supply sources requiring customized treatment approaches",
          "Rapid soil settlement in newer developments causing slab leaks in homes less than 10 years old",
          "Builder-grade plumbing from 2000s boom years failing en masse as warranties expire and homeowners face expensive repairs"
        ],
        seasonalIssues: [
          "Summer Lake Pflugerville recreation season creating water pressure drops in Heatherwilde and nearby neighborhoods during peak use",
          "Winter freeze damage particularly severe in homes built quickly during growth period with minimal cold weather protection",
          "Spring heavy rains revealing poor drainage around homes built on clay soil causing foundation shifts and pipe stress",
          "Fall return-to-school season revealing plumbing issues that developed during lighter summer usage patterns"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Why do so many Pflugerville homes from the 2000s building boom have plumbing problems?",
            answer: "Pflugerville's population doubled between 2000-2010, and construction couldn't keep pace with demand. Many homes were built quickly with builder-grade materials - 40-gallon water heaters in 4-bedroom homes, thin-wall PEX connections, and basic fixtures. These systems are now 15-25 years old and failing simultaneously across neighborhoods like Blackhawk and Falcon Pointe. Additionally, the expansive clay soil has cycled through 15-20 years of wet/dry periods, causing foundation movement and subsequent slab leaks. We recommend proactive inspections and upgrades before catastrophic failures occur."
          }),
          JSON.stringify({
            question: "Does living near Lake Pflugerville affect my home's plumbing?",
            answer: "Yes, in several ways. Homes near the lake often experience greater water pressure fluctuations during summer recreation season. The higher water table near the lake can also affect foundation stability and increase humidity levels that accelerate pipe corrosion. Additionally, many lake-adjacent homes have irrigation systems that were oversized for large lawns, and these systems can create pressure drops affecting indoor plumbing. We can install pressure regulators and properly size irrigation systems to prevent these issues."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Marcus T.",
            neighborhood: "Blackhawk",
            text: "Our Blackhawk home is 18 years old and the original water heater finally gave out. Economy Plumbing recommended a tankless system perfect for our family's needs and installed it the same day. They know these Pflugerville neighborhoods inside and out!",
            rating: 5
          }),
          JSON.stringify({
            name: "Rachel G.",
            neighborhood: "Falcon Pointe",
            text: "Had a slab leak detected under our Falcon Pointe home. Economy Plumbing used non-invasive electronic detection to find it, then rerouted the line without tearing up our floors. Saved us thousands and finished in one day!",
            rating: 5
          })
        ],
        population: "65,176",
        zipCodes: ["78660", "78691"],
        latitude: "30.4398",
        longitude: "-97.6206"
      },
      {
        id: randomUUID(),
        cityName: "Liberty Hill",
        slug: "liberty-hill",
        region: "austin",
        metaDescription: "Trusted plumbing services in Liberty Hill, TX. Serving Santa Rita Ranch, Clearwater Ranch, and all Liberty Hill communities. Same-day service available.",
        introContent: "Liberty Hill's evolution from a tiny railroad stop to a thriving Hill Country community has created unique plumbing challenges that require specialized local knowledge. Located 33 miles northwest of Austin in the scenic Texas Hill Country, Liberty Hill has exploded from just 967 residents in 2000 to over 10,000 today, driven largely by the massive Santa Rita Ranch master-planned community. Economy Plumbing has been here through this incredible transformation, understanding both the needs of older properties in the historic town center and the cutting-edge systems in luxury developments like Clearwater Ranch. Liberty Hill's position on the western edge of Williamson County means it sits at the transition between Austin's urban infrastructure and true Hill Country well water systems. Many homes still rely on private wells, while newer developments connect to municipal water with varying quality. The area's limestone and granite geology creates challenges for underground plumbing work, and the expansive clay soil mixed with rocky terrain means foundations - and the pipes beneath them - experience unique stresses. Our technicians are intimately familiar with every Liberty Hill subdivision, from the championship golf course homes at Cimarron Hills to the estate properties at Clearwater Ranch.",
        neighborhoods: ["Santa Rita Ranch", "Clearwater Ranch", "Regency at Santa Rita Ranch", "Cimarron Hills", "Tierra Rosa", "Legacy Ranch"],
        landmarks: ["Liberty Hill International Sculpture Park", "Cimarron Hills Country Club", "Lions Foundation Park", "Lake Georgetown (nearby)", "Historic Downtown Liberty Hill"],
        localPainPoints: [
          "Private well water systems in older Liberty Hill properties requiring specialized filtration and pressure management",
          "Santa Rita Ranch's rapid construction creating premature failures in homes less than 10 years old due to soil settlement",
          "Extremely hard water from limestone aquifer sources causing severe scale buildup in water heaters and fixtures",
          "Mixed infrastructure between well-served and city-water areas creating confusion about water treatment needs",
          "Rocky Hill Country terrain making traditional excavation for sewer repair nearly impossible, requiring trenchless solutions"
        ],
        seasonalIssues: [
          "Summer drought stress on private well systems as water tables drop and pumps work harder",
          "Winter freeze damage particularly severe in rural areas with exposed well equipment and pressure tanks",
          "Spring heavy rains causing temporary well water quality issues as surface runoff affects aquifer recharge",
          "Fall when Santa Rita Ranch amenities close revealing plumbing issues in homes as full-time usage resumes"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Should I keep my well system or connect to Liberty Hill city water?",
            answer: "This depends on several factors unique to your property. Well water in Liberty Hill is typically very hard (25-35 grains) but free of chlorine. City water is treated and consistent but also hard and requires ongoing payment. If your well is producing adequately and you're willing to maintain filtration and softening systems, keeping it can be economical. However, wells require power (problematic during outages), periodic maintenance, and testing. For Santa Rita Ranch and newer developments, city water is standard. We can test your well water, assess your system, and help you make an informed decision based on your specific situation and long-term plans."
          }),
          JSON.stringify({
            question: "Why is Liberty Hill water so hard and what damage does it cause?",
            answer: "Liberty Hill sits on Edwards limestone and granite formations. As water percolates through this rock, it absorbs calcium and magnesium, creating hardness levels of 25-35 grains per gallon - extremely hard even by Texas standards. This causes white scale buildup that clogs aerators and showerheads, reduces water heater efficiency by up to 40%, and can eventually block pipes. In Liberty Hill's hot climate, water heaters work extra hard and scale accumulates faster. We strongly recommend whole-house water softening for all Liberty Hill homes, with annual water heater flushing to remove sediment before it causes damage."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Kevin and Dana P.",
            neighborhood: "Santa Rita Ranch",
            text: "Our Santa Rita Ranch home had terrible water pressure and hard water stains everywhere. Economy Plumbing installed a water softener and pressure booster system - complete transformation! They understand Liberty Hill's water challenges.",
            rating: 5
          }),
          JSON.stringify({
            name: "Bill R.",
            neighborhood: "Clearwater Ranch",
            text: "We're on a well system at our Clearwater Ranch estate. Economy Plumbing set us up with proper filtration, a new pressure tank, and softening system. They know well systems inside and out - highly recommend for Liberty Hill well owners.",
            rating: 5
          })
        ],
        population: "10,428",
        zipCodes: ["78642"],
        latitude: "30.6650",
        longitude: "-97.9114"
      },
      {
        id: randomUUID(),
        cityName: "Buda",
        slug: "buda",
        region: "austin",
        metaDescription: "Expert plumbing services in Buda, TX. Serving Shadow Creek, Sunfield, Garlic Creek, and all Buda neighborhoods. Emergency service available 24/7.",
        introContent: "Buda's charming small-town character combined with explosive suburban growth has created a unique plumbing landscape that demands both traditional expertise and modern solutions. Pronounced 'BYOO-duh' by locals, this Hays County community has transformed from a sleepy town of 2,400 in 2000 to over 16,000 today, earning recognition as one of Austin's fastest-growing suburbs. Economy Plumbing has served Buda through every phase of this evolution, from maintaining historic structures around the 1898 Building downtown to installing cutting-edge systems in master-planned communities like Shadow Creek and Sunfield. Buda's position 15 miles southwest of Austin, nestled along Onion Creek in the Hill Country, means homes experience unique challenges from both suburban infrastructure demands and rural Texas geology. The city's location on I-35 has spurred rapid development, but much of Buda still retains its connection to the land, with some properties on well systems and others dealing with the challenges of transitioning infrastructure. Our technicians understand Buda's distinctive needs, from the historic downtown buildings requiring sensitive plumbing upgrades to new construction facing the reality of expansive clay soil and hard water from Hill Country sources.",
        neighborhoods: ["Shadow Creek", "Sunfield", "Stonefield", "Garlic Creek", "Ruby Ranch", "Whispering Hollow", "Creekside Park", "White Oak Preserve"],
        landmarks: ["Historic Stagecoach Park", "Bradfield Village Park", "The 1898 Building", "Onion Creek", "Cabela's"],
        localPainPoints: [
          "Onion Creek's flood history creating special backflow prevention needs in low-lying neighborhoods",
          "Rapid transition from rural to suburban infrastructure overwhelming older water mains during peak demand",
          "New construction plumbing in Shadow Creek and Sunfield built during boom years now showing premature failures",
          "Hard water from Edwards aquifer sources creating severe scaling in water heaters and requiring aggressive treatment",
          "Historic downtown buildings with century-old plumbing needing careful upgrades to meet modern code while preserving character"
        ],
        seasonalIssues: [
          "Spring Onion Creek flooding requiring sump pump installations and backflow preventer maintenance in creek-adjacent homes",
          "Summer irrigation demands in new subdivisions creating pressure drops during evening peak usage hours",
          "Winter freeze events particularly damaging in older homes with minimal insulation and exposed pipe runs",
          "Fall return of cooler weather revealing water heater inefficiencies as heating demands increase after idle summer months"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "My Buda home is near Onion Creek. What plumbing precautions should I take?",
            answer: "Homes near Onion Creek need special flood protection for plumbing systems. We recommend backflow preventers on all sewer connections to prevent creek flooding from backing up into your home, sump pumps in crawl spaces or basements, and elevating water heaters and HVAC systems above potential flood levels. After any flooding event, we recommend thorough inspections of sewer lines for damage and water heater checks for sediment intrusion. Many Buda flood insurance policies require these protective devices, and we can ensure your home meets all requirements while providing maximum protection."
          }),
          JSON.stringify({
            question: "Why does my new Buda home already have plumbing problems?",
            answer: "Buda's rapid growth meant many homes were built quickly between 2010-2020 to meet demand. We frequently see builder-grade 40-gallon water heaters inadequate for modern family needs, thin-wall PEX connections beginning to fail, and fixtures from the 'value' tier already breaking down. Additionally, Buda sits on expansive clay soil that's had 5-15 years to cycle through wet and dry periods, causing foundation settlement that stresses pipes. For homes in Shadow Creek, Sunfield, and other new developments, we recommend comprehensive plumbing inspections even on homes less than 10 years old, with particular attention to slab leak risk and water heater capacity."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Chris and Amy W.",
            neighborhood: "Shadow Creek",
            text: "Our Shadow Creek home flooded during a storm and the sewer backed up into our home. Economy Plumbing installed a backflow preventer and new sump pump system. They know Buda's flooding risks and how to protect homes!",
            rating: 5
          }),
          JSON.stringify({
            name: "Miguel R.",
            neighborhood: "Garlic Creek",
            text: "Economy Plumbing replaced our undersized builder water heater with a proper 50-gallon system for our family. They explained that many Buda homes from our era have this problem. Great service and honest advice!",
            rating: 5
          })
        ],
        population: "16,030",
        zipCodes: ["78610"],
        latitude: "30.0827",
        longitude: "-97.8425"
      },
      {
        id: randomUUID(),
        cityName: "Kyle",
        slug: "kyle",
        region: "austin",
        metaDescription: "Quality plumbing services in Kyle, TX. Serving Hometown Kyle, Bunton Creek, Waterleaf, and all Kyle communities. Licensed, insured, local experts.",
        introContent: "Kyle's remarkable journey from a quiet town of 5,000 to nearly 60,000 residents in just two decades has created plumbing challenges that require deep local expertise and modern solutions. Named for historic land donor Fergus Kyle, this Hays County community has become one of Texas's fastest-growing cities, with its ZIP code consistently ranking among the hottest real estate markets in America. Economy Plumbing has been Kyle's trusted plumbing partner through this explosive growth, serving everything from the historic homes near the Auction Oak where the city's first lots were sold in 1880, to cutting-edge smart homes in master-planned communities like Hometown Kyle and Waterleaf. Kyle's position seven miles from Texas State University and its easy I-35 access to both Austin and San Antonio make it a magnet for young families and first-time homebuyers. This demographic shift has created unique demands for affordable yet reliable plumbing solutions. The city's expansion has occasionally outpaced infrastructure development, creating water pressure challenges in some neighborhoods during peak hours. Our technicians know every Kyle subdivision and understand the specific plumbing needs of this dynamic, fast-growing community.",
        neighborhoods: ["Hometown Kyle", "Bunton Creek", "Waterleaf", "Amberwood", "Sunset Ridge", "Silverado", "Mountain City", "Prairie on the Creek", "Kensington Trails", "The Woodlands"],
        landmarks: ["Auction Oak", "Katherine Anne Porter House", "Lake Kyle", "Gregg-Clarke Park", "The Vybe Trail System"],
        localPainPoints: [
          "Infrastructure strain from rapid growth creating water pressure fluctuations in newer subdivisions during peak demand hours",
          "First-time homebuyer focus meaning many residents unaware of preventive maintenance needs until major failures occur",
          "Builder-grade plumbing in spec homes from Kyle's boom years now failing en masse as homes reach 10-15 year mark",
          "Expansive clay soil throughout Kyle causing widespread slab leak issues in homes from early 2000s construction",
          "Hard water from multiple source systems requiring different treatment approaches across various neighborhoods"
        ],
        seasonalIssues: [
          "Summer Texas State University student population swings creating dramatic water usage fluctuations in nearby neighborhoods",
          "Winter freeze damage in homes built during rapid expansion period with minimal cold weather protection considerations",
          "Spring foundation movement from heavy rains causing pipe stress in homes built on Kyle's expansive clay soil",
          "Fall when families settle into routines revealing plumbing issues that went unnoticed during busy summer months"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Why does my Kyle home's water pressure drop so much in the evenings?",
            answer: "Kyle's infrastructure is catching up to its explosive growth, and some neighborhoods experience pressure drops during peak evening hours (6-9 PM) when everyone is cooking, bathing, and running sprinklers. This is especially common in Hometown Kyle, Waterleaf, and other newer developments where demand has exceeded original main capacity. We can install whole-house pressure boosting systems or pressure storage tanks to ensure consistent flow regardless of neighborhood demand. Additionally, we can add pressure regulators to protect your plumbing when pressure spikes during low-demand periods."
          }),
          JSON.stringify({
            question: "Is it worth upgrading the plumbing in my Kyle starter home?",
            answer: "Absolutely. Many Kyle homes purchased by first-time buyers have builder-grade 40-gallon water heaters, basic fixtures, and minimal water treatment. Upgrading to a 50-gallon or tankless water heater, installing a whole-house water softener for Kyle's hard water, and replacing basic fixtures with quality models will improve your daily comfort, reduce utility bills, and increase your home's value. These upgrades typically pay for themselves within 5-7 years through energy savings and reduced repair costs, and they make your home much more attractive to buyers when you're ready to sell."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Jessica and Ryan M.",
            neighborhood: "Hometown Kyle",
            text: "As first-time homebuyers in Hometown Kyle, we didn't know much about plumbing maintenance. Economy Plumbing did a complete inspection, upgraded our water heater, and installed a water softener. They educated us every step of the way!",
            rating: 5
          }),
          JSON.stringify({
            name: "Carlos V.",
            neighborhood: "Bunton Creek",
            text: "Found a slab leak under our Bunton Creek home - our worst nightmare! Economy Plumbing responded immediately, found the leak with electronic equipment, and rerouted the line through our attic. They saved our floors and our sanity!",
            rating: 5
          })
        ],
        population: "57,470",
        zipCodes: ["78640"],
        latitude: "29.9891",
        longitude: "-97.8772"
      },
      {
        id: randomUUID(),
        cityName: "Marble Falls",
        slug: "marble-falls",
        region: "marble-falls",
        metaDescription: "Professional plumbing services in Marble Falls, TX. Serving lakefront properties, historic downtown, and all Marble Falls neighborhoods. Lake specialist plumbers.",
        introContent: "Marble Falls' unique position as the heart of the Highland Lakes region creates plumbing challenges found nowhere else in Central Texas. Named for the marble-like limestone falls that once cascaded through the Colorado River (now submerged beneath Lake Marble Falls), this historic Hill Country community of over 9,000 residents combines Victorian charm with modern lakeside living. Economy Plumbing has served Marble Falls since our founding, understanding the specific needs of everything from century-old homes in the Victorian district to luxury lakefront estates along Lake Marble Falls and the surrounding Highland Lakes. The city's dual identity as both a retirement destination and tourism hub creates unique seasonal demands on plumbing systems. Marble Falls' position along the Highland Lakes chain means many homes have specialized lake house features - outdoor showers, boat wash stations, and irrigation systems drawing from the lake. The area's pink granite bedrock, famous for building the Texas State Capitol, creates challenges for any underground plumbing work. Our technicians are experts in Marble Falls' distinctive geology, water systems, and the specific needs of lakefront properties that experience higher humidity, more outdoor plumbing demands, and seasonal occupancy patterns.",
        neighborhoods: ["Lakeside Estates", "Victorian District", "Meadowlakes", "Highland Haven", "Downtown Lofts", "Granite Shoals (adjacent)", "River Hills", "Sunset Ridge"],
        landmarks: ["Lake Marble Falls", "Downtown Historic Square", "Granite Mountain", "Hidden Falls Adventure Park", "Flat Creek Estate Winery"],
        localPainPoints: [
          "Lake house plumbing systems experiencing accelerated corrosion from high humidity and seasonal vacancy cycles",
          "Victorian-era homes in historic district with original plumbing requiring expert restoration-quality repiping work",
          "Pink granite bedrock making traditional excavation nearly impossible, requiring specialized trenchless repair techniques",
          "Seasonal occupancy in lakefront properties creating plumbing failures when homes sit vacant for extended periods",
          "Hard water from Lake Marble Falls and groundwater sources causing severe scale buildup in water heaters and lake-fed irrigation systems"
        ],
        seasonalIssues: [
          "Summer tourism season creating dramatic water demand spikes in downtown and lakefront areas during festivals and events",
          "Winter snowbird departures leaving homes vacant and vulnerable to freezing pipes during rare cold snaps",
          "Spring flooding along Colorado River affecting lakefront properties with backflow risks and drainage challenges",
          "Fall lake level drops exposing dock plumbing and irrigation intake systems that need seasonal adjustment"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "What special plumbing considerations do Marble Falls lakefront homes require?",
            answer: "Lakefront properties in Marble Falls need several specialized systems: backflow preventers to protect against lake water entering home plumbing, outdoor shower and boat wash stations with proper drainage, irrigation systems with lake intake management for varying water levels, and humidity control since lake properties experience 20-30% higher moisture levels that accelerate pipe corrosion. We also recommend whole-house surge protection since lakefront homes are more vulnerable to lightning strikes. For seasonal occupants, we can install automatic shutoff systems and leak detection that alert you remotely if problems develop while you're away."
          }),
          JSON.stringify({
            question: "Can you work on historic homes in Marble Falls' Victorian district?",
            answer: "Yes, we specialize in historic home plumbing in Marble Falls. The Victorian district homes often have original cast iron, galvanized, or even lead pipes that need replacement. We use minimally invasive techniques like PEX repiping through existing wall cavities, attic access, and careful excavation that preserves historic foundations. We understand local preservation guidelines and work to maintain your home's character while providing modern plumbing performance. We can also source period-appropriate fixtures or retrofit modern internals into vintage fixtures to maintain aesthetic consistency."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Linda and George T.",
            neighborhood: "Lakeside Estates",
            text: "Our lakefront home needed a complete outdoor plumbing system for our boat dock and outdoor kitchen. Economy Plumbing designed a custom system that handles lake water and city water perfectly. They're true lake house specialists!",
            rating: 5
          }),
          JSON.stringify({
            name: "Barbara S.",
            neighborhood: "Victorian District",
            text: "Economy Plumbing completely repiped our 1895 Victorian home while preserving all the original woodwork and character. They understand Marble Falls historic homes and worked with incredible care and expertise.",
            rating: 5
          })
        ],
        population: "9,413",
        zipCodes: ["78654", "78657"],
        latitude: "30.5754",
        longitude: "-98.2714"
      },
      {
        id: randomUUID(),
        cityName: "Burnet",
        slug: "burnet",
        region: "marble-falls",
        metaDescription: "Trusted plumbing services in Burnet, TX. Serving the county seat and all Burnet area homes. Highland Lakes region plumbing specialists since 2012.",
        introContent: "Burnet's rich history as the Williamson County seat and gateway to the Highland Lakes creates a unique plumbing landscape that blends small-town Texas character with modern lakeside living. Named for David Gouverneur Burnet, the first president of the Republic of Texas, this community of over 6,700 residents serves as both a historic county seat and the commercial heart of the Highland Lakes region. Economy Plumbing understands Burnet's dual nature, serving everything from historic courthouse square buildings to modern lakefront developments along Lake Buchanan and Inks Lake. The city's position along the Colorado River and its role as a Highland Lakes recreation hub means plumbing systems must handle both permanent residents and seasonal lake visitors. Burnet's limestone and granite geology, similar to nearby Marble Falls, creates challenges for underground work while also contributing to the area's exceptionally hard water. The county seat's mix of government buildings, historic homes, and newer residential developments requires plumbing expertise across a wide spectrum. Our technicians know Burnet's infrastructure intimately, from the vintage systems in downtown historic buildings to modern lake house amenities in surrounding developments.",
        neighborhoods: ["Downtown Burnet", "Fort Croghan area", "Lakeview Estates", "Burnet Highlands", "River Oaks", "Shady Grove", "Burnet West", "County Road communities"],
        landmarks: ["Burnet County Courthouse", "Fort Croghan Museum", "Lake Buchanan (nearby)", "Inks Lake (nearby)", "Historic downtown square"],
        localPainPoints: [
          "Historic downtown buildings with aging plumbing infrastructure requiring sensitive upgrades to meet modern codes",
          "Private well systems in county areas surrounding Burnet requiring specialized maintenance and water treatment",
          "Extremely hard water from limestone aquifers causing severe scaling and reduced water heater lifespan",
          "Granite and limestone bedrock making traditional excavation for sewer repairs nearly impossible in many locations",
          "Mixed municipal and well water systems across the area creating varied water quality requiring different treatment approaches"
        ],
        seasonalIssues: [
          "Summer Highland Lakes tourism bringing population surges that stress municipal water systems during peak periods",
          "Winter freeze events particularly damaging in older homes and buildings with minimal insulation and exposed pipes",
          "Spring flooding along Colorado River affecting low-lying properties with drainage and backflow prevention needs",
          "Fall when lake levels drop exposing seasonal irrigation and lake house plumbing systems requiring winterization"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "Why is Burnet's water so hard and what can I do about it?",
            answer: "Burnet sits on Edwards limestone and granite formations, and as water percolates through these rocks, it absorbs calcium and magnesium creating hardness levels of 25-35 grains per gallon - among the hardest in Texas. This causes white scale on fixtures, dramatically reduces water heater efficiency (sometimes by 40% or more), and can eventually clog pipes. For Burnet homes, we strongly recommend whole-house water softening systems, preferably high-capacity models designed for extreme hardness. We also recommend annual water heater flushing to remove accumulated sediment before it causes damage. For well water homes, we can test your specific water and design a comprehensive treatment system."
          }),
          JSON.stringify({
            question: "I'm buying a historic home in downtown Burnet. What plumbing issues should I expect?",
            answer: "Historic Burnet homes often have original galvanized or cast iron pipes, sometimes dating back to the early 1900s. These pipes corrode from the inside out, causing rusty water, low pressure, and eventually leaks. Many historic homes also have outdated fixtures, insufficient water heater capacity for modern needs, and plumbing that doesn't meet current codes. We recommend comprehensive plumbing inspections before purchase, budgeting for likely repiping (which we can do with minimal wall damage using modern techniques), and planning for water heater upgrades. We work within historic preservation guidelines and can help maintain your home's character while modernizing its plumbing."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Tom H.",
            neighborhood: "Downtown Burnet",
            text: "Our historic building near the courthouse square needed complete plumbing upgrades to meet code. Economy Plumbing worked with the city and historical society to do it right. They understand Burnet's historic properties!",
            rating: 5
          }),
          JSON.stringify({
            name: "Susan and Jim K.",
            neighborhood: "Shady Grove",
            text: "We're on a well system and had terrible hard water issues. Economy Plumbing installed a comprehensive treatment system and our water quality is amazing now. They know Burnet's well water challenges inside and out!",
            rating: 5
          })
        ],
        population: "6,710",
        zipCodes: ["78611"],
        latitude: "30.7582",
        longitude: "-98.2284"
      },
      {
        id: randomUUID(),
        cityName: "Horseshoe Bay",
        slug: "horseshoe-bay",
        region: "marble-falls",
        metaDescription: "Luxury plumbing services in Horseshoe Bay, TX. Serving resort properties, golf course homes, and lakefront estates. High-end plumbing specialists.",
        introContent: "Horseshoe Bay's status as one of Texas's premier resort communities creates plumbing demands that are sophisticated, unique, and uncompromising in their requirements. This affluent community of over 4,700 residents spreads across 7,000 acres on the shores of Lake Lyndon B. Johnson, featuring the renowned Horseshoe Bay Resort with four championship golf courses designed by Robert Trent Jones Sr. and Jack Nicklaus. Economy Plumbing has earned the trust of Horseshoe Bay's discerning residents and property managers, understanding the specific needs of luxury lakefront estates, resort facilities, and high-end vacation properties. The community's split between Llano and Burnet Counties, combined with its lakeside location and upscale amenities, creates unique plumbing challenges. Many properties are seasonal residences requiring specialized systems that maintain integrity during vacancy periods. The resort's world-class facilities, including spas, swimming pools, and dining establishments, demand commercial-grade plumbing expertise. Our technicians are experts in Horseshoe Bay's luxury market, from installing sophisticated whole-house automation systems to maintaining the complex plumbing in lakefront estates with outdoor kitchens, infinity pools, and boat house facilities.",
        neighborhoods: ["Resort Area", "The Waters at Horseshoe Bay", "Apple Rock Estates", "Slick Rock area", "Summit Rock community", "Paseo Villas", "Lakefront estates", "Golf course communities"],
        landmarks: ["Horseshoe Bay Resort", "Summit Rock Golf Course", "Slick Rock Golf Course", "Lake Lyndon B. Johnson", "Horseshoe Bay Marina"],
        localPainPoints: [
          "Luxury lakefront homes requiring sophisticated plumbing systems including outdoor kitchens, infinity pools, and spa facilities",
          "Seasonal occupancy patterns creating plumbing failures when high-end homes sit vacant for extended periods",
          "Resort-grade water quality demands requiring advanced filtration and treatment systems for discerning homeowners",
          "Lake LBJ's constant water levels enabling year-round lake amenities but creating unique dock and outdoor plumbing challenges",
          "High-end fixtures and European appliances requiring specialized knowledge and parts sourcing for repairs"
        ],
        seasonalIssues: [
          "Summer resort season creating peak demands on water systems as vacation homes reach full occupancy",
          "Winter snowbird departures requiring comprehensive plumbing winterization for vacant luxury properties",
          "Spring golf season opening revealing plumbing issues in clubhouse facilities and golf course irrigation systems",
          "Fall when second-home owners return finding plumbing failures that occurred during summer vacancy periods"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "What plumbing systems should my Horseshoe Bay vacation home have?",
            answer: "Luxury vacation homes in Horseshoe Bay benefit from several specialized systems: whole-house leak detection with remote monitoring so you're alerted immediately if problems develop while you're away, automatic water shutoff systems that close the main valve if leaks are detected, recirculation pumps for instant hot water at every fixture, whole-house water treatment for resort-quality water, and winterization capabilities for extended vacancies. We also recommend smart home integration so you can monitor water usage, control systems remotely, and receive alerts on your phone. For lakefront properties, we design custom outdoor kitchens, pool systems, and dock facilities that meet the highest standards."
          }),
          JSON.stringify({
            question: "Can you service high-end European fixtures and appliances common in Horseshoe Bay?",
            answer: "Absolutely. We specialize in luxury European brands popular in Horseshoe Bay including Dornbracht, Gessi, Duravit, and others. We maintain relationships with specialty suppliers for parts, understand the technical requirements of these sophisticated systems, and have experience with the integration challenges they present. Whether it's a Miele dishwasher requiring specific water pressure and temperature, a European wall-hung toilet system, or a high-end spa shower with multiple body jets, we have the expertise to install, maintain, and repair these premium systems. We also offer preventive maintenance contracts for Horseshoe Bay luxury homes to keep everything running perfectly."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Richard and Patricia W.",
            neighborhood: "The Waters",
            text: "Our lakefront condo at The Waters needed a complete plumbing upgrade including a spa bathroom and outdoor kitchen. Economy Plumbing delivered resort-quality work with attention to every detail. They understand Horseshoe Bay's standards!",
            rating: 5
          }),
          JSON.stringify({
            name: "Donald M.",
            neighborhood: "Summit Rock",
            text: "We're only in our Summit Rock home seasonally. Economy Plumbing installed a complete monitoring and shutoff system that alerts us to any issues. They've maintained our complex plumbing systems perfectly for years. True luxury plumbing specialists!",
            rating: 5
          })
        ],
        population: "4,756",
        zipCodes: ["78657"],
        latitude: "30.5405",
        longitude: "-98.3697"
      },
      {
        id: randomUUID(),
        cityName: "Kingsland",
        slug: "kingsland",
        region: "marble-falls",
        metaDescription: "Expert plumbing services in Kingsland, TX. Serving lakefront homes, The Slab area, and all Kingsland properties. Highland Lakes plumbing specialists.",
        introContent: "Kingsland's transformation from a railroad resort town to a modern Highland Lakes community has created unique plumbing needs that blend historic preservation with lakeside living. Situated at the confluence of the Colorado and Llano rivers where they form Lake Lyndon B. Johnson, this community of over 7,200 residents offers a quintessential Texas lake town experience. Economy Plumbing understands Kingsland's distinctive character, serving everything from the restored Victorian-era Antlers Hotel to modern lakefront estates with sophisticated amenities. The town's history as a railroad resort destination means many properties have vintage plumbing systems requiring expert restoration, while newer lakefront developments demand cutting-edge outdoor living features. Kingsland's position along Lake LBJ creates specific challenges - properties at varying elevations experience different water pressure, lake house features require specialized installations, and seasonal flooding along the rivers affects low-lying areas. The area's popularity with retirees and vacation home owners means many properties experience seasonal occupancy patterns that stress plumbing systems. Our technicians know every corner of Kingsland, from The Slab swimming area to lakefront developments, and understand the unique demands of this historic Highland Lakes community.",
        neighborhoods: ["Lakefront properties", "Historic Kingsland", "The Slab area", "River Bend", "Llano River Estates", "Kingsland Shores", "Highland Lakes Estates", "County Road communities"],
        landmarks: ["The Slab (Llano River)", "Antlers Hotel", "Lake Lyndon B. Johnson", "Texas Chainsaw House", "Kingsland Old Tunnel"],
        localPainPoints: [
          "Historic properties including Antlers Hotel requiring expert restoration plumbing that maintains vintage character",
          "Lake LBJ water level fluctuations affecting dock plumbing and lake-fed irrigation systems requiring seasonal adjustments",
          "Seasonal occupancy in vacation homes creating plumbing failures during vacant periods from lack of use",
          "River flooding from Llano and Colorado confluence affecting low-lying properties with backflow and drainage challenges",
          "Mixed well and municipal water systems across the area requiring different treatment approaches for varying water quality"
        ],
        seasonalIssues: [
          "Summer lake season creating peak water demands as vacation homes reach capacity and outdoor amenities run constantly",
          "Winter freezes particularly damaging in older homes and seasonal properties with minimal winterization",
          "Spring flooding at river confluence requiring backflow preventer maintenance and sump pump readiness in vulnerable areas",
          "Fall lake level stabilization exposing dock plumbing and irrigation intake systems requiring adjustment or repair"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "How does Lake LBJ's water level affect my Kingsland home's plumbing?",
            answer: "Unlike other Highland Lakes, Lake LBJ maintains relatively constant water levels year-round, which is actually beneficial for plumbing systems. However, we still see seasonal variations of 1-3 feet that can affect dock plumbing, lake water intake for irrigation, and boat lift systems. For lakefront homes, we recommend installing adjustable intake systems for irrigation that can accommodate level changes, using flexible connections for dock water supplies, and proper backflow prevention since lake water can sometimes approach home water lines during high water events. We also suggest annual inspections before summer season to ensure all lake-related plumbing is functioning properly."
          }),
          JSON.stringify({
            question: "What should I know about plumbing in Kingsland's historic properties?",
            answer: "Many Kingsland historic homes and the famous Antlers Hotel date to the early 1900s railroad resort era. These properties often have original galvanized or cast iron pipes, vintage fixtures with non-standard parts, and plumbing that doesn't meet modern codes. We specialize in historic property plumbing, using techniques that preserve character while providing modern performance - PEX repiping through existing pipe chases, retrofitting modern internals into vintage fixtures, and working within preservation guidelines. For commercial historic properties, we understand health code requirements while respecting the building's heritage. We can also source period-appropriate fixtures or create custom solutions that maintain authentic appearance."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Mark and Debbie F.",
            neighborhood: "Lakefront",
            text: "Our lake house dock had major plumbing issues including the outdoor shower and boat wash station. Economy Plumbing redesigned the whole system to handle Lake LBJ water level changes. They're true lake plumbing experts!",
            rating: 5
          }),
          JSON.stringify({
            name: "Gary T.",
            neighborhood: "Historic Kingsland",
            text: "Bought a 1920s home in historic Kingsland that needed complete repiping. Economy Plumbing did beautiful work preserving all the original character while giving us modern, reliable plumbing. Highly recommend for historic properties!",
            rating: 5
          })
        ],
        population: "7,246",
        zipCodes: ["78639"],
        latitude: "30.6597",
        longitude: "-98.4392"
      },
      {
        id: randomUUID(),
        cityName: "Granite Shoals",
        slug: "granite-shoals",
        region: "marble-falls",
        metaDescription: "Reliable plumbing services in Granite Shoals, TX. Serving Sherwood Shores and all Lake LBJ communities. City of Parks plumbing specialists.",
        introContent: "Granite Shoals' unique identity as the 'City of Parks' with 19 parks, 16 on Lake LBJ's shores, creates distinctive plumbing demands that center around waterfront living and outdoor recreation. This community of over 5,600 residents developed from what was once Texas's largest platted subdivision, Sherwood Shores, spreading along Lake Lyndon B. Johnson's eastern shore in Burnet County. Economy Plumbing has served Granite Shoals families since the community's early days, understanding the specific needs of lakefront properties, park facilities, and homes built during the city's rapid 1960s-1970s development. Granite Shoals' name comes from the pink granite bedrock visible along the Colorado River before Lake LBJ's creation, and this same granite creates challenges for any underground plumbing work today. The city's extensive park system with lake access creates unique community infrastructure demands, while individual homes often feature outdoor kitchens, boat docks, and irrigation systems drawing from the lake. Many properties are second homes or retirement residences, creating seasonal occupancy patterns. Our technicians understand Granite Shoals' lakefront lifestyle, from maintaining dock facilities to servicing homes built during the subdivision's pioneering days.",
        neighborhoods: ["Sherwood Shores", "Lakefront estates", "Sherwood Downs", "Woodland Hills", "Lakecrest", "Clear Cove", "East Bay", "Greenbriar"],
        landmarks: ["Lake Lyndon B. Johnson waterfront", "Quarry Park", "Veterans Memorial Park", "Leo Manzano Trail", "16 lakefront parks"],
        localPainPoints: [
          "Original 1960s-1970s Sherwood Shores plumbing now 50-60 years old experiencing widespread failures and requiring complete replacement",
          "Pink granite bedrock making traditional excavation impossible requiring trenchless repair methods for sewer work",
          "Lake LBJ waterfront properties requiring specialized dock plumbing and outdoor amenities with corrosion-resistant materials",
          "Seasonal occupancy patterns causing plumbing failures when vacation homes sit unused for extended periods",
          "Hard water from lake and well sources creating severe scaling in water heaters and requiring aggressive treatment systems"
        ],
        seasonalIssues: [
          "Summer lake season creating peak demands on aging infrastructure as vacation homes fill and outdoor amenities run constantly",
          "Winter freezes particularly damaging in older Sherwood Shores homes built with minimal cold weather protection",
          "Spring storms and flooding affecting lakefront properties with drainage challenges and backflow prevention needs",
          "Fall when summer residents depart revealing plumbing failures that occurred during peak usage months"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "My Sherwood Shores home is from the 1960s. What plumbing issues should I expect?",
            answer: "Original Sherwood Shores homes (1960s-1970s) typically have galvanized steel or early copper pipes that are now 50-60 years old - well past their expected lifespan. We commonly see severe corrosion causing rusty water and low pressure, pinhole leaks in copper pipes, outdated fixtures, and water heaters that are grossly undersized for modern needs. The good news is that Granite Shoals' granite bedrock, while challenging, means foundations are stable and we can repipe using modern PEX through attics and crawl spaces with minimal wall damage. We recommend comprehensive plumbing inspections for all Sherwood Shores homes, with budgeting for likely full repiping within the next few years if it hasn't been done already."
          }),
          JSON.stringify({
            question: "What makes lakefront plumbing different in Granite Shoals?",
            answer: "Granite Shoals lakefront homes on Lake LBJ need several specialized considerations: outdoor showers and boat wash stations with proper drainage, dock water supplies using corrosion-resistant materials (stainless steel or special brass) since lake moisture accelerates corrosion, irrigation systems that can draw from the lake with proper backflow prevention, and humidity control since lake properties experience 20-30% higher moisture that damages pipes faster. We also recommend whole-house surge protection since waterfront homes are more vulnerable to lightning. For seasonal occupants, automatic shutoff systems and remote monitoring prevent disasters while you're away."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Carol and Jim B.",
            neighborhood: "Sherwood Shores",
            text: "Our 1968 Sherwood Shores home had original galvanized pipes that finally gave out. Economy Plumbing completely repiped using PEX through the attic - minimal wall damage and now we have great pressure and clean water!",
            rating: 5
          }),
          JSON.stringify({
            name: "Steve R.",
            neighborhood: "Lakecrest",
            text: "Needed a complete outdoor plumbing system for our lake house including dock water, outdoor kitchen, and boat wash station. Economy Plumbing designed a custom system using marine-grade materials. They know Granite Shoals lakefront needs!",
            rating: 5
          })
        ],
        population: "5,651",
        zipCodes: ["78654"],
        latitude: "30.5891",
        longitude: "-98.3839"
      },
      {
        id: randomUUID(),
        cityName: "Bertram",
        slug: "bertram",
        region: "marble-falls",
        metaDescription: "Quality plumbing services in Bertram, TX. Serving historic downtown and all Bertram area homes. Gateway to Hill Country plumbing experts.",
        introContent: "Bertram's small-town charm and position as the gateway to the Hill Country create plumbing challenges that blend historic preservation with rural Texas infrastructure needs. This tight-knit community of over 2,000 residents in eastern Burnet County maintains its connection to both railroad heritage and agricultural roots while serving modern families drawn to its affordable housing and excellent schools. Economy Plumbing understands Bertram's dual nature, serving historic downtown buildings dating to the town's 1882 founding alongside newer residential developments. Located just 37 miles northwest of Austin on Highway 29, Bertram attracts families seeking small-town living with big-city access. The town's historic red brick schoolhouse, now Bertram Elementary and a National Blue Ribbon School, represents the community's commitment to quality - a value we share in our plumbing services. Bertram's position in the Hill Country means homes may rely on well water, municipal supplies, or a mix of both, creating varied water quality challenges. The town's elevation and limestone geology affect water pressure and underground utility work. Our technicians know Bertram's infrastructure intimately, from the historic downtown buildings to rural properties on the outskirts.",
        neighborhoods: ["Historic Downtown Bertram", "Bertram Estates", "North Bertram", "South Bertram", "FM 243 corridor", "Highway 29 properties"],
        landmarks: ["Bertram Train Depot", "Red Brick School House (Bertram Elementary)", "Chief Wilson Baseball Field", "Oatmeal Festival grounds (nearby)", "Historic Main Street"],
        localPainPoints: [
          "Historic downtown buildings with century-old plumbing requiring expert restoration work that meets modern codes",
          "Rural properties on well water systems needing specialized treatment for hard Hill Country groundwater",
          "Aging infrastructure in older homes built during Bertram's railroad era experiencing simultaneous failures",
          "Limited municipal services in outlying areas requiring self-contained plumbing solutions and septic systems",
          "Hard water from limestone aquifer sources causing severe scaling and requiring aggressive treatment approaches"
        ],
        seasonalIssues: [
          "Summer drought stress on private wells as water tables drop requiring pump adjustments and conservation measures",
          "Winter freeze damage particularly severe in older homes with minimal insulation and exposed plumbing",
          "Spring Oatmeal Festival (Labor Day) bringing visitor influx that stresses downtown plumbing and septic systems",
          "Fall when families settle into school routines revealing plumbing issues that went unnoticed during active summer months"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "I'm buying a historic home in downtown Bertram. What plumbing should I expect?",
            answer: "Historic Bertram homes, especially those dating to the railroad era (1880s-1920s), typically have original galvanized or cast iron pipes, outdated fixtures, and plumbing that doesn't meet current codes. We commonly see severe corrosion, low water pressure from mineral buildup, and inadequate water heater capacity. The good news is we can modernize these systems while preserving historic character - using PEX repiping through existing chases, accessing from attics or crawl spaces, and making minimal, reversible modifications. We recommend comprehensive inspections before purchase and budgeting for likely repiping. We work within historic preservation considerations and can help maintain your home's authentic character."
          }),
          JSON.stringify({
            question: "Should I keep my Bertram well system or connect to city water?",
            answer: "This depends on your well's performance, your water quality needs, and long-term plans. Bertram well water is typically very hard (25-35 grains) from limestone, but it's free of chlorine and ongoing costs. Wells require electricity (problematic in outages), periodic maintenance, and water treatment systems. City water provides consistent pressure and quality but comes with monthly bills. We can test your well water, assess your system's condition, and help you decide. Many Bertram residents keep wells for irrigation while using city water for the house - we can design hybrid systems that give you the best of both worlds."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Mary Beth T.",
            neighborhood: "Historic Downtown",
            text: "Our 1910 home near Main Street needed complete plumbing updates. Economy Plumbing preserved all our original woodwork while giving us modern, code-compliant plumbing. They understand Bertram's historic homes!",
            rating: 5
          }),
          JSON.stringify({
            name: "Frank M.",
            neighborhood: "North Bertram",
            text: "We're on a well system and had terrible pressure and hard water issues. Economy Plumbing installed a new pressure tank, updated our pump, and added a whole-house treatment system. They know Bertram well water inside and out!",
            rating: 5
          })
        ],
        population: "2,020",
        zipCodes: ["78605"],
        latitude: "30.7442",
        longitude: "-98.0556"
      },
      {
        id: randomUUID(),
        cityName: "Spicewood",
        slug: "spicewood",
        region: "marble-falls",
        metaDescription: "Premier plumbing services in Spicewood, TX. Serving Lake Travis waterfront, Lakecliff, The Reserve, and all Spicewood communities. Luxury lake specialists.",
        introContent: "Spicewood's evolution from a rural Hill Country community to one of Lake Travis's most prestigious addresses has created plumbing demands that are sophisticated, diverse, and uniquely challenging. This unincorporated community of nearly 12,000 residents stretches along Lake Travis's southern shoreline, encompassing everything from multi-million dollar waterfront estates to more modest Hill Country properties on the area's western reaches. Economy Plumbing has served Spicewood through its dramatic transformation, understanding the specific needs of luxury developments like Lakecliff on Lake Travis and The Reserve at Lake Travis, while also maintaining expertise in the area's rural properties and well systems. Spicewood's position straddling Burnet, Travis, and Blanco Counties creates varied infrastructure, with some neighborhoods on municipal water and others relying on private wells. The community's proximity to Lake Travis means many homes feature elaborate outdoor living spaces, infinity pools, boat houses, and lake-fed irrigation systems. The upcoming Thomas Ranch development will add thousands of homes, further diversifying Spicewood's plumbing landscape. Our technicians are experts in Spicewood's luxury market while maintaining the versatility to serve all property types in this diverse Hill Country community.",
        neighborhoods: ["Lakecliff on Lake Travis", "The Reserve at Lake Travis", "Barton Creek Lakeside", "Paleface Ranch", "Briarcliff", "The Coves on Lake Travis", "Spicewood Beach", "West Cypress Hills"],
        landmarks: ["Lake Travis waterfront", "Krause Springs", "Pace Bend Park", "Cypress Valley Canopy Tours", "Spicewood Vineyards"],
        localPainPoints: [
          "Luxury waterfront estates requiring sophisticated systems including infinity pools, outdoor kitchens, and smart home integration",
          "Lake Travis water level fluctuations affecting dock plumbing and lake-fed irrigation requiring seasonal adjustments",
          "Mixed infrastructure with luxury developments on city water adjacent to rural properties on private wells creating varied service needs",
          "Extremely hard water from limestone aquifer sources requiring commercial-grade treatment systems for discriminating homeowners",
          "High-end European fixtures and appliances common in luxury homes requiring specialized expertise and parts sourcing"
        ],
        seasonalIssues: [
          "Summer Lake Travis recreation season creating peak demands as vacation homes reach capacity and outdoor amenities run constantly",
          "Winter lake level drops exposing dock plumbing and irrigation intake systems requiring adjustment or winterization",
          "Spring wildfire season (post-2011 fires) keeping homeowners vigilant about outdoor plumbing and proper clearances",
          "Fall when second-home owners return after summer finding plumbing failures that developed during vacancy"
        ],
        uniqueFaqs: [
          JSON.stringify({
            question: "What plumbing systems does my Spicewood luxury home need?",
            answer: "High-end Spicewood homes on Lake Travis benefit from several sophisticated systems: whole-house water treatment (often reverse osmosis) for resort-quality water, hot water recirculation for instant hot water at every fixture, smart home integration with remote monitoring and control, automatic leak detection with shutoff capabilities, outdoor kitchen and pool systems with proper drainage and backflow prevention, and dock plumbing designed for Lake Travis water level changes. For second homes, we recommend comprehensive monitoring systems that alert you to any issues remotely. We specialize in integrating these complex systems seamlessly, often working with architects and builders during construction to ensure optimal placement and performance."
          }),
          JSON.stringify({
            question: "How does Lake Travis water level affect my Spicewood home's plumbing?",
            answer: "Lake Travis can fluctuate 20-40 feet seasonally, which significantly affects waterfront plumbing. Dock water supplies need flexible connections that accommodate level changes, irrigation intake systems require adjustable depth capability or must switch to city water during low periods, and boat lifts may need plumbing modifications based on lake levels. We design Lake Travis systems with this variability in mind, using adjustable intakes, dual-source irrigation (lake and city), and proper backflow prevention since lake water can approach property water lines during high water. We also recommend monitoring systems that alert you to level-related plumbing issues before they cause damage."
          })
        ],
        testimonials: [
          JSON.stringify({
            name: "Michael and Jennifer K.",
            neighborhood: "Lakecliff",
            text: "Our Lakecliff estate needed a complete luxury plumbing system including infinity pool, outdoor kitchen, wine room cooling, and smart home integration. Economy Plumbing delivered flawless work. They're true luxury Lake Travis specialists!",
            rating: 5
          }),
          JSON.stringify({
            name: "Robert S.",
            neighborhood: "The Reserve",
            text: "We're only in our Reserve home seasonally. Economy Plumbing installed comprehensive monitoring with automatic shutoff and remote alerts. They've maintained our complex systems perfectly - dock, pool, outdoor kitchen, everything. Highly recommend!",
            rating: 5
          })
        ],
        population: "11,980",
        zipCodes: ["78669"],
        latitude: "30.4756",
        longitude: "-98.1564"
      }
    ];

    areas.forEach(area => this.serviceAreas.set(area.id, area));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values())
      .filter(post => post.published)
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const post: BlogPost = {
      id,
      title: insertPost.title,
      slug: insertPost.slug,
      content: insertPost.content,
      excerpt: insertPost.excerpt ?? null,
      author: insertPost.author ?? "Economy Plumbing",
      publishDate: new Date(),
      category: insertPost.category,
      featuredImage: insertPost.featuredImage ?? null,
      imageId: null,
      metaDescription: insertPost.metaDescription ?? null,
      published: insertPost.published ?? true,
      isScheduled: false,
      scheduledFor: null,
      generatedByAI: false
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost> {
    const post = this.blogPosts.get(id);
    if (!post) {
      throw new Error(`Blog post with id ${id} not found`);
    }
    
    const updatedPost = { ...post, ...updates };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.active);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.slug === slug);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      id,
      name: insertProduct.name,
      slug: insertProduct.slug,
      description: insertProduct.description,
      price: insertProduct.price,
      category: insertProduct.category,
      image: insertProduct.image ?? null,
      stripeProductId: insertProduct.stripeProductId ?? null,
      stripePriceId: insertProduct.stripePriceId ?? null,
      features: insertProduct.features ?? null,
      active: insertProduct.active ?? true,
      serviceTitanMembershipTypeId: insertProduct.serviceTitanMembershipTypeId ?? null,
      serviceTitanEnabled: insertProduct.serviceTitanEnabled ?? false
    };
    this.products.set(id, product);
    return product;
  }

  async createContactSubmission(insertSubmission: InsertContactSubmission): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = {
      id,
      name: insertSubmission.name,
      phone: insertSubmission.phone,
      email: insertSubmission.email ?? null,
      service: insertSubmission.service ?? null,
      location: insertSubmission.location ?? null,
      urgency: insertSubmission.urgency ?? null,
      message: insertSubmission.message ?? null,
      pageContext: insertSubmission.pageContext ?? null,
      submittedAt: new Date()
    };
    this.contactSubmissions.set(id, submission);
    return submission;
  }

  async createCustomerSuccessStory(insertStory: InsertCustomerSuccessStory): Promise<CustomerSuccessStory> {
    const id = randomUUID();
    const story: CustomerSuccessStory = {
      id,
      customerName: insertStory.customerName,
      email: insertStory.email ?? null,
      phone: insertStory.phone ?? null,
      story: insertStory.story,
      beforePhotoUrl: insertStory.beforePhotoUrl,
      afterPhotoUrl: insertStory.afterPhotoUrl,
      collagePhotoUrl: null,
      serviceCategory: insertStory.serviceCategory,
      location: insertStory.location,
      approved: false,
      submittedAt: new Date()
    };
    this.customerSuccessStories.set(id, story);
    return story;
  }

  async getApprovedSuccessStories(): Promise<CustomerSuccessStory[]> {
    return Array.from(this.customerSuccessStories.values()).filter(story => story.approved);
  }

  async getAllSuccessStories(): Promise<CustomerSuccessStory[]> {
    return Array.from(this.customerSuccessStories.values());
  }

  async approveSuccessStory(id: string, collagePhotoUrl: string): Promise<CustomerSuccessStory> {
    const story = this.customerSuccessStories.get(id);
    if (!story) {
      throw new Error(`Success story with id ${id} not found`);
    }
    story.approved = true;
    story.collagePhotoUrl = collagePhotoUrl;
    this.customerSuccessStories.set(id, story);
    return story;
  }

  async unapproveSuccessStory(id: string): Promise<CustomerSuccessStory> {
    const story = this.customerSuccessStories.get(id);
    if (!story) {
      throw new Error(`Success story with id ${id} not found`);
    }
    story.approved = false;
    story.collagePhotoUrl = null;
    this.customerSuccessStories.set(id, story);
    return story;
  }

  async deleteSuccessStory(id: string): Promise<void> {
    this.customerSuccessStories.delete(id);
  }

  async getServiceAreaBySlug(slug: string): Promise<ServiceArea | undefined> {
    return Array.from(this.serviceAreas.values()).find(area => area.slug === slug);
  }

  async getAllServiceAreas(): Promise<ServiceArea[]> {
    return Array.from(this.serviceAreas.values());
  }

  async createServiceArea(area: InsertServiceArea): Promise<ServiceArea> {
    const id = randomUUID();
    const newArea: ServiceArea = {
      id,
      slug: area.slug,
      metaDescription: area.metaDescription,
      cityName: area.cityName,
      region: area.region,
      introContent: area.introContent,
      neighborhoods: area.neighborhoods ?? null,
      landmarks: area.landmarks ?? null,
      localPainPoints: area.localPainPoints ?? null,
      seasonalIssues: area.seasonalIssues ?? null,
      uniqueFaqs: area.uniqueFaqs ?? null,
      testimonials: area.testimonials ?? null,
      population: area.population ?? null,
      zipCodes: area.zipCodes ?? null,
      latitude: area.latitude ?? null,
      longitude: area.longitude ?? null
    };
    this.serviceAreas.set(id, newArea);
    return newArea;
  }

  async getGoogleReviews(): Promise<GoogleReview[]> {
    return Array.from(this.googleReviews.values());
  }

  async saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<void> {
    for (const review of reviews) {
      const id = randomUUID();
      const googleReview: GoogleReview = {
        id,
        authorName: review.authorName,
        authorUrl: review.authorUrl ?? null,
        profilePhotoUrl: review.profilePhotoUrl ?? null,
        rating: review.rating,
        text: review.text,
        relativeTime: review.relativeTime,
        timestamp: review.timestamp,
        categories: review.categories || [],
        fetchedAt: new Date(),
        source: review.source || 'places_api',
        reviewId: review.reviewId ?? null,
      };
      this.googleReviews.set(id, googleReview);
    }
  }

  async deleteGoogleReviews(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.googleReviews.delete(id);
    }
  }

  async clearGoogleReviews(): Promise<void> {
    this.googleReviews.clear();
  }

  async replaceGoogleReviews(reviews: InsertGoogleReview[]): Promise<void> {
    if (reviews.length === 0) {
      console.warn("No reviews to save - skipping in-memory update to preserve existing data");
      return;
    }
    
    this.googleReviews.clear();
    for (const review of reviews) {
      const id = randomUUID();
      const googleReview: GoogleReview = {
        id,
        authorName: review.authorName,
        authorUrl: review.authorUrl ?? null,
        profilePhotoUrl: review.profilePhotoUrl ?? null,
        rating: review.rating,
        text: review.text,
        relativeTime: review.relativeTime,
        timestamp: review.timestamp,
        fetchedAt: new Date(),
        categories: review.categories ?? [],
        source: review.source ?? 'places_api',
        reviewId: review.reviewId ?? null,
      };
      this.googleReviews.set(id, googleReview);
    }
  }

  async getGoogleOAuthToken(service: string = 'google_my_business'): Promise<GoogleOAuthToken | undefined> {
    // MemStorage stub - not used in production
    return undefined;
  }

  async saveGoogleOAuthToken(token: InsertGoogleOAuthToken): Promise<GoogleOAuthToken> {
    // MemStorage stub - not used in production
    throw new Error('OAuth not supported in MemStorage');
  }

  async updateGoogleOAuthToken(id: string, token: Partial<InsertGoogleOAuthToken>): Promise<GoogleOAuthToken> {
    // MemStorage stub - not used in production
    throw new Error('OAuth not supported in MemStorage');
  }

  async createServiceTitanMembership(membership: InsertServiceTitanMembership): Promise<ServiceTitanMembership> {
    const id = randomUUID();
    const newMembership: ServiceTitanMembership = {
      ...membership,
      id,
      customerName: membership.customerName ?? null,
      companyName: membership.companyName ?? null,
      contactPersonName: membership.contactPersonName ?? null,
      serviceTitanCustomerId: membership.serviceTitanCustomerId ?? null,
      serviceTitanMembershipId: membership.serviceTitanMembershipId ?? null,
      serviceTitanInvoiceId: membership.serviceTitanInvoiceId ?? null,
      stripePaymentIntentId: membership.stripePaymentIntentId ?? null,
      stripeCustomerId: membership.stripeCustomerId ?? null,
      syncStatus: membership.syncStatus ?? 'pending',
      syncError: membership.syncError ?? null,
      purchasedAt: new Date(),
      lastSyncAttempt: null,
      syncedAt: null,
    };
    this.serviceTitanMemberships.set(id, newMembership);
    return newMembership;
  }

  async updateServiceTitanMembership(id: string, updates: Partial<ServiceTitanMembership>): Promise<ServiceTitanMembership> {
    const existing = this.serviceTitanMemberships.get(id);
    if (!existing) {
      throw new Error('ServiceTitan membership not found');
    }
    const updated = { ...existing, ...updates };
    this.serviceTitanMemberships.set(id, updated);
    return updated;
  }

  async getServiceTitanMembershipById(id: string): Promise<ServiceTitanMembership | undefined> {
    return this.serviceTitanMemberships.get(id);
  }

  async getPendingServiceTitanMemberships(): Promise<ServiceTitanMembership[]> {
    return Array.from(this.serviceTitanMemberships.values()).filter(
      m => m.syncStatus === 'pending' || m.syncStatus === 'failed'
    );
  }

  async createPendingPurchase(purchase: InsertPendingPurchase): Promise<PendingPurchase> {
    const id = randomUUID();
    const newPurchase: PendingPurchase = {
      ...purchase,
      id,
      customerName: purchase.customerName ?? null,
      companyName: purchase.companyName ?? null,
      contactPersonName: purchase.contactPersonName ?? null,
      createdAt: new Date(),
    };
    // MemStorage stub - not used in production
    return newPurchase;
  }

  async getPendingPurchaseByPaymentIntent(paymentIntentId: string): Promise<PendingPurchase | undefined> {
    // MemStorage stub - not used in production
    return undefined;
  }

  async deletePendingPurchase(id: string): Promise<void> {
    // MemStorage stub - not used in production
  }

  async savePhotos(photos: InsertCompanyCamPhoto[]): Promise<CompanyCamPhoto[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async getAllPhotos(): Promise<CompanyCamPhoto[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async getPhotosByCategory(category: string): Promise<CompanyCamPhoto[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async getPhotosByJob(jobId: string): Promise<CompanyCamPhoto[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async getUnusedPhotos(category?: string): Promise<CompanyCamPhoto[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async getPhotoById(id: string): Promise<CompanyCamPhoto | undefined> {
    // MemStorage stub - not used in production
    return undefined;
  }

  async markPhotoAsUsed(id: string, blogPostId?: string, pageUrl?: string): Promise<CompanyCamPhoto> {
    // MemStorage stub - not used in production
    throw new Error("Not implemented in MemStorage");
  }

  async getPhotosWithoutBlogTopic(): Promise<CompanyCamPhoto[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async updatePhotoWithBlogTopic(id: string, topic: string): Promise<CompanyCamPhoto> {
    // MemStorage stub - not used in production
    throw new Error("Not implemented in MemStorage");
  }

  async saveBeforeAfterComposite(composite: InsertBeforeAfterComposite): Promise<BeforeAfterComposite> {
    // MemStorage stub - not used in production
    throw new Error("Not implemented in MemStorage");
  }

  async getBeforeAfterComposites(): Promise<BeforeAfterComposite[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async getUnusedComposites(): Promise<BeforeAfterComposite[]> {
    // MemStorage stub - not used in production
    return [];
  }

  async markCompositeAsPosted(id: string, facebookPostId: string | null, instagramPostId: string | null): Promise<BeforeAfterComposite> {
    // MemStorage stub - not used in production
    throw new Error("Not implemented in MemStorage");
  }

  async create404Error(error: InsertNotFoundError): Promise<NotFoundError> {
    // MemStorage stub - not used in production
    throw new Error("Not implemented in MemStorage");
  }

  async get404Errors(limit: number = 100): Promise<NotFoundError[]> {
    // MemStorage stub - not used in production
    return [];
  }
  
  async createImportedPhoto(photo: InsertImportedPhoto): Promise<ImportedPhoto> {
    // MemStorage stub - not used in production
    throw new Error("Not implemented in MemStorage");
  }
  
  async getAllImportedPhotos(): Promise<ImportedPhoto[]> {
    // MemStorage stub - not used in production
    return [];
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts);
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [created] = await db
      .insert(blogPosts)
      .values(post)
      .returning();
    return created;
  }

  async updateBlogPost(id: string, updates: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updated] = await db
      .update(blogPosts)
      .set(updates)
      .where(eq(blogPosts.id, id))
      .returning();
    
    if (!updated) {
      throw new Error(`Blog post with id ${id} not found`);
    }
    
    return updated;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product || undefined;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db
      .insert(products)
      .values(product)
      .returning();
    return created;
  }

  async createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission> {
    const [created] = await db
      .insert(contactSubmissions)
      .values(submission)
      .returning();
    return created;
  }

  async createCustomerSuccessStory(story: InsertCustomerSuccessStory): Promise<CustomerSuccessStory> {
    const [created] = await db
      .insert(customerSuccessStories)
      .values(story)
      .returning();
    return created;
  }

  async getApprovedSuccessStories(): Promise<CustomerSuccessStory[]> {
    return await db.select().from(customerSuccessStories).where(eq(customerSuccessStories.approved, true));
  }

  async getAllSuccessStories(): Promise<CustomerSuccessStory[]> {
    return await db.select().from(customerSuccessStories);
  }

  async approveSuccessStory(id: string, collagePhotoUrl: string): Promise<CustomerSuccessStory> {
    const [story] = await db
      .update(customerSuccessStories)
      .set({ approved: true, collagePhotoUrl })
      .where(eq(customerSuccessStories.id, id))
      .returning();
    
    if (!story) {
      throw new Error(`Success story with id ${id} not found`);
    }
    
    return story;
  }

  async unapproveSuccessStory(id: string): Promise<CustomerSuccessStory> {
    const [story] = await db
      .update(customerSuccessStories)
      .set({ approved: false, collagePhotoUrl: null })
      .where(eq(customerSuccessStories.id, id))
      .returning();
    
    if (!story) {
      throw new Error(`Success story with id ${id} not found`);
    }
    
    return story;
  }

  async deleteSuccessStory(id: string): Promise<void> {
    await db.delete(customerSuccessStories).where(eq(customerSuccessStories.id, id));
  }

  async getServiceAreaBySlug(slug: string): Promise<ServiceArea | undefined> {
    const [area] = await db.select().from(serviceAreas).where(eq(serviceAreas.slug, slug));
    return area || undefined;
  }

  async getAllServiceAreas(): Promise<ServiceArea[]> {
    return await db.select().from(serviceAreas);
  }

  async createServiceArea(area: InsertServiceArea): Promise<ServiceArea> {
    const [created] = await db
      .insert(serviceAreas)
      .values(area)
      .returning();
    return created;
  }

  async getGoogleReviews(): Promise<GoogleReview[]> {
    return await db
      .select()
      .from(googleReviews)
      .orderBy(sql`${googleReviews.timestamp} DESC`);
  }

  async saveGoogleReviews(reviews: InsertGoogleReview[]): Promise<void> {
    if (reviews.length === 0) return;
    
    await db.insert(googleReviews).values(reviews);
  }

  async deleteGoogleReviews(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    
    await db.delete(googleReviews).where(sql`${googleReviews.id} = ANY(${ids})`);
  }

  async clearGoogleReviews(): Promise<void> {
    await db.delete(googleReviews);
  }

  /**
   * Replace all Google reviews with new reviews in a single atomic transaction.
   * This prevents data loss if the save operation fails.
   */
  async replaceGoogleReviews(reviews: InsertGoogleReview[]): Promise<void> {
    if (reviews.length === 0) {
      console.warn("No reviews to save - skipping database update to preserve existing data");
      return;
    }

    // Use a transaction to ensure atomicity: either both delete and insert succeed, or neither happens
    await db.transaction(async (tx) => {
      // Delete all existing reviews
      await tx.delete(googleReviews);
      
      // Insert new reviews
      await tx.insert(googleReviews).values(reviews);
    });
  }

  async getGoogleOAuthToken(service: string = 'google_my_business'): Promise<GoogleOAuthToken | undefined> {
    const [token] = await db
      .select()
      .from(googleOAuthTokens)
      .where(eq(googleOAuthTokens.service, service))
      .limit(1);
    return token || undefined;
  }

  async saveGoogleOAuthToken(token: InsertGoogleOAuthToken): Promise<GoogleOAuthToken> {
    const [savedToken] = await db
      .insert(googleOAuthTokens)
      .values(token)
      .returning();
    return savedToken;
  }

  async updateGoogleOAuthToken(id: string, tokenUpdate: Partial<InsertGoogleOAuthToken>): Promise<GoogleOAuthToken> {
    const [updatedToken] = await db
      .update(googleOAuthTokens)
      .set({ ...tokenUpdate, updatedAt: new Date() })
      .where(eq(googleOAuthTokens.id, id))
      .returning();
    return updatedToken;
  }

  async createServiceTitanMembership(membership: InsertServiceTitanMembership): Promise<ServiceTitanMembership> {
    const [created] = await db
      .insert(serviceTitanMemberships)
      .values(membership)
      .returning();
    return created;
  }

  async updateServiceTitanMembership(id: string, updates: Partial<ServiceTitanMembership>): Promise<ServiceTitanMembership> {
    const [updated] = await db
      .update(serviceTitanMemberships)
      .set(updates)
      .where(eq(serviceTitanMemberships.id, id))
      .returning();
    return updated;
  }

  async getServiceTitanMembershipById(id: string): Promise<ServiceTitanMembership | undefined> {
    const [membership] = await db
      .select()
      .from(serviceTitanMemberships)
      .where(eq(serviceTitanMemberships.id, id))
      .limit(1);
    return membership || undefined;
  }

  async getPendingServiceTitanMemberships(): Promise<ServiceTitanMembership[]> {
    return await db
      .select()
      .from(serviceTitanMemberships)
      .where(sql`${serviceTitanMemberships.syncStatus} IN ('pending', 'failed')`);
  }

  async createPendingPurchase(purchase: InsertPendingPurchase): Promise<PendingPurchase> {
    const [created] = await db
      .insert(pendingPurchases)
      .values(purchase)
      .returning();
    return created;
  }

  async getPendingPurchaseByPaymentIntent(paymentIntentId: string): Promise<PendingPurchase | undefined> {
    const [purchase] = await db
      .select()
      .from(pendingPurchases)
      .where(eq(pendingPurchases.paymentIntentId, paymentIntentId))
      .limit(1);
    return purchase || undefined;
  }

  async deletePendingPurchase(id: string): Promise<void> {
    await db
      .delete(pendingPurchases)
      .where(eq(pendingPurchases.id, id));
  }

  async savePhotos(photos: InsertCompanyCamPhoto[]): Promise<CompanyCamPhoto[]> {
    if (photos.length === 0) return [];
    
    const saved = await db
      .insert(companyCamPhotos)
      .values(photos)
      .onConflictDoUpdate({
        target: companyCamPhotos.companyCamPhotoId,
        set: {
          qualityAnalyzed: sql`EXCLUDED.quality_analyzed`,
          isGoodQuality: sql`EXCLUDED.is_good_quality`,
          shouldKeep: sql`EXCLUDED.should_keep`,
          qualityScore: sql`EXCLUDED.quality_score`,
          qualityReasoning: sql`EXCLUDED.quality_reasoning`,
          analyzedAt: sql`EXCLUDED.analyzed_at`,
        },
      })
      .returning();
    
    return saved;
  }

  async getAllPhotos(): Promise<CompanyCamPhoto[]> {
    // Get CompanyCam photos
    const companyCamResults = await db
      .select()
      .from(companyCamPhotos)
      .orderBy(sql`${companyCamPhotos.fetchedAt} DESC`);
    
    // Get imported photos (Google Drive) and normalize to CompanyCam format
    const importedResults = await db
      .select()
      .from(importedPhotos)
      .orderBy(sql`${importedPhotos.fetchedAt} DESC`);
    
    // Convert imported photos to CompanyCam format for unified display
    const normalizedImported = importedResults.map(photo => ({
      id: photo.id,
      companyCamPhotoId: null,
      companyCamProjectId: null,
      photoUrl: photo.url,
      thumbnailUrl: null,
      category: photo.category,
      tags: photo.aiTags || [],
      aiDescription: photo.aiDescription,
      qualityAnalyzed: true,
      isGoodQuality: photo.isProductionQuality,
      shouldKeep: photo.isProductionQuality,
      qualityScore: photo.aiQuality || 0,
      qualityReasoning: photo.qualityReason || null,
      analyzedAt: photo.fetchedAt,
      usedInBlogPostId: null,
      usedInPageUrl: null,
      blogTopicAnalyzed: false,
      blogTopicAnalyzedAt: null,
      suggestedBlogTopic: null,
      fetchedAt: photo.fetchedAt,
      // Add source identifier for UI
      photoSource: 'google-drive' as any,
    }));
    
    // Mark CompanyCam photos with source
    const markedCompanyCam = companyCamResults.map(photo => ({
      ...photo,
      photoSource: 'companycam' as any,
    }));
    
    // Combine and sort by date
    const allPhotos = [...markedCompanyCam, ...normalizedImported];
    allPhotos.sort((a, b) => b.fetchedAt.getTime() - a.fetchedAt.getTime());
    
    return allPhotos as CompanyCamPhoto[];
  }

  async getPhotosByCategory(category: string): Promise<CompanyCamPhoto[]> {
    return await db
      .select()
      .from(companyCamPhotos)
      .where(sql`${companyCamPhotos.category} = ${category} AND ${companyCamPhotos.shouldKeep} = true`);
  }

  async getPhotosByJob(jobId: string): Promise<CompanyCamPhoto[]> {
    return await db
      .select()
      .from(companyCamPhotos)
      .where(sql`${companyCamPhotos.companyCamProjectId} = ${jobId} AND ${companyCamPhotos.shouldKeep} = true`);
  }

  async getUnusedPhotos(category?: string): Promise<CompanyCamPhoto[]> {
    if (category) {
      return await db
        .select()
        .from(companyCamPhotos)
        .where(sql`${companyCamPhotos.category} = ${category} AND ${companyCamPhotos.usedInBlogPostId} IS NULL AND ${companyCamPhotos.usedInPageUrl} IS NULL AND ${companyCamPhotos.shouldKeep} = true`);
    }
    
    return await db
      .select()
      .from(companyCamPhotos)
      .where(sql`${companyCamPhotos.usedInBlogPostId} IS NULL AND ${companyCamPhotos.usedInPageUrl} IS NULL AND ${companyCamPhotos.shouldKeep} = true`);
  }

  async getPhotoById(id: string): Promise<CompanyCamPhoto | undefined> {
    const [photo] = await db
      .select()
      .from(companyCamPhotos)
      .where(eq(companyCamPhotos.id, id))
      .limit(1);
    return photo || undefined;
  }

  async markPhotoAsUsed(id: string, blogPostId?: string, pageUrl?: string): Promise<CompanyCamPhoto> {
    const [updated] = await db
      .update(companyCamPhotos)
      .set({
        usedInBlogPostId: blogPostId || null,
        usedInPageUrl: pageUrl || null,
      })
      .where(eq(companyCamPhotos.id, id))
      .returning();
    return updated;
  }

  async getPhotosWithoutBlogTopic(): Promise<CompanyCamPhoto[]> {
    return await db
      .select()
      .from(companyCamPhotos)
      .where(
        sql`${companyCamPhotos.shouldKeep} = true 
        AND (${companyCamPhotos.usedInBlogPostId} IS NULL OR ${companyCamPhotos.usedInBlogPostId} = '') 
        AND (${companyCamPhotos.blogTopicAnalyzed} = false OR ${companyCamPhotos.blogTopicAnalyzed} IS NULL)`
      )
      .orderBy(companyCamPhotos.qualityScore);
  }

  async updatePhotoWithBlogTopic(id: string, topic: string): Promise<CompanyCamPhoto> {
    const [updated] = await db
      .update(companyCamPhotos)
      .set({
        suggestedBlogTopic: topic,
        blogTopicAnalyzed: true,
        blogTopicAnalyzedAt: new Date(),
      })
      .where(eq(companyCamPhotos.id, id))
      .returning();
    return updated;
  }

  async saveBeforeAfterComposite(composite: InsertBeforeAfterComposite): Promise<BeforeAfterComposite> {
    const [saved] = await db
      .insert(beforeAfterComposites)
      .values(composite)
      .returning();
    return saved;
  }

  async getBeforeAfterComposites(): Promise<BeforeAfterComposite[]> {
    return await db
      .select()
      .from(beforeAfterComposites)
      .orderBy(sql`${beforeAfterComposites.createdAt} DESC`);
  }

  async getUnusedComposites(): Promise<BeforeAfterComposite[]> {
    return await db
      .select()
      .from(beforeAfterComposites)
      .where(sql`${beforeAfterComposites.postedToFacebook} = false AND ${beforeAfterComposites.postedToInstagram} = false`)
      .orderBy(sql`${beforeAfterComposites.createdAt} DESC`);
  }

  async markCompositeAsPosted(id: string, facebookPostId: string | null, instagramPostId: string | null): Promise<BeforeAfterComposite> {
    const [updated] = await db
      .update(beforeAfterComposites)
      .set({
        postedToFacebook: facebookPostId !== null,
        postedToInstagram: instagramPostId !== null,
        facebookPostId,
        instagramPostId,
        postedAt: new Date(),
      })
      .where(eq(beforeAfterComposites.id, id))
      .returning();
    return updated;
  }

  async create404Error(error: InsertNotFoundError): Promise<NotFoundError> {
    const [created] = await db
      .insert(notFoundErrors)
      .values(error)
      .returning();
    return created;
  }

  async get404Errors(limit: number = 100): Promise<NotFoundError[]> {
    return await db
      .select()
      .from(notFoundErrors)
      .orderBy(sql`${notFoundErrors.timestamp} DESC`)
      .limit(limit);
  }
  
  async createImportedPhoto(photo: InsertImportedPhoto): Promise<ImportedPhoto> {
    const [created] = await db
      .insert(importedPhotos)
      .values(photo)
      .returning();
    return created;
  }
  
  async getAllImportedPhotos(): Promise<ImportedPhoto[]> {
    return await db
      .select()
      .from(importedPhotos)
      .orderBy(sql`${importedPhotos.fetchedAt} DESC`);
  }

  // Tracking Numbers methods
  async getAllTrackingNumbers(): Promise<TrackingNumber[]> {
    return await db
      .select()
      .from(trackingNumbers)
      .orderBy(sql`${trackingNumbers.sortOrder} ASC, ${trackingNumbers.channelName} ASC`);
  }

  async getActiveTrackingNumbers(): Promise<TrackingNumber[]> {
    return await db
      .select()
      .from(trackingNumbers)
      .where(eq(trackingNumbers.isActive, true))
      .orderBy(sql`${trackingNumbers.sortOrder} ASC, ${trackingNumbers.channelName} ASC`);
  }

  async getTrackingNumberByKey(channelKey: string): Promise<TrackingNumber | undefined> {
    const [result] = await db
      .select()
      .from(trackingNumbers)
      .where(eq(trackingNumbers.channelKey, channelKey))
      .limit(1);
    return result;
  }

  async getDefaultTrackingNumber(): Promise<TrackingNumber | undefined> {
    const [result] = await db
      .select()
      .from(trackingNumbers)
      .where(eq(trackingNumbers.isDefault, true))
      .limit(1);
    return result;
  }

  async createTrackingNumber(number: InsertTrackingNumber): Promise<TrackingNumber> {
    const [created] = await db
      .insert(trackingNumbers)
      .values(number)
      .returning();
    return created;
  }

  async updateTrackingNumber(id: string, updates: Partial<InsertTrackingNumber>): Promise<TrackingNumber> {
    const [updated] = await db
      .update(trackingNumbers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trackingNumbers.id, id))
      .returning();
    return updated;
  }

  async deleteTrackingNumber(id: string): Promise<void> {
    await db
      .delete(trackingNumbers)
      .where(eq(trackingNumbers.id, id));
  }

  // Commercial Customers
  async getActiveCommercialCustomers(): Promise<CommercialCustomer[]> {
    const results = await db
      .select()
      .from(commercialCustomers)
      .where(eq(commercialCustomers.active, true))
      .orderBy(commercialCustomers.displayOrder);
    return results;
  }

  async getAllCommercialCustomers(): Promise<CommercialCustomer[]> {
    const results = await db
      .select()
      .from(commercialCustomers)
      .orderBy(commercialCustomers.displayOrder);
    return results;
  }

  async getCommercialCustomerById(id: string): Promise<CommercialCustomer | undefined> {
    const [result] = await db
      .select()
      .from(commercialCustomers)
      .where(eq(commercialCustomers.id, id))
      .limit(1);
    return result;
  }

  async createCommercialCustomer(customer: InsertCommercialCustomer): Promise<CommercialCustomer> {
    const [created] = await db
      .insert(commercialCustomers)
      .values(customer)
      .returning();
    return created;
  }

  async updateCommercialCustomer(id: string, updates: Partial<InsertCommercialCustomer>): Promise<CommercialCustomer> {
    const [updated] = await db
      .update(commercialCustomers)
      .set(updates)
      .where(eq(commercialCustomers.id, id))
      .returning();
    return updated;
  }

  async deleteCommercialCustomer(id: string): Promise<void> {
    await db
      .delete(commercialCustomers)
      .where(eq(commercialCustomers.id, id));
  }

  // Page Metadata
  async getAllPageMetadata(): Promise<PageMetadata[]> {
    const results = await db
      .select()
      .from(pageMetadata)
      .orderBy(pageMetadata.path);
    return results;
  }

  async getPageMetadataByPath(path: string): Promise<PageMetadata | undefined> {
    const [result] = await db
      .select()
      .from(pageMetadata)
      .where(eq(pageMetadata.path, path))
      .limit(1);
    return result;
  }

  async upsertPageMetadata(metadata: InsertPageMetadata): Promise<PageMetadata> {
    const [result] = await db
      .insert(pageMetadata)
      .values(metadata)
      .onConflictDoUpdate({
        target: pageMetadata.path,
        set: {
          ...metadata,
          updatedAt: new Date()
        }
      })
      .returning();
    return result;
  }

  async deletePageMetadata(id: string): Promise<void> {
    await db
      .delete(pageMetadata)
      .where(eq(pageMetadata.id, id));
  }

  // OAuth Users
  async getOAuthUser(id: string): Promise<OAuthUser | undefined> {
    const [user] = await db
      .select()
      .from(oauthUsers)
      .where(eq(oauthUsers.id, id));
    return user;
  }

  async upsertOAuthUser(userData: UpsertOAuthUser): Promise<OAuthUser> {
    const [user] = await db
      .insert(oauthUsers)
      .values(userData)
      .onConflictDoUpdate({
        target: oauthUsers.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Admin Whitelist
  async isEmailWhitelisted(email: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(adminWhitelist)
      .where(eq(adminWhitelist.email, email))
      .limit(1);
    return !!result;
  }

  async addToWhitelist(data: InsertAdminWhitelist): Promise<AdminWhitelist> {
    const [result] = await db
      .insert(adminWhitelist)
      .values(data)
      .returning();
    return result;
  }

  async removeFromWhitelist(email: string): Promise<void> {
    await db
      .delete(adminWhitelist)
      .where(eq(adminWhitelist.email, email));
  }

  async getAllWhitelistedEmails(): Promise<AdminWhitelist[]> {
    const results = await db
      .select()
      .from(adminWhitelist)
      .orderBy(adminWhitelist.addedAt);
    return results;
  }
}

export const storage = new DatabaseStorage();
