// Marketing & Analytics integration for Economy Plumbing Services
// Includes: Google Analytics, Meta Pixel, Google Tag Manager, Microsoft Clarity

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
    clarity: (...args: any[]) => void;
  }
}

export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Check if GA is already initialized (prevent double-loading on hot reload)
  if (typeof window.gtag !== 'undefined') {
    console.log('Google Analytics already initialized');
    return;
  }

  // Check if script is already in the DOM
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
  if (existingScript) {
    console.log('Google Analytics script already exists');
    return;
  }

  // Defer GA loading using requestIdleCallback for better performance
  const loadGA = () => {
    // Add Google Analytics script to the head
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    // Initialize gtag
    const script2 = document.createElement('script');
    script2.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}');
    `;
    document.head.appendChild(script2);

    console.log('Google Analytics initialized successfully');
  };

  // Use requestIdleCallback for non-critical GA loading
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGA);
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(loadGA, 1);
  }
};

export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Meta Pixel (Facebook Pixel) initialization
export const initMetaPixel = () => {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;

  if (!pixelId) {
    console.warn('Missing Meta Pixel ID: VITE_META_PIXEL_ID');
    return;
  }

  // Check if Meta Pixel is already initialized
  if (typeof window.fbq !== 'undefined') {
    console.log('Meta Pixel already initialized');
    return;
  }

  // Defer Meta Pixel loading
  const loadMetaPixel = () => {
    // Initialize fbq
    const script = document.createElement('script');
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Add noscript tracking
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    console.log('Meta Pixel initialized successfully');
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadMetaPixel);
  } else {
    setTimeout(loadMetaPixel, 1);
  }
};

// Google Tag Manager initialization
export const initGTM = () => {
  const gtmId = import.meta.env.VITE_GTM_ID;

  if (!gtmId) {
    console.warn('Missing Google Tag Manager ID: VITE_GTM_ID');
    return;
  }

  // Check if GTM script is already loaded (proper check, not just dataLayer)
  const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtm.js"]`);
  if (existingScript) {
    console.log('Google Tag Manager already initialized');
    return;
  }

  // Defer GTM loading
  const loadGTM = () => {
    // Initialize dataLayer (may already exist from GA)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    // Add GTM script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(script);

    // Add noscript iframe for GTM
    const noscript = document.createElement('noscript');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    noscript.appendChild(iframe);
    document.body.insertBefore(noscript, document.body.firstChild);

    console.log('Google Tag Manager initialized successfully');
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGTM);
  } else {
    setTimeout(loadGTM, 1);
  }
};

// Microsoft Clarity initialization
export const initClarity = () => {
  const clarityId = import.meta.env.VITE_CLARITY_ID;

  if (!clarityId) {
    console.warn('Missing Microsoft Clarity ID: VITE_CLARITY_ID');
    return;
  }

  // Check if Clarity is already initialized
  if (typeof window.clarity !== 'undefined') {
    console.log('Microsoft Clarity already initialized');
    return;
  }

  // Defer Clarity loading
  const loadClarity = () => {
    const script = document.createElement('script');
    script.textContent = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");
    `;
    document.head.appendChild(script);

    console.log('Microsoft Clarity initialized successfully');
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadClarity);
  } else {
    setTimeout(loadClarity, 1);
  }
};

// Track Meta Pixel events
export const trackMetaEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  window.fbq('track', eventName, params);
};

// Track custom events via GTM dataLayer
export const trackGTMEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window === 'undefined' || !window.dataLayer) return;
  
  window.dataLayer.push({
    event: eventName,
    ...params
  });
};

// Initialize all analytics platforms
export const initAllAnalytics = () => {
  initGA();
  initMetaPixel();
  initGTM();
  initClarity();
};
