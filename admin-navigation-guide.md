# Economy Plumbing Services - Admin Panel Navigation Guide

## Overview
The admin panel consists of 15 sections organized across multiple navigation patterns:
- **Unified Dashboard Navigation**: State-based tab navigation within UnifiedAdminDashboard
- **Separate Route Navigation**: Dedicated routes with full-page components
- **Hybrid Navigation**: Combination of both patterns for complex workflows

## Authentication
- **Required**: OAuth authentication (Google-based) is MANDATORY for all admin routes
- **Login Route**: `/admin/oauth-login`
- **Redirect**: All admin routes redirect unauthenticated users to OAuth login

---

## Navigation Structure

### 1. Unified Admin Dashboard (`/admin`)
**Component**: `UnifiedAdminDashboard.tsx`
**Navigation Pattern**: Tab-based state navigation

#### Sections (10 tabs):
1. **Dashboard** - Overview metrics, quick stats
2. **Blog Posts** - Content management, AI generation
3. **FAQ Management** - Q&A content editor
4. **Success Stories** - Customer testimonial management
5. **Referrals** - Referral program tracking
6. **Tracking Numbers** - ServiceTitan call tracking
7. **Commercial Customers** - B2B customer management
8. **Page Metadata** - SEO meta tags editor
9. **Products** - Product catalog management
10. **Unsubscribe Requests** - Email opt-out management

**Characteristics**:
- Single component with tabbed interface
- State-based navigation (no route changes)
- Fast tab switching
- Shared header/navigation context
- All sections share authentication state

---

### 2. Separate Route Pages
**Navigation Pattern**: Dedicated routes with full URLs

#### Marketing & Engagement Routes:
1. **SMS Marketing** - `/admin/sms-marketing`
   - Component: `SMSMarketingAdmin.tsx`
   - Features: Campaign management, segment targeting, AI message generation
   - Key Functions: Send SMS, track delivery, manage opt-outs

2. **Marketing Overview** - `/admin/marketing-overview`
   - Component: `MarketingOverview.tsx`
   - Features: Cross-channel analytics, attribution tracking
   - Integrations: Email + SMS unified metrics

3. **Email Campaigns** - Accessible via Marketing Overview
   - Component: `EmailCampaignsAdmin.tsx`
   - Features: Campaign creation, approval workflow, tracking numbers
   - New Feature: Expandable campaign details showing full email sequence
     - Subject lines
     - Preheader text
     - HTML content
     - Plain text content
     - Engagement metrics (sent, opened, clicked)

#### Customer Management Routes:
4. **Reviews** - `/admin/reviews`
   - Component: `ReviewsAdmin.tsx`
   - Features: Review campaign management, response tracking
   - Key Functions: Send review requests, monitor responses

---

## Navigation Map

```
/admin (OAuth Login Required)
│
├─ /admin/oauth-login ..................... OAuth Login Page
│
├─ /admin ................................. Unified Dashboard (default)
│  ├─ Tab: Dashboard ...................... Overview & Metrics
│  ├─ Tab: Blog Posts ..................... Content Management
│  ├─ Tab: FAQ Management ................. Q&A Editor
│  ├─ Tab: Success Stories ................ Testimonials
│  ├─ Tab: Referrals ...................... Referral Tracking
│  ├─ Tab: Tracking Numbers ............... Call Tracking
│  ├─ Tab: Commercial Customers ........... B2B Management
│  ├─ Tab: Page Metadata .................. SEO Editor
│  ├─ Tab: Products ....................... Catalog Management
│  └─ Tab: Unsubscribe Requests ........... Opt-out Management
│
├─ /admin/sms-marketing ................... SMS Campaign Manager
├─ /admin/marketing-overview .............. Marketing Analytics Hub
│  └─ Nested: Email Campaigns ............. Campaign Details View
├─ /admin/reviews ......................... Review Campaign Manager
│
├─ /admin/success-stories ................. Direct Route (legacy)
├─ /admin/tracking-numbers ................ Direct Route (legacy)
├─ /admin/commercial-customers ............ Direct Route (legacy)
├─ /admin/page-metadata ................... Direct Route (legacy)
└─ /admin/products ........................ Direct Route (legacy)
```

---

## Key Features by Section

### SMS Marketing (`/admin/sms-marketing`)
- AI-powered message generation (GPT-4o-mini)
- Customer segmentation (membership status, service history)
- TCPA-compliant opt-in/opt-out management
- Real-time delivery tracking (Twilio integration)
- Campaign scheduling and automation
- Template library with dynamic variables
- Analytics: delivery rate, engagement, conversions

