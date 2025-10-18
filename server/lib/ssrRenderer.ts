/**
 * Server-Side Rendering (SSR) for Crawlers
 * 
 * ⚠️ STANDARD PRACTICE: ALL NEW PAGES MUST HAVE SSR ENABLED FOR SEO ⚠️
 * 
 * This module provides HTML rendering for search engine crawlers that don't 
 * execute JavaScript. Regular users still get the full React app.
 * 
 * HOW TO ADD SSR TO A NEW STATIC PAGE (REQUIRED):
 * ================================================
 * 
 * 1. Add page config to `ssrPages` array below:
 *    ```typescript
 *    {
 *      path: '/your-new-page',
 *      title: 'Your Page Title | Economy Plumbing', // 50-60 chars
 *      description: 'Your meta description with Call (512) 368-9159...', // 150-160 chars
 *      h1: 'Your Main Heading',
 *      content: `<div class="py-16">...your HTML...</div>`,
 *      ogImage: 'https://www.plumbersthatcare.com/image.jpg' // Optional
 *    }
 *    ```
 * 
 * 2. That's it! Everything else is automatic:
 *    - Registration happens automatically via ssrPaths Set
 *    - Cache invalidation is event-driven
 *    - Phone number tracking works automatically
 *    - OpenGraph tags are auto-generated
 * 
 * DYNAMIC PAGES (Blog Posts, etc.):
 * ==================================
 * Blog posts and other dynamic content are handled automatically via 
 * on-demand generation. No configuration needed!
 * 
 * BENEFITS:
 * - Zero overhead after first crawler visit (cached indefinitely)
 * - Event-driven cache invalidation (auto-clears when content changes)
 * - Crawler-specific phone numbers (Googlebot sees Google Ads number, etc.)
 * - Proper SEO meta tags, canonical URLs, OpenGraph
 * - Individual page cache invalidation support
 * - Proper 404 handling for crawlers (non-existent pages return 404 status)
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
  },
  
  // ===== ALL SERVICE PAGES =====
  {
    path: '/',
    title: 'Professional Plumbing Services | Economy Plumbing',
    description: 'Trusted plumbing services in Austin & Marble Falls, TX. Water heaters, drain cleaning, leak repair, emergency plumbing. Licensed & insured. Call (512) 368-9159 for service!',
    h1: 'Professional Plumbing Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Professional Plumbing Services</h1><p class="text-xl mb-8">Economy Plumbing Services provides professional plumbing services across Central Texas. Licensed, insured, and ready to serve you 24/7.</p><div class="grid md:grid-cols-3 gap-6"><div class="p-6 border rounded-lg"><h3 class="text-xl font-semibold mb-3">Water Heater Services</h3><p>Expert repair, replacement & installation</p></div><div class="p-6 border rounded-lg"><h3 class="text-xl font-semibold mb-3">Drain Cleaning</h3><p>Professional hydro jetting & rooter service</p></div><div class="p-6 border rounded-lg"><h3 class="text-xl font-semibold mb-3">Emergency Plumbing</h3><p>24/7 emergency service available</p></div></div></div></div>`
  },
  {
    path: '/plumber-near-me',
    title: 'Plumber Near Me - Austin & Marble Falls | Economy Plumbing',
    description: 'Find a local plumber near you in Austin, Cedar Park, Leander, Round Rock & Marble Falls, TX. Same-day service. Licensed & insured. Call (512) 368-9159 for fast service!',
    h1: 'Professional Plumbers Near You',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Professional Plumbers Near You</h1><p class="text-xl mb-8">Looking for a trusted plumber in your area? Economy Plumbing serves Austin, Marble Falls, and all of Central Texas with fast, professional service.</p></div></div>`
  },
  {
    path: '/toilet-faucet',
    title: 'Toilet & Faucet Repair | Economy Plumbing',
    description: 'Expert toilet & faucet repair in Austin & Marble Falls, TX. Fix running toilets, leaky faucets, clogs & more. Same-day service. Licensed plumbers. Call (512) 368-9159!',
    h1: 'Toilet & Faucet Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Toilet & Faucet Services</h1><p class="text-xl mb-8">Professional toilet and faucet repair, replacement, and installation services.</p></div></div>`
  },
  {
    path: '/gas-services',
    title: 'Gas Line Services & Leak Detection | Economy Plumbing',
    description: 'Professional gas line installation, repair & leak detection in Austin & Marble Falls, TX. 24/7 emergency gas service. Licensed & certified. Call (512) 368-9159 NOW!',
    h1: 'Gas Line Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Gas Line Services & Leak Detection</h1><p class="text-xl mb-8">Expert gas line installation, repair, and emergency leak detection services.</p></div></div>`
  },
  {
    path: '/backflow',
    title: 'Backflow Testing & Prevention | Economy Plumbing',
    description: 'Certified backflow testing & prevention services in Austin & Marble Falls, TX. Annual testing, repairs & installations. Licensed testers. Call (512) 368-9159 to schedule!',
    h1: 'Backflow Testing',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Backflow Testing & Prevention</h1><p class="text-xl mb-8">Certified backflow testing and prevention services to protect your water supply.</p></div></div>`
  },
  {
    path: '/commercial-plumbing',
    title: 'Commercial Plumbing Services | Economy Plumbing',
    description: 'Professional commercial plumbing in Austin & Marble Falls, TX. Restaurants, offices, retail. Installations, repairs, maintenance. Licensed & insured. Call (512) 368-9159!',
    h1: 'Commercial Plumbing Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Commercial Plumbing Services</h1><p class="text-xl mb-8">Professional plumbing solutions for businesses, restaurants, and commercial properties.</p></div></div>`
  },
  {
    path: '/contact',
    title: 'Contact Us | Economy Plumbing Services',
    description: 'Contact Economy Plumbing for service in Austin & Marble Falls, TX. Schedule online or call (512) 368-9159. Same-day appointments available. Licensed & insured plumbers!',
    h1: 'Contact Us',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Contact Economy Plumbing</h1><p class="text-xl mb-8">Get in touch for professional plumbing services across Central Texas.</p><p class="text-2xl font-bold mb-4">Call us: <a href="tel:5123689159" class="text-primary">(512) 368-9159</a></p></div></div>`
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions | Economy Plumbing',
    description: 'Plumbing FAQs answered by Economy Plumbing experts in Austin & Marble Falls, TX. Service areas, pricing, emergencies & more. Questions? Call (512) 368-9159 anytime!',
    h1: 'Frequently Asked Questions',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Frequently Asked Questions</h1><p class="text-xl mb-8">Find answers to common plumbing questions from our expert team.</p></div></div>`
  },
  {
    path: '/success-stories',
    title: 'Customer Success Stories | Economy Plumbing',
    description: 'Real customer success stories from Economy Plumbing in Austin & Marble Falls, TX. See before/after photos & testimonials. Trusted by thousands. Call (512) 368-9159!',
    h1: 'Customer Success Stories',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Customer Success Stories</h1><p class="text-xl mb-8">See real results from our satisfied customers across Central Texas.</p></div></div>`
  },
  {
    path: '/services',
    title: 'Our Plumbing Services | Economy Plumbing',
    description: 'Complete plumbing services in Austin & Marble Falls, TX. Residential & commercial. Water heaters, drains, leaks, emergency repairs. Licensed pros. Call (512) 368-9159!',
    h1: 'Our Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Our Plumbing Services</h1><p class="text-xl mb-8">Comprehensive plumbing services for residential and commercial properties.</p></div></div>`
  },
  {
    path: '/membership-benefits',
    title: 'VIP Membership Benefits | Economy Plumbing',
    description: 'Join Economy Plumbing VIP! Priority service, discounts, free annual inspections in Austin & Marble Falls, TX. Save money & stress. Call (512) 368-9159 to enroll today!',
    h1: 'VIP Membership Benefits',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">VIP Membership Benefits</h1><p class="text-xl mb-8">Join our VIP program for priority service, exclusive discounts, and peace of mind.</p></div></div>`
  },
  
  // Additional service pages
  {
    path: '/backflow-testing',
    title: 'Backflow Testing & Prevention | Economy Plumbing',
    description: 'Certified backflow testing in Austin & Marble Falls, TX. Annual inspections, repairs & installations. Protect your water supply. Licensed testers. Call (512) 368-9159!',
    h1: 'Backflow Testing Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Backflow Testing Services</h1><p class="text-xl mb-8">Certified backflow prevention testing and installations.</p></div></div>`
  },
  {
    path: '/drainage-solutions',
    title: 'Drainage Solutions | Economy Plumbing',
    description: 'Professional drainage solutions in Austin & Marble Falls, TX. Fix standing water, French drains, yard drainage. Licensed plumbers. Same-day service. Call (512) 368-9159!',
    h1: 'Drainage Solutions',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Drainage Solutions</h1><p class="text-xl mb-8">Expert drainage solutions for residential and commercial properties.</p></div></div>`
  },
  {
    path: '/drain-cleaning-services',
    title: 'Drain Cleaning Services | Economy Plumbing',
    description: 'Professional drain cleaning in Austin & Marble Falls, TX. Clear clogs, hydro jetting, rooter service. 24/7 emergency service. Licensed plumbers. Call (512) 368-9159!',
    h1: 'Drain Cleaning Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Drain Cleaning Services</h1><p class="text-xl mb-8">Professional drain cleaning for homes and businesses.</p></div></div>`
  },
  {
    path: '/faucet-installation',
    title: 'Faucet Installation & Repair | Economy Plumbing',
    description: 'Expert faucet installation & repair in Austin & Marble Falls, TX. Fix leaks, upgrade fixtures. Kitchen & bathroom faucets. Licensed plumbers. Call (512) 368-9159!',
    h1: 'Faucet Installation & Repair',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Faucet Installation & Repair</h1><p class="text-xl mb-8">Professional faucet installation and repair services.</p></div></div>`
  },
  {
    path: '/garbage-disposal-repair',
    title: 'Garbage Disposal Repair | Economy Plumbing',
    description: 'Garbage disposal repair & installation in Austin & Marble Falls, TX. Fix jams, leaks, noises. Same-day service available. Licensed plumbers. Call (512) 368-9159!',
    h1: 'Garbage Disposal Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Garbage Disposal Services</h1><p class="text-xl mb-8">Expert garbage disposal repair and installation.</p></div></div>`
  },
  {
    path: '/gas-leak-detection',
    title: 'Gas Leak Detection | Economy Plumbing',
    description: 'Emergency gas leak detection in Austin & Marble Falls, TX. 24/7 service. Licensed & certified technicians. Your safety first. Call (512) 368-9159 immediately!',
    h1: 'Gas Leak Detection',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Gas Leak Detection</h1><p class="text-xl mb-8">Emergency gas leak detection and repair services.</p></div></div>`
  },
  {
    path: '/gas-line-services',
    title: 'Gas Line Services | Economy Plumbing',
    description: 'Professional gas line installation & repair in Austin & Marble Falls, TX. New lines, repairs, inspections. Licensed & certified. 24/7 service. Call (512) 368-9159!',
    h1: 'Gas Line Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Gas Line Services</h1><p class="text-xl mb-8">Expert gas line installation, repair, and inspection.</p></div></div>`
  },
  {
    path: '/hydro-jetting-services',
    title: 'Hydro Jetting Services | Economy Plumbing',
    description: 'Professional hydro jetting in Austin & Marble Falls, TX. Clear tough clogs, clean pipes, remove roots. High-pressure water jetting. Licensed. Call (512) 368-9159!',
    h1: 'Hydro Jetting Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Hydro Jetting Services</h1><p class="text-xl mb-8">High-pressure hydro jetting for stubborn clogs and buildup.</p></div></div>`
  },
  {
    path: '/rooter-services',
    title: 'Rooter Services | Economy Plumbing',
    description: 'Professional rooter services in Austin & Marble Falls, TX. Clear tree roots, tough clogs. Camera inspections available. Licensed plumbers. Call (512) 368-9159 today!',
    h1: 'Rooter Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Rooter Services</h1><p class="text-xl mb-8">Expert rooter services to clear drains and sewer lines.</p></div></div>`
  },
  {
    path: '/sewage-pump-services',
    title: 'Sewage Pump Services | Economy Plumbing',
    description: 'Sewage pump installation & repair in Austin & Marble Falls, TX. Sump pumps, ejector pumps, maintenance. 24/7 emergency service. Licensed. Call (512) 368-9159!',
    h1: 'Sewage Pump Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Sewage Pump Services</h1><p class="text-xl mb-8">Professional sewage pump installation, repair, and maintenance.</p></div></div>`
  },
  {
    path: '/water-heater-guide',
    title: 'Water Heater Buying Guide | Economy Plumbing',
    description: 'Water heater buying guide from Economy Plumbing experts in Austin & Marble Falls, TX. Tank vs tankless, sizing, efficiency tips. Need help? Call (512) 368-9159!',
    h1: 'Water Heater Buying Guide',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Water Heater Buying Guide</h1><p class="text-xl mb-8">Expert guidance on choosing the right water heater for your home.</p></div></div>`
  },
  {
    path: '/water-leak-repair',
    title: 'Water Leak Repair | Economy Plumbing',
    description: 'Emergency water leak repair in Austin & Marble Falls, TX. Slab leaks, pipe leaks, fixture leaks. 24/7 service. Licensed & insured plumbers. Call (512) 368-9159!',
    h1: 'Water Leak Repair',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Water Leak Repair</h1><p class="text-xl mb-8">Fast, professional water leak detection and repair.</p></div></div>`
  },
  {
    path: '/water-pressure-solutions',
    title: 'Water Pressure Solutions | Economy Plumbing',
    description: 'Fix low water pressure in Austin & Marble Falls, TX. Diagnose & repair pressure issues. Pressure regulators, pump services. Licensed plumbers. Call (512) 368-9159!',
    h1: 'Water Pressure Solutions',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Water Pressure Solutions</h1><p class="text-xl mb-8">Professional solutions for water pressure problems.</p></div></div>`
  },
  {
    path: '/permit-resolution-services',
    title: 'Permit Resolution Services | Economy Plumbing',
    description: 'Plumbing permit help in Austin & Marble Falls, TX. Code violations, inspections, permit applications. Licensed contractors. We handle it all. Call (512) 368-9159!',
    h1: 'Permit Resolution Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Permit Resolution Services</h1><p class="text-xl mb-8">Expert assistance with plumbing permits and code compliance.</p></div></div>`
  },
  {
    path: '/emergency',
    title: '24/7 Emergency Plumbing | Economy Plumbing',
    description: 'Emergency plumber in Austin & Marble Falls, TX. 24/7 service for burst pipes, gas leaks, water heaters. Fast response. Licensed & insured. Call (512) 368-9159 NOW!',
    h1: '24/7 Emergency Plumbing',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">24/7 Emergency Plumbing</h1><p class="text-xl mb-8">Fast emergency plumbing services available around the clock.</p></div></div>`
  },
  {
    path: '/commercial-services',
    title: 'Commercial Plumbing Services | Economy Plumbing',
    description: 'Commercial plumbing in Austin & Marble Falls, TX. Restaurants, offices, retail spaces. Installations, repairs, maintenance plans. Licensed & insured. Call (512) 368-9159!',
    h1: 'Commercial Plumbing Services',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Commercial Plumbing Services</h1><p class="text-xl mb-8">Comprehensive plumbing solutions for businesses.</p></div></div>`
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | Economy Plumbing Services',
    description: 'Economy Plumbing privacy policy. How we collect, use & protect your information in Austin & Marble Falls, TX. Questions? Call (512) 368-9159 for details.',
    h1: 'Privacy Policy',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Privacy Policy</h1><p class="text-xl mb-8">Our commitment to protecting your privacy and personal information.</p></div></div>`
  },
  {
    path: '/refund_returns',
    title: 'Refund & Returns Policy | Economy Plumbing',
    description: 'Economy Plumbing refund & returns policy for services and products in Austin & Marble Falls, TX. Satisfaction guaranteed. Questions? Call (512) 368-9159.',
    h1: 'Refund & Returns Policy',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Refund & Returns Policy</h1><p class="text-xl mb-8">Information about our refund and returns policies.</p></div></div>`
  },
  {
    path: '/service-area',
    title: 'Service Areas | Economy Plumbing Services',
    description: 'Economy Plumbing serves Austin, Cedar Park, Leander, Round Rock, Marble Falls & Central Texas. Professional plumbers near you. Licensed & insured. Call (512) 368-9159!',
    h1: 'Our Service Areas',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Our Service Areas</h1><p class="text-xl mb-8">We proudly serve Austin, Marble Falls, and all of Central Texas.</p></div></div>`
  },
  
  // Major service area pages
  {
    path: '/plumber-austin',
    title: 'Plumber in Austin, TX | Economy Plumbing Services',
    description: 'Trusted plumber in Austin, TX. Water heaters, drain cleaning, leak repair, emergency plumbing. Same-day service. Licensed & insured. Call (512) 368-9159 today!',
    h1: 'Professional Plumber in Austin, TX',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Professional Plumber in Austin, TX</h1><p class="text-xl mb-8">Economy Plumbing provides expert plumbing services throughout Austin and surrounding areas.</p></div></div>`
  },
  {
    path: '/plumber-marble-falls',
    title: 'Plumber in Marble Falls, TX | Economy Plumbing',
    description: 'Trusted plumber in Marble Falls, TX. Water heaters, drain cleaning, leak repair, emergency service. Licensed & insured plumbers. Same-day service. Call (512) 368-9159!',
    h1: 'Professional Plumber in Marble Falls, TX',
    content: `<div class="py-16"><div class="container mx-auto px-4"><h1 class="text-4xl font-bold mb-6">Professional Plumber in Marble Falls, TX</h1><p class="text-xl mb-8">Expert plumbing services in Marble Falls and the Hill Country.</p></div></div>`
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
 * Generate SSR config for a blog post on-demand
 */
