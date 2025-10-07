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

  // Check for Facebook/Instagram
  if (urlParams.has('fbclid') || referrer.includes('facebook.com') || referrer.includes('instagram.com')) {
    return 'facebook';
  }
  
  const utmSource = urlParams.get('utm_source')?.toLowerCase();
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
  // Check if we already have a source in cookie
  const cookieSource = getCookie(COOKIE_NAME);
  
  if (cookieSource && PHONE_NUMBERS[cookieSource]) {
    return cookieSource;
  }

  // Detect new source
  const newSource = detectTrafficSource();
  
  // Only set cookie if it's not default (we want to track actual sources)
  if (newSource !== 'default') {
    setCookie(COOKIE_NAME, newSource, COOKIE_DAYS);
  }
  
  return newSource;
}

// Get phone number configuration for current source
export function getPhoneNumber(): PhoneConfig {
  const source = getTrafficSource();
  return PHONE_NUMBERS[source] || PHONE_NUMBERS.default;
}

// Replace all phone numbers on the page
export function replacePhoneNumbers(): void {
  const source = getTrafficSource();
  const phoneConfig = PHONE_NUMBERS[source] || PHONE_NUMBERS.default;

  // Old numbers to replace (current hardcoded numbers)
  const oldAustinNumbers = [
    '(512) 368-9159',
    '512-368-9159',
    '512.368.9159',
    '5123689159',
    'tel:+15123689159'
  ];

  const oldMarbleFallsNumbers = [
    '(830) 460-3565',
    '830-460-3565',
    '830.460.3565',
    '8304603565',
    'tel:+18304603565'
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

      // Replace all old number formats with new number
      [...oldAustinNumbers, ...oldMarbleFallsNumbers].forEach(oldNum => {
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
    if (href && (oldAustinNumbers.includes(href) || oldMarbleFallsNumbers.includes(href))) {
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
