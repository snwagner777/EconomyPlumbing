# Dynamic Phone Number Tracking Implementation Guide

This document explains how to implement dynamic phone number insertion for tracking different marketing channels and campaigns.

## Overview

Dynamic phone tracking allows you to display different phone numbers based on the marketing channel, campaign, or geographic location of the visitor. This enables precise ROI tracking for your marketing efforts.

## Current Phone Numbers

The website currently displays these static phone numbers:
- **Austin Area**: (512) 368-9159
- **Marble Falls Area**: (830) 460-3565

## Popular Phone Tracking Services

### Option 1: CallRail (Recommended)
- **Website**: https://www.callrail.com
- **Best for**: Comprehensive call tracking and analytics
- **Pricing**: Starting at $45/month

### Option 2: CallTrackingMetrics
- **Website**: https://www.calltrackingmetrics.com  
- **Best for**: Advanced attribution and multi-channel tracking
- **Pricing**: Starting at $99/month

### Option 3: DialogTech (Marchex)
- **Website**: https://www.marchex.com
- **Best for**: Enterprise-level tracking
- **Pricing**: Custom pricing

## Implementation Methods

### Method 1: JavaScript-Based Dynamic Insertion (CallRail Example)

#### Step 1: Add CallRail Script to Your Site

Add this script to `index.html` before the closing `</body>` tag:

```html
<script>
  (function(){
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'https://cdn.callrail.com/companies/YOUR_COMPANY_ID/tracker.js';
    var x = document.getElementsByTagName('script')[0];
    x.parentNode.insertBefore(s, x);
  })();
</script>
```

#### Step 2: Add Swap Targets to Phone Numbers

Update phone number elements with the `data-swap` attribute:

**Before:**
```tsx
<a href="tel:5123689159">
  (512) 368-9159
</a>
```

**After:**
```tsx
<a 
  href="tel:5123689159" 
  className="callrail-phone-number"
  data-swap="YOUR_CALLRAIL_TARGET_ID"
>
  (512) 368-9159
</a>
```

#### Step 3: Update All Phone Number Instances

Files that need updating:
1. `client/src/components/Header.tsx` - Both Austin and Marble Falls numbers
2. `client/src/components/Footer.tsx` - Footer contact numbers
3. `client/src/components/Hero.tsx` - Hero CTA phone number
4. `client/src/components/ContactForm.tsx` - Contact section numbers
5. `client/src/pages/About.tsx` - About page numbers
6. All service pages - Service-specific CTAs

Example implementation in Header:

```tsx
// client/src/components/Header.tsx
<a 
  href="tel:5123689159" 
  className="flex items-center gap-2 text-primary font-poppins font-bold text-lg hover-elevate px-2 py-1 rounded-md callrail-phone-number"
  data-swap="austin-target-id"
  data-testid="link-phone-austin"
>
  <Phone className="w-5 h-5" />
  (512) 368-9159
</a>
```

### Method 2: Server-Side Dynamic Numbers (Advanced)

For more control, implement server-side logic to determine which number to display:

#### Step 1: Create Phone Number Service

```typescript
// server/services/phoneTracking.ts
interface PhoneConfig {
  channel?: string;
  campaign?: string;
  location?: string;
}

export class PhoneTrackingService {
  private trackingNumbers = {
    'google-ads-austin': '+15126492899',
    'google-ads-marble-falls': '+18304603599',
    'facebook-austin': '+15126492888',
    'facebook-marble-falls': '+18304603588',
    'organic-austin': '+15123689159',
    'organic-marble-falls': '+18304603565'
  };

  getPhoneNumber(config: PhoneConfig): string {
    const key = `${config.channel}-${config.location}`.toLowerCase();
    return this.trackingNumbers[key] || this.trackingNumbers['organic-austin'];
  }
}
```

#### Step 2: Create API Endpoint