export async function generateBlogPostSSR(slug: string, storage: any): Promise<SSRPageConfig | null> {
  const post = await storage.getBlogPostBySlug(slug);
  if (!post) {
    return null;
  }
  
  // Use featured image for OG, fallback to logo
  const ogImage = post.featuredImage 
    ? `https://www.plumbersthatcare.com${post.featuredImage.replace('.webp', '.jpg')}`
    : 'https://www.plumbersthatcare.com/attached_assets/logo.jpg';
  
  // Create SEO-optimized excerpt from content
  const excerpt = post.excerpt || post.content
    .replace(/<[^>]*>/g, '') // Strip HTML
    .substring(0, 150)
    .trim() + '...';
  
  return {
    path: `/${slug}`,
    title: post.metaTitle || `${post.title} | Economy Plumbing`,
    description: post.metaDescription || excerpt,
    h1: post.title,
    ogImage,
    content: `
      <article class="py-16">
        <div class="container mx-auto px-4">
          <div class="max-w-4xl mx-auto">
            ${post.featuredImage ? `
              <img 
                src="${post.featuredImage}" 
                alt="${post.title}"
                class="w-full h-auto rounded-lg mb-8"
              />
            ` : ''}
            <h1 class="text-4xl font-bold mb-4">${post.title}</h1>
            <div class="flex items-center gap-4 text-muted-foreground mb-8">
              <span>${post.category}</span>
              <span>•</span>
              <span>${new Date(post.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div class="prose prose-lg max-w-none">
              ${post.content}
            </div>
          </div>
        </div>
      </article>
    `
  };
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
  phoneNumber?: string,
  pageConfig?: SSRPageConfig // Allow passing in dynamically generated config
): string | null {
  // Use provided config or find in static configs
  const config = pageConfig || ssrPages.find(p => p.path === path);
  if (!config) {
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
    `<title>${config.title}</title>`
  );
  
  // Replace meta description
  html = html.replace(
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${config.description}" />`
  );
  
  // Add canonical URL
  const canonical = `https://www.plumbersthatcare.com${config.path}`;
  if (!html.includes('<link rel="canonical"')) {
    html = html.replace(
      '</head>',
      `  <link rel="canonical" href="${canonical}" />\n  </head>`
    );
  }
  
  // Add OpenGraph tags
  const ogImage = config.ogImage || 'https://www.plumbersthatcare.com/attached_assets/logo.jpg';
  const ogTags = `
  <!-- OpenGraph for Social Media -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${config.title}" />
  <meta property="og:description" content="${config.description}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:site_name" content="Economy Plumbing Services" />`;
  
  html = html.replace('</head>', `${ogTags}\n  </head>`);
  
  // Inject basic content into body for crawlers
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${config.content}</div>`
  );
  
  return html;
}
