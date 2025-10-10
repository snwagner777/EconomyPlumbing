# Marketing & Analytics Tracking Setup

This document explains how to set up and use marketing pixels and analytics platforms for Economy Plumbing Services.

## Supported Platforms

1. **Google Analytics 4 (GA4)** - Website analytics and user behavior tracking
2. **Meta Pixel (Facebook Pixel)** - Facebook/Instagram ad conversion tracking
3. **Google Tag Manager (GTM)** - Centralized tag management
4. **Microsoft Clarity** - Heatmaps and session recording

## Environment Variables

Add these environment variables to enable each platform:

### Google Analytics 4
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Meta Pixel (Facebook Pixel)
```bash
VITE_META_PIXEL_ID=123456789012345
```

### Google Tag Manager
```bash
VITE_GTM_ID=GTM-XXXXXXX
```

### Microsoft Clarity
```bash
VITE_CLARITY_ID=abc123xyz
```

## How It Works

### Automatic Initialization

All marketing pixels are automatically initialized when the app loads. Each platform:
- Checks for its environment variable
- Gracefully skips if the variable is missing (logs a warning)
- Uses `requestIdleCallback` for deferred loading (better performance)
- Prevents duplicate initialization on hot reload

### Performance Optimization

All scripts are loaded using:
1. **Deferred loading** - Scripts load during browser idle time
2. **Duplicate prevention** - Checks prevent double-loading
3. **Async loading** - Non-blocking script execution
4. **No layout shift** - Scripts don't affect page rendering

## Conversion Tracking

### Available Tracking Functions

Import from `@/lib/conversionTracking`:

```typescript
import {
  trackContactFormSubmission,
  trackPhoneClick,
  trackSchedulerOpen,
  trackSuccessStorySubmission,
  trackMembershipPurchase,
  trackAddToCart,
  trackBeginCheckout,
  trackSearch
} from '@/lib/conversionTracking';
```

### Tracking Events

#### 1. Contact Form Submission
Tracks when users submit any contact form:

```typescript
trackContactFormSubmission('emergency_form');
// or
trackContactFormSubmission('general');
```

**Platforms tracked:**
- GA4: `contact_form_submit` event
- Meta Pixel: `Contact` standard event
- GTM: `contact_form_submit` event

#### 2. Phone Click
Tracks when users click phone numbers:

```typescript
trackPhoneClick('5123689159', 'header');
// or
trackPhoneClick('5128469146', 'footer');
```

**Platforms tracked:**
- GA4: `phone_click` event
- Meta Pixel: `Contact` event with phone number
- GTM: `phone_click` event

#### 3. Scheduler Open
Tracks when users open ServiceTitan scheduler:

```typescript
trackSchedulerOpen('hero_button');
// or
trackSchedulerOpen('service_page');
```

**Platforms tracked:**
- GA4: `scheduler_open` event
- Meta Pixel: `Lead` standard event
- GTM: `scheduler_open` event

#### 4. Success Story Submission
Tracks customer success story submissions:

```typescript
trackSuccessStorySubmission();
```

**Platforms tracked:**
- GA4: `success_story_submit` event
- Meta Pixel: `SubmitApplication` event
- GTM: `success_story_submit` event

#### 5. Membership Purchase
Tracks completed membership purchases:

```typescript
trackMembershipPurchase(
  'Annual VIP Membership',
  499.99,
  'txn_abc123'
);
```

**Platforms tracked:**
- GA4: `purchase` event with enhanced ecommerce
- Meta Pixel: `Purchase` standard event
- GTM: `purchase` event with item details

#### 6. Add to Cart
Tracks when users add membership to cart:

```typescript
trackAddToCart('Annual VIP Membership', 499.99);
```

**Platforms tracked:**
- GA4: `add_to_cart` event
- Meta Pixel: `AddToCart` standard event
- GTM: `add_to_cart` event with item details

#### 7. Begin Checkout
Tracks when users start checkout process:

```typescript
trackBeginCheckout('Annual VIP Membership', 499.99);
```

**Platforms tracked:**
- GA4: `begin_checkout` event
- Meta Pixel: `InitiateCheckout` standard event
- GTM: `begin_checkout` event

#### 8. Search
Tracks site search queries:

```typescript
trackSearch('water heater repair');
```

**Platforms tracked:**
- GA4: `search` event
- Meta Pixel: `Search` event
- GTM: `search` event

## Implementation Examples