```typescript
// server/routes.ts
import { PhoneTrackingService } from './services/phoneTracking';

app.get("/api/tracking-phone", (req, res) => {
  const channel = req.query.channel as string || 'organic';
  const location = req.query.location as string || 'austin';
  
  const phoneService = new PhoneTrackingService();
  const phoneNumber = phoneService.getPhoneNumber({ channel, location });
  
  res.json({ phoneNumber });
});
```

#### Step 3: Create Frontend Hook

```tsx
// client/src/hooks/useTrackingPhone.ts
import { useQuery } from '@tanstack/react-query';

export function useTrackingPhone(location: 'austin' | 'marble-falls' = 'austin') {
  // Detect marketing channel from URL params
  const params = new URLSearchParams(window.location.search);
  const channel = params.get('utm_source') || 'organic';
  
  return useQuery({
    queryKey: ['/api/tracking-phone', { channel, location }],
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
```

#### Step 4: Use in Components

```tsx
// client/src/components/Header.tsx
import { useTrackingPhone } from '@/hooks/useTrackingPhone';

export default function Header({ onScheduleClick }: HeaderProps) {
  const { data: phoneData } = useTrackingPhone('austin');
  const displayNumber = phoneData?.phoneNumber || '(512) 368-9159';
  
  return (
    <a 
      href={`tel:${displayNumber.replace(/\D/g, '')}`} 
      className="flex items-center gap-2 text-primary font-poppins font-bold text-lg"
    >
      <Phone className="w-5 h-5" />
      {displayNumber}
    </a>
  );
}
```

## Tracking by Marketing Channel

### UTM Parameter Tracking

Configure different numbers based on UTM parameters:

**Google Ads Campaign:**
```
https://economyplumbingservices.com/?utm_source=google&utm_medium=cpc&utm_campaign=water-heater
→ Shows: (512) 649-2899 (Google Ads tracking number)
```

**Facebook Ads Campaign:**
```
https://economyplumbingservices.com/?utm_source=facebook&utm_medium=paid&utm_campaign=summer-special
→ Shows: (512) 649-2888 (Facebook tracking number)
```

**Organic Traffic:**
```
https://economyplumbingservices.com/
→ Shows: (512) 368-9159 (Main business number)
```

### Geographic Tracking

Display numbers based on visitor location (requires IP geolocation):

```typescript
export function getPhoneByLocation(userLocation: string): string {
  const locationMap = {
    'austin': '(512) 368-9159',
    'cedar-park': '(512) 368-9159',
    'marble-falls': '(830) 460-3565',
    'burnet': '(830) 460-3565',
    // ... other locations
  };
  
  return locationMap[userLocation.toLowerCase()] || '(512) 368-9159';
}
```

## Analytics Integration

### Google Analytics Event Tracking

Track when users click phone numbers:

```tsx
const handlePhoneClick = (phoneNumber: string, channel: string) => {
  // Google Analytics 4
  gtag('event', 'phone_click', {
    'event_category': 'Contact',
    'event_label': channel,
    'phone_number': phoneNumber,
    'value': 1
  });
};

<a 
  href="tel:5123689159"
  onClick={() => handlePhoneClick('512-368-9159', 'header-click')}
>
  (512) 368-9159
</a>
```

### CallRail Analytics Integration

CallRail automatically integrates with:
- Google Analytics
- Google Ads
- Facebook Ads
- Salesforce
- HubSpot

## Best Practices

### 1. Pool Size Planning

**Minimum Recommended Pool Sizes:**
- Google Ads: 10-20 numbers per campaign
- Facebook Ads: 5-10 numbers per campaign  
- Organic/Direct: 2-3 numbers
- Email Campaigns: 3-5 numbers per campaign

### 2. Number Rotation

Configure numbers to rotate to prevent pool depletion:
- **Session-based**: Same number for entire user session
- **Time-based**: Number persists for X minutes/hours
- **Visitor-based**: Same number for returning visitors

### 3. Fallback Strategy

Always have fallback numbers if tracking fails:

```tsx
const phoneNumber = trackingNumber || defaultNumber;
```

### 4. Mobile Considerations

Ensure `tel:` links work properly:

```tsx
<a href={`tel:${phoneNumber.replace(/\D/g, '')}`}>
  {formatPhoneNumber(phoneNumber)}
</a>
```

## Testing Your Implementation

### Test Checklist

- [ ] Numbers display correctly on all pages
- [ ] Different numbers show for different UTM sources
- [ ] Click-to-call works on mobile devices
- [ ] Analytics events fire on phone clicks
- [ ] Fallback numbers display if tracking fails
- [ ] Numbers match your tracking service dashboard

### Test URLs

```bash
# Google Ads test
https://economyplumbingservices.com/?utm_source=google&utm_medium=cpc

# Facebook Ads test  
https://economyplumbingservices.com/?utm_source=facebook&utm_medium=paid

# Organic test
https://economyplumbingservices.com/
```

## CallRail Setup Guide

### Step 1: Create CallRail Account
1. Sign up at https://www.callrail.com
2. Choose your plan (start with $45/month plan)
3. Purchase tracking numbers for your campaigns

### Step 2: Configure Number Pools
1. Go to Numbers → Number Pools
2. Create pools for each marketing channel:
   - Google Ads - Austin
   - Google Ads - Marble Falls
   - Facebook - Austin  
   - Facebook - Marble Falls
   - Organic/Direct

### Step 3: Set Up Swap Targets
1. Navigate to Tracking → Swap Targets
2. Create swap targets for each pool
3. Copy the swap target IDs
4. Add to your website code using `data-swap` attribute

### Step 4: Configure Integrations
1. Go to Integrations
2. Connect Google Analytics
3. Connect Google Ads (for call conversion tracking)
4. Set up webhook for custom integrations (optional)

## Environment Variables

If using server-side tracking, add these to your `.env` file:

```bash
# Call Tracking Service
CALLRAIL_API_KEY=your_callrail_api_key
CALLRAIL_COMPANY_ID=your_company_id

# Default phone numbers
DEFAULT_AUSTIN_PHONE=5123689159
DEFAULT_MARBLE_FALLS_PHONE=8304603565
```

## Troubleshooting

### Numbers Not Swapping

**Issue**: Phone numbers remain static  
**Solutions**:
- Verify tracking script is loaded (check Network tab)
- Confirm swap target IDs are correct
- Check for JavaScript errors in console
- Ensure `data-swap` attribute is on correct elements

### Wrong Numbers Displaying

**Issue**: Incorrect number shows for campaign  
**Solutions**:
- Verify UTM parameters in URL
- Check pool configuration in tracking service
- Review number assignment logic
- Confirm pool has available numbers

### Analytics Not Tracking

**Issue**: Calls not appearing in analytics  
**Solutions**:
- Verify integration credentials
- Check tracking service dashboard for call data
- Ensure conversion tracking is enabled
- Review analytics event configuration

## Cost Considerations

### Tracking Number Costs

**CallRail Pricing Example:**
- Base Plan: $45/month (includes 1 tracking number)
- Additional Numbers: $5/month per number
- Text Tracking: $5/month per number
- Estimated Monthly Cost for 20 numbers: $140/month

**Budget Planning:**
- Small campaigns: 5-10 numbers ($70-95/month)
- Medium campaigns: 10-20 numbers ($95-145/month)
- Large campaigns: 20+ numbers ($145+/month)

## Next Steps

1. Choose a call tracking provider (CallRail recommended)
2. Purchase tracking numbers for your key campaigns
3. Implement tracking code on website
4. Configure integrations with Google Analytics and Google Ads
5. Test all marketing channels
6. Monitor and optimize based on call data

## Support Resources

- **CallRail Support**: support@callrail.com
- **CallRail Documentation**: https://support.callrail.com
- **CallRail API**: https://apidocs.callrail.com
