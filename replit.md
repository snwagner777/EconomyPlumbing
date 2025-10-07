# Economy Plumbing Services - Project Documentation

## Overview

Economy Plumbing Services is a full-stack web application for a professional plumbing business serving the Austin and Marble Falls, Texas areas. The website provides comprehensive information about plumbing services, service areas, blog content, and an online store for maintenance memberships. Built with React, TypeScript, and Express, the application emphasizes local SEO, user engagement, and conversion optimization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- Shadcn UI component library with "new-york" style variant
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for component variant management

**Design System:**
- Primary brand color: Blue #1E88E5 (HSL 208 81% 51%) for buttons and CTAs
- Secondary color: Teal #3BA7A6 (HSL 179 48% 44%) for accents
- Charcoal text: #111827 (HSL 220 39% 11%)
- Silver accents: #B0BEC5 (HSL 200 14% 73%)
- Typography: Inter for body/headings, Poppins for accent/numbers
- Button styling: Fully rounded (pill-shaped) with blue background and white text
- Comprehensive light/dark mode support with CSS custom properties
- Professional, trustworthy aesthetic targeting emergency service customers

**Page Structure:**
- Component-based architecture with reusable UI components
- Service-specific pages using shared `ServicePage` template
- Location-specific pages using shared `ServiceAreaPage` template
- SEO optimization with React Helmet for meta tags and JSON-LD structured data

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- RESTful API design pattern
- In-development Vite middleware integration for HMR

**Data Layer:**
- Drizzle ORM configured for PostgreSQL
- Schema-first approach with TypeScript type generation
- Current implementation uses in-memory storage (`MemStorage` class) with planned database migration
- Seed data for blog posts and products included

**API Endpoints:**
- `GET /api/blog` - List all blog posts
- `GET /api/blog/:slug` - Get single blog post
- `GET /api/products` - List all products/memberships
- `GET /api/products/:slug` - Get single product
- `POST /api/contact` - Submit contact form with validation

**Data Models:**
- Users (authentication ready)
- Blog Posts (title, slug, content, category, SEO fields)
- Products (name, description, price, Stripe integration fields)
- Contact Submissions (customer inquiries with service/location details)

### State Management

**Client-Side:**
- TanStack Query for server state caching and synchronization
- React hooks (useState, useEffect) for local component state
- Custom hooks for shared logic (useToast, useIsMobile)

**Form Handling:**
- React Hook Form with Zod validation via @hookform/resolvers
- Drizzle-Zod integration for consistent schema validation
- Client and server-side validation

### Routing Architecture

**Client-Side Routes:**
- Home page with hero, services overview, testimonials
- Service pages: 20+ service-specific pages using shared `ServicePage` template
- Service area pages: Austin metro (9 cities) and Marble Falls area (7 cities)
- Blog listing and individual post pages
- Store with product/membership listings
- Checkout flow (Stripe integration prepared)
- About, Contact, FAQ, Privacy Policy, Refund/Returns pages
- VIP Membership benefits page

**Main Service Pages:**
- `/water-heater-services` - Water heater installation, repair, tankless
- `/drain-cleaning` - Professional drain cleaning services
- `/leak-repair` - Water leak detection and repair
- `/toilet-faucet` - Toilet and faucet installation/repair
- `/gas-services` - Gas line installation and repair
- `/backflow` - Backflow prevention services
- `/commercial-plumbing` - Commercial plumbing services

**Additional Service Pages:**
- `/backflow-testing` - Annual backflow testing & certification
- `/drainage-solutions` - French drains, yard drainage, sump pumps
- `/faucet-installation` - Kitchen & bath faucet services
- `/garbage-disposal-repair` - Disposal installation & repair
- `/gas-leak-detection` - Emergency gas leak detection
- `/hydro-jetting-services` - High-pressure drain cleaning
- `/permit-resolution-services` - Code compliance & permits
- `/rooter-services` - Sewer & drain rooter cleaning
- `/sewage-pump-services` - Sump & sewage pump installation
- `/water-pressure-solutions` - Water pressure diagnosis & repair
- `/water-heater-guide` - Water heater buying guide
- `/services` - Complete services overview page

