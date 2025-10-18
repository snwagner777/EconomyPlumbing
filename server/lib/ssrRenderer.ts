/**
 * Server-Side Rendering (SSR) for Crawlers
 * 
 * This module provides basic HTML rendering for search engine crawlers
 * that don't execute JavaScript. Regular users still get the full React app.
 * 
 * HOW TO ADD SSR TO A NEW PAGE:
 * ===============================
 * 
 * 1. Add page config to `ssrPages` array below:
 *    - path: The URL path (e.g., '/water-heater-services')
 *    - title: SEO title (50-60 characters)
 *    - description: Meta description (150-160 chars with phone & location)
 *    - h1: Main heading text
 *    - content: HTML content for crawlers
 * 
 * 2. Register in server/index.ts:
 *    Add to the crawler check block (around line 265):
 *    ```
 *    if (ssrPages.some(p => p.path === req.path)) {
 *      return await handleSSRPage(req, res, next);
 *    }
 *    ```
 * 
 * 3. That's it! Cache invalidation is automatic.
 * 
 * BENEFITS:
 * - Event-driven cache (invalidates when content changes)
 * - Dynamic phone numbers for crawlers
 * - Proper SEO meta tags
 * - Structured data support
 */

export interface SSRPageConfig {
  path: string;
  title: string;
  description: string;
  h1: string;
  content: string;
  ogImage?: string; // Optional custom OG image
}

/**
 * SSR Page Configurations
 * Add new pages here to enable SSR
 */
