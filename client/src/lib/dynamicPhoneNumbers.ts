// Dynamic Phone Number Insertion with 90-day cookie tracking

interface PhoneConfig {
  display: string;
  raw: string;
  tel: string;
}

const PHONE_NUMBERS: Record<string, PhoneConfig> = {
  default: {
    display: '(512) 649-2811',
    raw: '5126492811',
    tel: 'tel:+15126492811'
  },
  google: {
    display: '(512) 368-9159',
    raw: '5123689159',
    tel: 'tel:+15123689159'
  },
  facebook: {
    display: '(512) 575-3157',
    raw: '5125753157',
    tel: 'tel:+15125753157'
  },
  instagram: {
    display: '(512) 575-3157',
    raw: '5125753157',
    tel: 'tel:+15125753157'
  },
  yelp: {
    display: '(512) 893-7316',
    raw: '5128937316',
    tel: 'tel:+15128937316'
  },
  nextdoor: {
    display: '(512) 846-9146',
    raw: '5128469146',
    tel: 'tel:+15128469146'
  }
};

const COOKIE_NAME = 'traffic_source';
const COOKIE_DAYS = 90;

// Get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Set cookie with 90-day expiration
function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/`;
}

// Detect traffic source from URL parameters and referrer
function detectTrafficSource(): string {
  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer.toLowerCase();
  const utmSource = urlParams.get('utm_source')?.toLowerCase();

  // Check for Google (gclid parameter, utm_source, or referrer)
  if (urlParams.has('gclid') || utmSource === 'google' || referrer.includes('google.com')) {
    return 'google';
  }

  // Check for Facebook/Instagram
  if (urlParams.has('fbclid') || referrer.includes('facebook.com') || referrer.includes('instagram.com')) {
    return 'facebook';
  }
  
  if (utmSource === 'facebook' || utmSource === 'instagram' || utmSource === 'fb' || utmSource === 'ig') {
    return 'facebook';
  }

  // Check for Yelp
  if (referrer.includes('yelp.com') || utmSource === 'yelp') {
    return 'yelp';
  }

  // Check for Nextdoor
  if (referrer.includes('nextdoor.com') || utmSource === 'nextdoor') {
    return 'nextdoor';
  }

  return 'default';
}

// Get the current traffic source (from cookie or detection)
export function getTrafficSource(): string {
  // Always detect current source first
  const detectedSource = detectTrafficSource();
  
  // If we detected a non-default source, use it and update the cookie
  if (detectedSource !== 'default') {
    setCookie(COOKIE_NAME, detectedSource, COOKIE_DAYS);
    return detectedSource;
  }
  
  // No source detected, check if we have a stored source in cookie
  const cookieSource = getCookie(COOKIE_NAME);
  if (cookieSource && PHONE_NUMBERS[cookieSource]) {
    return cookieSource;
  }
  
  // No cookie either, return default
  return 'default';
}

// Get phone number configuration for current source
export function getPhoneNumber(): PhoneConfig {
  const source = getTrafficSource();
  return PHONE_NUMBERS[source] || PHONE_NUMBERS.default;
}

// Update window.__PHONE_CONFIG__ for React components
export function updatePhoneConfig(): void {
  const source = getTrafficSource();
  const phoneConfig = PHONE_NUMBERS[source] || PHONE_NUMBERS.default;
  
  // Update the global config that React components read
  (window as any).__PHONE_CONFIG__ = phoneConfig;
}

// Replace all phone numbers on the page (legacy DOM replacement - kept for compatibility)
export function replacePhoneNumbers(): void {
  // First, update the global config so React components get the new number
  updatePhoneConfig();
  
  const source = getTrafficSource();
  const phoneConfig = PHONE_NUMBERS[source] || PHONE_NUMBERS.default;

  // All 512 numbers that could appear on the page (legacy + all tracking numbers)
  // Note: 830 numbers are excluded and remain static
  const allNumbersToReplace = [
    // Legacy hardcoded 512 number
    '(512) 368-9159', '512-368-9159', '512.368.9159', '5123689159', 'tel:+15123689159',
    // Default tracking number
    '(512) 649-2811', '512-649-2811', '512.649.2811', '5126492811', 'tel:+15126492811',
    // Facebook/Instagram tracking number
    '(512) 575-3157', '512-575-3157', '512.575.3157', '5125753157', 'tel:+15125753157',
    // Yelp tracking number
    '(512) 893-7316', '512-893-7316', '512.893.7316', '5128937316', 'tel:+15128937316',
    // Nextdoor tracking number
    '(512) 846-9146', '512-846-9146', '512.846.9146', '5128469146', 'tel:+15128469146'
  ];

  // Replace text content
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Node[] = [];
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }

  textNodes.forEach(textNode => {
    if (textNode.textContent) {
      let text = textNode.textContent;
      let replaced = false;

      // Replace all number formats with the correct tracking number
      allNumbersToReplace.forEach(oldNum => {
        if (text.includes(oldNum) && !oldNum.startsWith('tel:')) {
          text = text.replace(new RegExp(oldNum.replace(/[().\s-]/g, '\\$&'), 'g'), phoneConfig.display);
          replaced = true;
        }
      });

      if (replaced && textNode.textContent !== text) {
        textNode.textContent = text;
      }
    }
  });

  // Replace tel: links
  const links = document.querySelectorAll('a[href^="tel:"]');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href && allNumbersToReplace.includes(href)) {
      link.setAttribute('href', phoneConfig.tel);
    }
  });
}

// Initialize dynamic phone number system
export function initDynamicPhoneNumbers(): void {
  // Run on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      replacePhoneNumbers();
    });
  } else {
    replacePhoneNumbers();
  }

  // Also run after a short delay to catch any dynamically loaded content
  setTimeout(replacePhoneNumbers, 500);
}
