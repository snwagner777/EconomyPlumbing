# Next.js Migration Documentation

## Migration Status

### Completed: Phase 1 - Foundation ✅
- Next.js 15 App Router structure
- TypeScript configuration
- Tailwind CSS + full design system
- 47 shadcn/ui components migrated
- Database connection (Drizzle + Neon)
- Health check API route

### Completed: Phase 2 - Homepage ✅
- Dynamic phone number tracking system
- ServiceTitan scheduler integration
- Header, Hero, Footer components
- Services grid
- Mobile responsive layout

## How to Test the Next.js App

### Running Both Servers

The migration uses a dual-server approach during development:

1. **Express Server** (Port 5000) - Existing backend with all APIs and schedulers
2. **Next.js Server** (Port 3000) - New frontend being built

### Start Testing

```bash
# In terminal 1: Start Express (already running via workflow)
npm run dev

# In terminal 2: Start Next.js dev server
npx next dev -p 3000
```

Then visit:
- **Next.js Homepage**: http://localhost:3000
- **Express (Current Site)**: http://localhost:5000

### API Proxying

Next.js is configured to proxy all `/api/*` requests to Express on port 5000.
This means phone tracking and all API calls work correctly.

## Architecture

```
app/
├── (public)/          # Public marketing pages
│   └── page.tsx       # Homepage ✅
├── (customer)/        # Customer portal (TODO)
├── (admin)/           # Admin dashboard (TODO)
├── api/               # Next.js API routes (TODO)
├── layout.tsx         # Root layout with PhoneConfigProvider
└── globals.css        # Design system

src/
├── components/        # React components
│   ├── ui/           # 47 shadcn components
│   ├── Header.tsx    # Dynamic phone tracking
│   ├── Hero.tsx      # Scheduler integration
│   └── Footer.tsx    # Site footer
├── contexts/
│   └── PhoneConfigProvider.tsx  # Phone tracking system
├── lib/
│   ├── db.ts         # Database connection
│   ├── scheduler.ts  # ServiceTitan integration
│   └── utils.ts      # Utilities
└── hooks/
    ├── use-toast.ts
    └── use-mobile.tsx
```

## Critical Features

### Dynamic Phone Number Tracking
- Fetches tracking numbers from Express API
- Detects traffic source (UTM params, referrer)
- Stores source in cookie for 90 days
- Displays correct phone number in Header and Hero

### ServiceTitan Scheduler
- On-demand script loading
- Opens scheduling modal
- Falls back to phone numbers if unavailable

## Next Steps

### Phase 2: Remaining Public Pages
- Blog listing and individual posts
- Service pages (Water Heater, Drain Cleaning, etc.)
- Service Area pages (Austin, Marble Falls, etc.)
- Static pages (About, Contact, FAQ, Privacy, Terms)
- SEO metadata system
- Sitemap and robots.txt

### Phase 3: API Routes
- Convert 7000+ lines from server/routes.ts
- Organize by feature (blog, reviews, referrals, etc.)
- Maintain exact webhook paths

### Phase 4: Customer Portal
- Phone/email verification
- Job history from ServiceTitan
- Customer dashboard

### Phase 5: Admin Dashboard
- Split 9000-line UnifiedAdminDashboard.tsx
- Domain-based modules (reviews, referrals, marketing, etc.)
- Admin API routes

### Phase 6: Background Workers
- Refactor server/index.ts to spawn Next.js
- Extract schedulers to server/workers/
- Ensure long-running jobs work correctly

### Phase 7: Critical Features
- Google Analytics 4, Meta Pixel, GTM
- Conversion tracking
- Webhook verification

### Phase 8: Testing & Launch
- End-to-end testing
- SEO verification
- 48+ hours scheduler testing
- Final cutover from Vite to Next.js
