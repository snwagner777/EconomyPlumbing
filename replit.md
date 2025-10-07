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
- Primary brand color: Teal/Turquoise (HSL 186 85% 45%) representing water theme
- Typography: Inter for body/headings, Poppins for accent/numbers
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
- Service pages: water heater, drain cleaning, leak repair, toilet/faucet, gas, backflow, commercial, emergency
- Service area pages: Austin metro (9 cities) and Marble Falls area (7 cities)
- Blog listing and individual post pages
- Store with product/membership listings
- Checkout flow (Stripe integration prepared)
- About page

**Route Patterns:**
- `/` - Home
- `/{service-name}` - Service detail pages
- `/service-area` - Service area overview page (exact replica of plumbersthatcare.com/service-area)
- `/{city-plumber-url}` - Location-specific pages (e.g., /plumber-austin, /round-rock-plumber)
- `/blog` - Blog listing
- `/blog/:slug` - Individual posts
- `/store` - Product catalog
- `/checkout/:slug` - Checkout page
- `/about` - About company

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
- Integration guide provided in `SERVICETITAN_INTEGRATION.md`
- Placeholder buttons throughout site ready for embed code
- SchedulerModal component built for service type selection (plumbing/water treatment/irrigation)

**Call Tracking Services:**
- Documentation for CallRail, CallTrackingMetrics, and DialogTech in `DYNAMIC_PHONE_TRACKING.md`
- Static phone numbers currently displayed:
  - Austin: (512) 649-2811
  - Marble Falls: (830) 460-3565
- Dynamic insertion ready for implementation

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