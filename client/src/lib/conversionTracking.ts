// Conversion tracking for all marketing platforms
// Tracks key user actions across GA, Meta Pixel, and GTM

import { trackEvent, trackMetaEvent, trackGTMEvent } from './analytics';

/**
 * Track when a user submits the contact form
 */
export const trackContactFormSubmission = (formType: string = 'general') => {
  // Google Analytics
  trackEvent('contact_form_submit', 'engagement', formType);
  
  // Meta Pixel - Standard event
  trackMetaEvent('Contact', {
    content_name: formType,
    content_category: 'contact_form'
  });
  
  // Google Tag Manager
  trackGTMEvent('contact_form_submit', {
    form_type: formType,
    event_category: 'engagement'
  });
};

/**
 * Track when a user clicks the phone number to call
 */
export const trackPhoneClick = (phoneNumber: string, source: string = 'website') => {
  // Google Analytics
  trackEvent('phone_click', 'conversion', `${source}_${phoneNumber}`);
  
  // Meta Pixel - Custom conversion
  trackMetaEvent('Contact', {
    content_name: 'phone_call',
    content_category: source,
    value: phoneNumber
  });
  
  // Google Tag Manager
  trackGTMEvent('phone_click', {
    phone_number: phoneNumber,
    source: source,
    event_category: 'conversion'
  });
};

/**
 * Track when a user opens the ServiceTitan scheduler
 */
export const trackSchedulerOpen = (source: string = 'website') => {
  // Google Analytics
  trackEvent('scheduler_open', 'conversion', source);
  
  // Meta Pixel - Lead event
  trackMetaEvent('Lead', {
    content_name: 'appointment_scheduler',
    content_category: source
  });
  
  // Google Tag Manager
  trackGTMEvent('scheduler_open', {
    source: source,
    event_category: 'conversion'
  });
};

/**
 * Track when a user submits a success story
 */
export const trackSuccessStorySubmission = () => {
  // Google Analytics
  trackEvent('success_story_submit', 'engagement', 'user_generated_content');
  
  // Meta Pixel - Custom event
  trackMetaEvent('SubmitApplication', {
    content_name: 'success_story',
    content_category: 'ugc'
  });
  
  // Google Tag Manager
  trackGTMEvent('success_story_submit', {
    event_category: 'engagement',
    content_type: 'user_generated_content'
  });
};

/**
 * Track membership purchase
 */
export const trackMembershipPurchase = (
  membershipType: string,
  value: number,
  transactionId: string
) => {
  // Google Analytics - Enhanced Ecommerce
  trackEvent('purchase', 'ecommerce', membershipType, value);
  
  // Meta Pixel - Purchase event
  trackMetaEvent('Purchase', {
    content_name: membershipType,
    content_type: 'membership',
    value: value,
    currency: 'USD',
    transaction_id: transactionId
  });
  
  // Google Tag Manager - Enhanced Ecommerce
  trackGTMEvent('purchase', {
    event_category: 'ecommerce',
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
    items: [{
      item_name: membershipType,
      item_category: 'membership',
      price: value,
      quantity: 1
    }]
  });
};

/**
 * Track when user adds membership to cart
 */
export const trackAddToCart = (membershipType: string, value: number) => {
  // Google Analytics
  trackEvent('add_to_cart', 'ecommerce', membershipType, value);
  
  // Meta Pixel - AddToCart event
  trackMetaEvent('AddToCart', {
    content_name: membershipType,
    content_type: 'membership',
    value: value,
    currency: 'USD'
  });
  
  // Google Tag Manager
  trackGTMEvent('add_to_cart', {
    event_category: 'ecommerce',
    value: value,
    currency: 'USD',
    items: [{
      item_name: membershipType,
      item_category: 'membership',
      price: value
    }]
  });
};

/**
 * Track when user initiates checkout
 */
export const trackBeginCheckout = (membershipType: string, value: number) => {
  // Google Analytics
  trackEvent('begin_checkout', 'ecommerce', membershipType, value);
  
  // Meta Pixel - InitiateCheckout event
  trackMetaEvent('InitiateCheckout', {
    content_name: membershipType,
    content_type: 'membership',
    value: value,
    currency: 'USD'
  });
  
  // Google Tag Manager
  trackGTMEvent('begin_checkout', {
    event_category: 'ecommerce',
    value: value,
    currency: 'USD',
    items: [{
      item_name: membershipType,
      item_category: 'membership',
      price: value
    }]
  });
};

/**
 * Track page view with additional context
 */
export const trackPageViewWithContext = (
  pageName: string,
  pageCategory: string
) => {
  // Google Analytics is handled automatically by useAnalytics hook
  
  // Meta Pixel - ViewContent event
  trackMetaEvent('ViewContent', {
    content_name: pageName,
    content_category: pageCategory
  });
  
  // Google Tag Manager
  trackGTMEvent('page_view', {
    page_name: pageName,
    page_category: pageCategory
  });
};

/**
 * Track search queries
 */
export const trackSearch = (searchTerm: string) => {
  // Google Analytics
  trackEvent('search', 'engagement', searchTerm);
  
  // Meta Pixel - Search event
  trackMetaEvent('Search', {
    search_string: searchTerm,
    content_category: 'site_search'
  });
  
  // Google Tag Manager
  trackGTMEvent('search', {
    search_term: searchTerm,
    event_category: 'engagement'
  });
};

/**
 * Track video plays (for future video content)
 */
export const trackVideoPlay = (videoName: string, videoCategory: string = 'general') => {
  // Google Analytics
  trackEvent('video_play', 'engagement', videoName);
  
  // Meta Pixel
  trackMetaEvent('ViewContent', {
    content_name: videoName,
    content_type: 'video',
    content_category: videoCategory
  });
  
  // Google Tag Manager
  trackGTMEvent('video_play', {
    video_name: videoName,
    video_category: videoCategory,
    event_category: 'engagement'
  });
};