**Service Area Routes:**
- `/service-area` - Service area overview page
- Austin Metro: `/plumber-austin`, `/plumber-in-cedar-park--tx`, `/plumber-leander`, `/plumber-in-leander--tx524c3ae3`, `/round-rock-plumber`, `/plumber-georgetown`, `/plumber-pflugerville`, `/plumber-liberty-hill`, `/plumber-buda`, `/plumber-kyle`
- Marble Falls Area: `/plumber-marble-falls`, `/plumber-burnet`, `/plumber-horseshoe-bay`, `/plumber-kingsland`, `/plumber-granite-shoals`, `/plumber-bertram`, `/plumber-spicewood`

**Utility Pages:**
- `/contact` - Contact form and office locations
- `/faq` - Frequently asked questions
- `/privacy-policy` - Privacy policy
- `/refund_returns` - Refund and returns policy
- `/membership-benefits` - VIP membership benefits
- `/about` - About the company

**Blog & Store:**
- `/blog` - Blog listing page
- `/blog/:slug` - Individual blog posts
- `/store` - Product catalog and VIP memberships
- `/shop` - Alias to store
- `/store/checkout/:slug` - Checkout page
- `/category/memberships` - Membership category
- `/category/products` - Products category
- `/signin` - Redirects to store

## External Dependencies

### Payment Processing
- **Stripe:** Payment processing integration configured
  - `@stripe/stripe-js` and `@stripe/react-stripe-js` for frontend
  - Product and price IDs stored in database schema
  - Checkout flow implementation ready for Stripe publishable key

### Database
- **Neon (PostgreSQL):** Configured via `@neondatabase/serverless`
  - Connection string expected in `DATABASE_URL` environment variable
  - Drizzle migration system configured in `drizzle.config.ts`
  - Schema defined in `shared/schema.ts`

### Third-Party Service Integration Points

**ServiceTitan (Online Scheduler):**
- ✅ LIVE - Fully integrated with tenant ID: 3ce4a586-8427-4716-9ac6-46cb8bf7ac4f
- All schedule buttons use: `window.STWidgetManager("ws-open")`
- Working across all pages (service pages, location pages, headers)

**Email Integration (Resend):**
- ✅ LIVE - Resend connector configured for transactional emails
- Contact forms throughout site send to: cdd5d54b6e6c4413@teamchat.zoom.us (Zoom Team Chat)
- Forms include page context for tracking (e.g., "Water Heater Services - Service Page")
- Email utility: `server/email.ts`
- Contact forms on:
  - All service pages (via ServicePage template)
  - All service area pages (via ServiceAreaPage template)
  - Contact page
  - Includes name, phone, email, service type, location, urgency, message

**Call Tracking Services:**
- ✅ LIVE - Dynamic phone number insertion with 90-day cookie tracking
  - Implementation: `client/src/lib/dynamicPhoneNumbers.ts`
  - Detects traffic source from URL parameters (utm_source, fbclid) and referrers
  - Default (no source): (512) 649-2811
  - Facebook/Instagram: (512) 575-3157
  - Yelp: (512) 893-7316
  - Nextdoor: (512) 846-9146
  - Replaces both displayed phone text and tel: links site-wide
  - Legacy numbers from original site: Austin (512) 368-9159, Marble Falls (830) 460-3565

### SEO & Analytics
- JSON-LD structured data for local business schema
- React Helmet for dynamic meta tags
- OpenGraph tags configured
- Sitemap placeholder in `public/robots.txt`

### Development Tools
- **Replit Plugins:** Cartographer and dev banner for development environment
- **TypeScript:** Strict mode enabled with path aliases (@/, @shared/, @assets/)
- **ESBuild:** Server bundling for production
- **PostCSS & Autoprefixer:** CSS processing pipeline

### UI Libraries
- **Radix UI:** 20+ primitive components for accessibility
- **Lucide React:** Icon library
- **date-fns:** Date formatting and manipulation
- **cmdk:** Command menu component
- **class-variance-authority & clsx:** Utility for conditional class names

### Session Management
- **connect-pg-simple:** PostgreSQL session store (configured, not yet active)
- Sessions ready for implementation with user authentication