### Contact Form
```typescript
import { trackContactFormSubmission } from '@/lib/conversionTracking';

const handleSubmit = async (data: FormData) => {
  try {
    await submitContactForm(data);
    trackContactFormSubmission('emergency_form');
    toast.success("Message sent!");
  } catch (error) {
    console.error(error);
  }
};
```

### Phone Number Click
```typescript
import { trackPhoneClick } from '@/lib/conversionTracking';

<a 
  href={`tel:${phoneConfig.telLink}`}
  onClick={() => trackPhoneClick(phoneConfig.rawNumber, 'header')}
>
  {phoneConfig.displayNumber}
</a>
```

### Scheduler Button
```typescript
import { trackSchedulerOpen } from '@/lib/conversionTracking';
import { openScheduler } from '@/lib/scheduler';

<Button 
  onClick={() => {
    trackSchedulerOpen('hero_cta');
    openScheduler();
  }}
>
  Schedule Service
</Button>
```

### Membership Purchase (Stripe Success)
```typescript
import { trackMembershipPurchase } from '@/lib/conversionTracking';

useEffect(() => {
  if (sessionId) {
    // Verify session and get details
    const { membershipType, amount, transactionId } = sessionData;
    trackMembershipPurchase(membershipType, amount, transactionId);
  }
}, [sessionId]);
```

## Standard Events by Platform

### Meta Pixel Standard Events
- `PageView` - Automatic on all pages
- `Contact` - Contact forms, phone clicks
- `Lead` - Scheduler opens
- `ViewContent` - Page views with context
- `AddToCart` - Add membership to cart
- `InitiateCheckout` - Begin checkout
- `Purchase` - Completed purchase
- `Search` - Site search
- `SubmitApplication` - Success story submission

### Google Analytics 4 Events
- `page_view` - Automatic on route change
- `contact_form_submit` - Contact form submissions
- `phone_click` - Phone number clicks
- `scheduler_open` - Scheduler opens
- `success_story_submit` - Success story submissions
- `add_to_cart` - Add to cart
- `begin_checkout` - Begin checkout
- `purchase` - Completed purchase
- `search` - Site search

### Google Tag Manager Events
All events are pushed to `dataLayer` and can be used to trigger GTM tags:

```javascript
window.dataLayer.push({
  event: 'contact_form_submit',
  form_type: 'emergency',
  event_category: 'engagement'
});
```

## Testing

### Check if Pixels are Loaded

Open browser console and check:

```javascript
// Google Analytics
console.log(window.gtag); // Should be a function

// Meta Pixel
console.log(window.fbq); // Should be a function

// Google Tag Manager
console.log(window.dataLayer); // Should be an array

// Microsoft Clarity
console.log(window.clarity); // Should be a function
```

### Browser Extensions for Testing

1. **Meta Pixel Helper** - Chrome extension to verify Meta Pixel events
2. **Google Tag Assistant** - Chrome extension to verify GA4 and GTM
3. **Microsoft Clarity** - Check dashboard for session recordings

### Verify Events in Real-Time

1. **Meta Pixel**: Use Meta Events Manager → Test Events
2. **Google Analytics**: Use GA4 → Reports → Realtime
3. **GTM**: Use Preview mode to test tags
4. **Clarity**: Check dashboard for heatmaps and recordings

## Best Practices

1. **Always track key conversions**: Form submissions, phone clicks, scheduler opens
2. **Use descriptive event names**: Include context (e.g., 'hero_cta', 'service_page')
3. **Track the funnel**: AddToCart → BeginCheckout → Purchase
4. **Test in incognito**: Avoid interference from browser extensions
5. **Monitor console warnings**: Missing pixel IDs will log warnings

## Privacy & Compliance

- All tracking respects user privacy settings
- Cookie banner controls analytics consent (already implemented)
- No PII (Personally Identifiable Information) is tracked
- Users can opt-out via cookie preferences

## Troubleshooting

### Pixel not loading
1. Check environment variable is set
2. Check browser console for errors
3. Verify no ad blockers are active
4. Check Network tab for blocked requests

### Events not tracking
1. Verify pixel is loaded: `console.log(window.fbq)`
2. Check function is called: Add console.log before tracking
3. Use browser extension to verify events
4. Check platform dashboards (may have delay)

### Duplicate events
1. Check for duplicate tracking calls
2. Verify initialization only happens once
3. Check for hot reload issues in development

## Future Enhancements

- [ ] Add video tracking when video content is added
- [ ] Track blog engagement (time on page, scroll depth)
- [ ] A/B testing integration
- [ ] Enhanced ecommerce for multiple products
- [ ] Call tracking integration (CallRail)