export const ssrPages: SSRPageConfig[] = [
  {
    path: '/schedule-appointment',
    title: 'Schedule Your Appointment | Economy Plumbing',
    description: 'Book plumbing service online. Choose your preferred date & time for same-day service. Austin & Marble Falls. Licensed plumbers 24/7. Call (512) 368-9159!',
    h1: 'Schedule Your Appointment',
    content: `
      <div class="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-6">Schedule Your Appointment</h1>
            <p class="text-xl text-muted-foreground">
              Book your plumbing service online with Economy Plumbing Services. 
              Choose your preferred date and time, and we'll take care of the rest.
            </p>
          </div>
        </div>
      </div>
      
      <div class="py-16 bg-background">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold mb-4">Book Your Service Online</h2>
              <p class="text-lg text-muted-foreground">
                Select your preferred appointment time and we'll confirm your booking within minutes.
              </p>
            </div>
            
            <div class="grid md:grid-cols-3 gap-6 mb-12">
              <div class="p-6 text-center border rounded-lg">
                <h3 class="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                <p class="text-muted-foreground">
                  Choose from available time slots that work best for your schedule
                </p>
              </div>
              
              <div class="p-6 text-center border rounded-lg">
                <h3 class="text-xl font-semibold mb-2">Licensed & Insured</h3>
                <p class="text-muted-foreground">
                  All our technicians are fully licensed and insured professionals
                </p>
              </div>
              
              <div class="p-6 text-center border rounded-lg">
                <h3 class="text-xl font-semibold mb-2">Instant Confirmation</h3>
                <p class="text-muted-foreground">
                  Receive immediate confirmation and reminders for your appointment
                </p>
              </div>
            </div>
            
            <div class="p-4 border rounded-lg">
              <iframe 
                src="https://go.servicetitan.com/webscheduler?tenantid=576158144&campaignid=3261493" 
                style="width: 100%; height: 700px; border: none;"
                title="ServiceTitan Web Scheduler"
              ></iframe>
            </div>
            
            <div class="mt-12 text-center">
              <h2 class="text-3xl font-bold mb-4">We Serve Your Area</h2>
              <p class="text-lg text-muted-foreground mb-8">
                Professional plumbing services across Central Texas
              </p>
              
              <div class="grid md:grid-cols-3 gap-8">
                <div>
                  <h3 class="text-xl font-semibold mb-3">Austin Metro</h3>
                  <p>Austin, Cedar Park, Leander, Round Rock, Georgetown</p>
                </div>
                <div>
                  <h3 class="text-xl font-semibold mb-3">Hill Country</h3>
                  <p>Marble Falls, Burnet, Horseshoe Bay, Kingsland</p>
                </div>
                <div>
                  <h3 class="text-xl font-semibold mb-3">South Austin</h3>
                  <p>Buda, Kyle, Dripping Springs, Wimberley</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    path: '/water-heater-services',
    title: 'Water Heater Services | Economy Plumbing',
    description: 'Expert water heater repair, replacement & installation in Austin & Marble Falls, TX. Same-day service. Licensed plumbers. 24/7 emergency repairs. Call (512) 368-9159 today!',
    h1: 'Water Heater Services',
    content: `
      <div class="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-6">Water Heater Services</h1>
            <p class="text-xl text-muted-foreground">
              Expert water heater repair, replacement, and installation services across Central Texas
            </p>
          </div>
        </div>
      </div>
      
      <div class="py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold mb-8">Our Water Heater Services</h2>
            
            <div class="grid md:grid-cols-2 gap-8 mb-12">
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Water Heater Repair</h3>
                <p>Fast, reliable repairs for all water heater brands. Same-day service available.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Water Heater Replacement</h3>
                <p>Professional installation of new water heaters with manufacturer warranties.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Tankless Water Heaters</h3>
                <p>Energy-efficient tankless water heater installation and maintenance.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Emergency Service</h3>
                <p>24/7 emergency water heater repairs. Licensed and insured plumbers.</p>
              </div>
            </div>
            
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold mb-4">Call Us Today</h2>
              <p class="text-xl mb-6">Expert water heater service across Austin & Marble Falls</p>
              <a href="tel:5123689159" class="text-2xl font-bold text-primary">(512) 368-9159</a>
            </div>
            
            <div class="mt-12">
              <h3 class="text-2xl font-semibold mb-6">Areas We Serve</h3>
              <div class="grid md:grid-cols-3 gap-8">
                <div>
                  <h4 class="font-semibold mb-2">Austin Metro</h4>
                  <p class="text-sm text-muted-foreground">Austin, Cedar Park, Leander, Round Rock, Georgetown, Pflugerville</p>
                </div>
                <div>
                  <h4 class="font-semibold mb-2">Hill Country</h4>
                  <p class="text-sm text-muted-foreground">Marble Falls, Burnet, Horseshoe Bay, Kingsland, Bertram, Spicewood</p>
                </div>
                <div>
                  <h4 class="font-semibold mb-2">South Austin</h4>
                  <p class="text-sm text-muted-foreground">Buda, Kyle, Dripping Springs, Wimberley</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    path: '/drain-cleaning',
    title: 'Drain Cleaning Services | Economy Plumbing',
    description: 'Professional drain cleaning in Austin & Marble Falls, TX. Hydro jetting, rooter service, 24/7 emergency clogs. Licensed plumbers. Fast response. Call (512) 368-9159 now!',
    h1: 'Professional Drain Cleaning',
    content: `
      <div class="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-6">Professional Drain Cleaning</h1>
            <p class="text-xl text-muted-foreground">
              Expert drain cleaning services for residential and commercial properties
            </p>
          </div>
        </div>
      </div>
      
      <div class="py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold mb-8">Our Drain Services</h2>
            
            <div class="grid md:grid-cols-2 gap-8 mb-12">
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Hydro Jetting</h3>
                <p>High-pressure water jetting to clear tough clogs and buildup.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Rooter Service</h3>
                <p>Professional rooter service to clear tree roots and stubborn blockages.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Camera Inspection</h3>
                <p>Video camera inspections to diagnose drain and sewer line issues.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Emergency Service</h4>
                <p>24/7 emergency drain cleaning. Fast response for urgent situations.</p>
              </div>
            </div>
            
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold mb-4">Need Drain Cleaning?</h2>
              <p class="text-xl mb-6">Fast, professional service across Central Texas</p>
              <a href="tel:5123689159" class="text-2xl font-bold text-primary">(512) 368-9159</a>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    path: '/leak-repair',
    title: 'Leak Repair Services | Economy Plumbing',
    description: 'Expert leak detection & repair in Austin & Marble Falls, TX. Pipe leaks, slab leaks, water line repairs. 24/7 emergency service. Licensed plumbers. Call (512) 368-9159!',
    h1: 'Leak Detection & Repair',
    content: `
      <div class="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-6">Leak Detection & Repair</h1>
            <p class="text-xl text-muted-foreground">
              Advanced leak detection and professional repair services
            </p>
          </div>
        </div>
      </div>
      
      <div class="py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold mb-8">Expert Leak Services</h2>
            
            <div class="grid md:grid-cols-2 gap-8 mb-12">
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Leak Detection</h3>
                <p>Advanced technology to locate hidden leaks without damage to property.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Slab Leak Repair</h3>
                <p>Specialized repairs for leaks under concrete foundations.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Pipe Repair</h3>
                <p>Professional repair and replacement of damaged pipes.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Emergency Response</h3>
                <p>24/7 emergency leak repair to prevent water damage.</p>
              </div>
            </div>
            
            <div class="text-center mb-12">
              <h2 class="text-3xl font-bold mb-4">Have a Leak?</h2>
              <p class="text-xl mb-6">Fast leak detection and repair across Central Texas</p>
              <a href="tel:5123689159" class="text-2xl font-bold text-primary">(512) 368-9159</a>
            </div>
          </div>
        </div>
      </div>
    `
  },
  {
    path: '/emergency-plumbing',
    title: '24/7 Emergency Plumbing | Economy Plumbing',
    description: 'Emergency plumber in Austin & Marble Falls, TX. 24/7 service. Burst pipes, gas leaks, water heater failures. Licensed & insured. Fast response. Call (512) 368-9159 NOW!',
    h1: '24/7 Emergency Plumbing',
    content: `
      <div class="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto text-center">
            <h1 class="text-4xl md:text-5xl font-bold mb-6">24/7 Emergency Plumbing</h1>
            <p class="text-xl text-muted-foreground">
              Fast, reliable emergency plumbing services when you need them most
            </p>
          </div>
        </div>
      </div>
      
      <div class="py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold mb-8">Emergency Services</h2>
            
            <div class="grid md:grid-cols-2 gap-8 mb-12">
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Burst Pipes</h3>
                <p>Immediate response to burst pipe emergencies to prevent water damage.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Gas Leaks</h3>
                <p>Emergency gas leak detection and repair. Your safety is our priority.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Sewer Backups</h3>
                <p>Fast response to sewer emergencies and backups.</p>
              </div>
              
              <div class="p-6 border rounded-lg">
                <h3 class="text-xl font-semibold mb-4">Water Heater Failures</h3>
                <p>Emergency water heater repairs and replacements available 24/7.</p>
              </div>
            </div>
            
            <div class="text-center mb-12 p-8 bg-primary/10 rounded-lg">
              <h2 class="text-3xl font-bold mb-4">Need Emergency Plumbing NOW?</h2>
              <p class="text-xl mb-6">We're available 24/7 across Austin & Marble Falls</p>
              <a href="tel:5123689159" class="text-3xl font-bold text-primary">(512) 368-9159</a>
              <p class="mt-4 text-lg">Licensed & Insured • Fast Response • Professional Service</p>
            </div>
          </div>
        </div>
      </div>
    `
  }
];

/**
 * Detect if request is from a crawler and return traffic source
 */
export function isCrawler(userAgent: string): { isCrawler: boolean; source: string | null } {
  const ua = userAgent.toLowerCase();
  
  // Map crawler user agents to channel keys (matches tracking_numbers.channelKey in database)
  // These channel keys map to the dropdown options in the admin panel
  const crawlerMapping: Record<string, string> = {
    'googlebot': 'googlebot',           // Google Search crawler
    'bingbot': 'bingbot',               // Bing Search crawler
    'slurp': 'yahoo',                   // Yahoo Search crawler
    'duckduckbot': 'duckduckgo',        // DuckDuckGo crawler
    'baiduspider': 'baidu',             // Baidu crawler (China)
    'yandexbot': 'yandex',              // Yandex crawler (Russia)
    'facebookexternalhit': 'facebookbot', // Facebook link preview crawler
    'twitterbot': 'twitterbot',         // Twitter/X card preview
    'linkedinbot': 'linkedinbot',       // LinkedIn link preview
    'pinterestbot': 'pinterestbot',     // Pinterest crawler
    'whatsapp': 'whatsapp',             // WhatsApp link preview
    'telegrambot': 'telegram',          // Telegram link preview
    'slackbot': 'slack',                // Slack link preview
    'discordbot': 'discord',            // Discord link preview
  };
  
  // Check all crawler patterns (including ones without phone tracking)
  const allCrawlerPatterns = [
    ...Object.keys(crawlerMapping),
    'seranking',  // SE Ranking crawler
    'ahrefsbot',
    'semrushbot',
    'mj12bot',
    'dotbot',
    'whatsapp',
    'telegrambot',
    'slackbot',
    'discordbot',
  ];
  
  const isCrawlerBot = allCrawlerPatterns.some(pattern => ua.includes(pattern));
  
  if (!isCrawlerBot) {
    return { isCrawler: false, source: null };
  }
  
  // Find matching source for this crawler
  const source = Object.entries(crawlerMapping).find(([pattern]) => 
    ua.includes(pattern)
  )?.[1] || null;
  
  return { isCrawler: true, source };
}

/**
 * Render server-side HTML for crawlers using config-based approach
 * 
 * This helper function automatically generates SEO-optimized HTML for any page
 * defined in the ssrPages configuration array above.
 */
export function renderPageForCrawler(
  path: string, 
  baseHTML: string, 
  phoneNumber?: string
): string | null {
  // Find page config
  const pageConfig = ssrPages.find(p => p.path === path);
  if (!pageConfig) {
    return null; // Not a supported SSR page
  }
  
  // Inject metadata and basic content into HTML
  let html = baseHTML;
  
  // Replace phone numbers if crawler-specific number provided
  if (phoneNumber) {
    // Replace all instances of default phone number with crawler-specific one
    html = html.replace(/\(512\) 368-9159/g, phoneNumber);
    html = html.replace(/512-368-9159/g, phoneNumber.replace(/[()]/g, '').replace(/ /g, '-'));
    html = html.replace(/5123689159/g, phoneNumber.replace(/\D/g, ''));
  }
  
  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${pageConfig.title}</title>`
  );
  
  // Replace meta description
  html = html.replace(
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${pageConfig.description}" />`
  );
  
  // Add canonical URL
  const canonical = `https://www.plumbersthatcare.com${pageConfig.path}`;
  if (!html.includes('<link rel="canonical"')) {
    html = html.replace(
      '</head>',
      `  <link rel="canonical" href="${canonical}" />\n  </head>`
    );
  }
  
  // Add OpenGraph tags
  const ogImage = pageConfig.ogImage || 'https://www.plumbersthatcare.com/attached_assets/logo.jpg';
  const ogTags = `
  <!-- OpenGraph for Social Media -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${pageConfig.title}" />
  <meta property="og:description" content="${pageConfig.description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:site_name" content="Economy Plumbing Services" />`;
  
  html = html.replace('</head>', `${ogTags}\n  </head>`);
  
  // Inject basic content into body for crawlers
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${pageConfig.content}</div>`
  );
  
  return html;
}
