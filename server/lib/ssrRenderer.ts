/**
 * Server-Side Rendering (SSR) for Crawlers
 * 
 * This module provides basic HTML rendering for search engine crawlers
 * that don't execute JavaScript. Regular users still get the full React app.
 * 
 * Phase 1: /schedule-appointment page only
 */

interface PageMetadata {
  title: string;
  description: string;
  canonical: string;
  h1: string;
  content: string;
}

// Page metadata for SSR
const pageMetadata: Record<string, PageMetadata> = {
  '/schedule-appointment': {
    title: 'Schedule Your Appointment | Economy Plumbing',
    description: 'Book plumbing service online. Choose your preferred date & time for same-day service. Austin & Marble Falls. Licensed plumbers 24/7. Call (512) 368-9159!',
    canonical: 'https://www.plumbersthatcare.com/schedule-appointment',
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
  }
};

/**
 * Detect if request is from a crawler and return traffic source
 */
export function isCrawler(userAgent: string): { isCrawler: boolean; source: string | null } {
  const ua = userAgent.toLowerCase();
  
  // Map crawler user agents to traffic sources (for phone number tracking)
  const crawlerMapping: Record<string, string> = {
    'googlebot': 'google',
    'bingbot': 'bing',
    'slurp': 'yahoo',
    'duckduckbot': 'duckduckgo',
    'baiduspider': 'baidu',
    'yandexbot': 'yandex',
    'facebookexternalhit': 'facebook',
    'twitterbot': 'twitter',
    'linkedinbot': 'linkedin',
    'pinterestbot': 'pinterest',
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
 * Render server-side HTML for crawlers
 */
export function renderPageForCrawler(
  path: string, 
  baseHTML: string, 
  phoneNumber?: string
): string | null {
  const metadata = pageMetadata[path];
  if (!metadata) {
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
    `<title>${metadata.title}</title>`
  );
  
  // Replace meta description
  html = html.replace(
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${metadata.description}" />`
  );
  
  // Add canonical
  if (!html.includes('<link rel="canonical"')) {
    html = html.replace(
      '</head>',
      `  <link rel="canonical" href="${metadata.canonical}" />\n  </head>`
    );
  }
  
  // Add OpenGraph tags
  const ogTags = `
  <!-- OpenGraph for Social Media -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${metadata.canonical}" />
  <meta property="og:title" content="${metadata.title}" />
  <meta property="og:description" content="${metadata.description}" />
  <meta property="og:image" content="https://www.plumbersthatcare.com/attached_assets/logo.jpg" />
  <meta property="og:site_name" content="Economy Plumbing Services" />`;
  
  html = html.replace('</head>', `${ogTags}\n  </head>`);
  
  // Inject basic content into body for crawlers
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${metadata.content}</div>`
  );
  
  return html;
}
