# ServiceTitan Online Scheduler Integration Guide

This document provides step-by-step instructions for integrating ServiceTitan's online scheduler into the Economy Plumbing Services website.

## Overview

The ServiceTitan scheduler is already set up with placeholder buttons throughout the site. You just need to add the actual ServiceTitan embed code to enable live booking functionality.

## Integration Steps

### Step 1: Get Your ServiceTitan Embed Code

1. Log in to your ServiceTitan account
2. Navigate to **Settings** > **Online Booking**
3. Copy your unique embed code (it will look similar to this):

```html
<script src="https://www.servicetitan.com/embed/scheduler.js" data-tenant-id="YOUR_TENANT_ID"></script>
```

### Step 2: Add the Embed Code to Your Site

You have two options for adding the embed code:

#### Option A: Add to `index.html` (Recommended for Global Access)

1. Open `index.html` in the root directory
2. Add the ServiceTitan script tag just before the closing `</body>` tag:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- existing head content -->
  </head>
  <body>
    <div id="root"></div>
    
    <!-- ServiceTitan Online Scheduler -->
    <script src="https://www.servicetitan.com/embed/scheduler.js" data-tenant-id="YOUR_TENANT_ID"></script>
    
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

#### Option B: Add to Specific Components (For More Control)

If you want to load the scheduler only on certain pages, add it to individual components using React Helmet:

```tsx
import { Helmet } from "react-helmet";

function HomePage() {
  return (
    <>
      <Helmet>
        <script src="https://www.servicetitan.com/embed/scheduler.js" data-tenant-id="YOUR_TENANT_ID"></script>
      </Helmet>
      {/* rest of component */}
    </>
  );
}
```

### Step 3: Update the Scheduler Modal Component

The current `SchedulerModal` component (`client/src/components/SchedulerModal.tsx`) has placeholder functionality. Once ServiceTitan is integrated, update it to trigger the ServiceTitan scheduler:

```tsx
// Update the handleServiceClick function in SchedulerModal.tsx
const handleServiceClick = (serviceId: string) => {
  setSelectedService(serviceId);
  
  // Trigger ServiceTitan scheduler with selected service
  if (window.ServiceTitan && window.ServiceTitan.scheduler) {
    window.ServiceTitan.scheduler.open({
      businessUnitId: 'YOUR_BUSINESS_UNIT_ID',
      jobTypeId: serviceId, // Map this to your ServiceTitan job types
    });
  }
  
  onOpenChange(false);
};
```

### Step 4: Add TypeScript Type Definitions (Optional)

Create a type definition file for ServiceTitan to avoid TypeScript errors:

**File: `client/src/types/servicetitan.d.ts`**

```typescript
interface Window {
  ServiceTitan?: {
    scheduler: {
      open: (config: {
        businessUnitId?: string;
        jobTypeId?: string;
        [key: string]: any;
      }) => void;
      close: () => void;
    };
  };
}
```

### Step 5: Map Service Types to ServiceTitan Job Types

Create a mapping between your website services and ServiceTitan job types:

```tsx
const serviceToJobTypeMap = {
  'plumbing': 'YOUR_PLUMBING_JOB_TYPE_ID',
  'water-treatment': 'YOUR_WATER_TREATMENT_JOB_TYPE_ID',
  'irrigation': 'YOUR_IRRIGATION_JOB_TYPE_ID'
};
```

## Testing

1. Click any "Schedule Service" button on the website
2. Verify that the ServiceTitan scheduler modal opens
3. Complete a test booking to ensure data flows to ServiceTitan correctly
4. Check your ServiceTitan dashboard to confirm the appointment was created

## Troubleshooting

### Scheduler Not Opening

- **Check Console Errors**: Open browser developer tools and check for JavaScript errors
- **Verify Script Loading**: Ensure the ServiceTitan script is loading (check Network tab in dev tools)
- **Confirm Tenant ID**: Double-check your ServiceTitan tenant ID is correct

### Wrong Job Types Showing

- **Update Job Type Mapping**: Ensure your service-to-job-type mapping matches your ServiceTitan setup
- **Business Unit ID**: Verify you're using the correct business unit ID

### Styling Issues

- **Custom CSS**: You may need to add custom CSS to match ServiceTitan's modal with your site's design
- **Override Styles**: Use CSS specificity to override ServiceTitan's default styles if needed

```css
/* Example custom styling for ServiceTitan modal */
.servicetitan-modal {
  font-family: var(--font-inter) !important;
  --primary-color: var(--primary) !important;
}
```

## Additional Configuration

### Pre-fill Customer Information

If you have customer data from your contact form, you can pre-fill the scheduler:

```tsx
window.ServiceTitan.scheduler.open({
  customerName: contactForm.name,
  customerPhone: contactForm.phone,
  customerEmail: contactForm.email,
  // ... other config
});
```

### Custom Callbacks

ServiceTitan may support callbacks for tracking booking completions:

```tsx
window.ServiceTitan.scheduler.on('bookingComplete', (data) => {
  // Track in Google Analytics
  gtag('event', 'booking_complete', {
    'event_category': 'Scheduler',
    'event_label': data.jobType
  });
});
```

## Current Implementation

The website currently has scheduler buttons in these locations:

1. **Header** - "Schedule Service" button (all pages)
2. **Hero Section** - Primary CTA on homepage
3. **Service Cards** - "Schedule Now" buttons on all service pages
4. **Contact Form** - Alternative to form submission
5. **Service Area Pages** - City-specific scheduling buttons

All buttons trigger the `SchedulerModal` component, which will integrate with ServiceTitan once you add your embed code.

## Support

For ServiceTitan-specific configuration questions, contact ServiceTitan support:
- **Phone**: (833) 632-3254
- **Email**: support@servicetitan.com
- **Documentation**: https://help.servicetitan.com