### Marketing Overview (`/admin/marketing-overview`)
- Unified email + SMS analytics dashboard
- Attribution tracking across channels
- Campaign performance comparison
- ROI metrics and cost analysis
- ServiceTitan integration for conversion tracking
- Email engagement: opens, clicks, bounces (Resend webhooks)
- SMS engagement: delivery, reads, responses (Twilio webhooks)

### Email Campaigns (via Marketing Overview)
- Campaign creation and approval workflow
- ServiceTitan tracking number integration
- Multi-email drip sequence support
- **NEW**: Expandable campaign detail view
  - View full email sequence
  - Subject lines and preheader text
  - Complete HTML and plain text content
  - Engagement metrics per email
  - AI-generated content indicators
- Campaign status tracking (draft, pending approval, active, completed)
- Segment targeting with member counts

### Reviews (`/admin/reviews`)
- Automated review request campaigns
- Multi-platform review tracking (Google, Yelp, Facebook)
- Response monitoring and alerts
- Review funnel optimization
- Campaign performance analytics
- Customer sentiment analysis

---

## Technical Implementation Notes

### Authentication Flow
1. User visits any `/admin/*` route
2. `requireAdmin` middleware checks authentication
3. If not authenticated → redirect to `/admin/oauth-login`
4. OAuth flow completes → redirect to intended destination
5. Session persisted with PostgreSQL store

### State Management
- **React Query**: All API data fetching with 5-minute stale time
- **Local State**: UI interactions (modals, expansions, filters)
- **Session State**: Authentication status
- **Cache Invalidation**: Automatic on mutations

### API Architecture
- **Backend**: Express.js routes in `server/routes.ts`
- **Database**: PostgreSQL with Drizzle ORM
- **External APIs**:
  - ServiceTitan (customer data, campaigns)
  - Twilio (SMS delivery)
  - Resend (email delivery + webhooks)
  - OpenAI (AI content generation)
  - Google OAuth (authentication)

### Common Workflows

#### Creating an Email Campaign
1. Navigate to Marketing Overview
2. View Email Campaigns section
3. Campaign auto-generated by AI system
4. Admin approves campaign → status: `pending_approval`
5. Admin adds ServiceTitan tracking number → status: `awaiting_phone_number`
6. System syncs to ServiceTitan → status: `ready_to_send`
7. Campaign activates → status: `active`
8. Campaign completes → status: `completed`

#### Sending SMS Campaign
1. Navigate to SMS Marketing (`/admin/sms-marketing`)
2. Select customer segment or individual customers
3. Generate AI message or use template
4. Preview and customize message
5. Schedule or send immediately
6. Monitor delivery and engagement in real-time
7. Track responses and conversions

---

## Chatbot Behavior
- **Public Pages**: AI chatbot visible (GPT-4o-mini powered)
- **Admin Pages**: Chatbot hidden to avoid interference
- **Implementation**: `useLocation` hook checks for `/admin` prefix

---

## Performance Optimizations
- Lazy loading for all admin routes
- React Query caching (5-minute stale time)
- Parallel API requests for bulk operations
- Pagination for large data sets
- Debounced search inputs
- Optimistic UI updates for mutations

---

## Security Features
- OAuth-only authentication (Google)
- Session-based authorization
- CSRF protection
- Rate limiting on API endpoints
- SQL injection prevention (Drizzle ORM)
- XSS protection (input sanitization)
- Secure environment variables

---

## Future Enhancements
- Role-based access control (admin, manager, viewer)
- Advanced analytics dashboards
- Automated A/B testing for campaigns
- Enhanced AI content generation
- Custom report builder
- Mobile-responsive admin interface
- Real-time collaboration features

---

## Troubleshooting

### Common Issues

**Issue**: Bulk operations failing (0 success, X failed)
- **Cause**: Client-side request not reaching server
- **Fix**: Check browser console, verify authentication, clear cache

**Issue**: Campaign emails not displaying
- **Cause**: API endpoint not accessible or data missing
- **Fix**: Verify campaign has emails in database, check API response

**Issue**: Browser shows cached/old data
- **Cause**: Browser cache not cleared after deployment
- **Fix**: Hard refresh (Ctrl+Shift+R) or clear site data

**Issue**: Authentication loop
- **Cause**: Session not persisting
- **Fix**: Check PostgreSQL connection, verify session store configuration

---

## Development Commands

```bash
# Start development server
npm run dev

# Push schema changes to database
npm run db:push

# Force schema push (data loss warning)
npm run db:push --force

# Access database studio
npm run db:studio
```

---

## Related Documentation
- See `replit.md` for overall project architecture
- See `server/lib/serviceTitan.ts` for ServiceTitan integration details
- See `server/lib/ai-campaign-generator.ts` for AI content generation
- See `shared/schema.ts` for complete database schema
