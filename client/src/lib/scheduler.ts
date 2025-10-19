// ServiceTitan scheduler utility with on-demand loading for performance optimization
declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
    __PHONE_CONFIG__: { display: string; tel: string };
    __MARBLE_FALLS_PHONE_CONFIG__: { display: string; tel: string };
  }
}

let isCheckingScheduler = false;
let schedulerReady = false;
let scriptLoading = false;

// Load ServiceTitan script dynamically (only when needed)
const loadServiceTitanScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="servicetitan.com"]');
    if (existingScript || typeof window.STWidgetManager !== 'undefined') {
      schedulerReady = true;
      resolve(true);
      return;
    }

    // Prevent multiple simultaneous loads
    if (scriptLoading) {
      // Wait for the existing load to complete
      const checkInterval = setInterval(() => {
        if (schedulerReady) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 100);
      return;
    }

    scriptLoading = true;

    // Create and inject the ServiceTitan script
    const script = document.createElement('script');
    script.innerHTML = `
      (function(q,w,e,r,t,y,u){q[t]=q[t]||function(){(q[t].q = q[t].q || []).push(arguments)};
        q[t].l=1*new Date();y=w.createElement(e);u=w.getElementsByTagName(e)[0];y.async=true;
        y.src=r;u.parentNode.insertBefore(y,u);q[t]('init', '3ce4a586-8427-4716-9ac6-46cb8bf7ac4f');
      })(window, document, 'script', 'https://static.servicetitan.com/webscheduler/shim.js', 'STWidgetManager');
    `;
    document.body.appendChild(script);

    // Wait for it to initialize
    const maxAttempts = 50;
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (window.STWidgetManager && typeof window.STWidgetManager === 'function') {
        schedulerReady = true;
        scriptLoading = false;
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        scriptLoading = false;
        clearInterval(checkInterval);
        console.error('ServiceTitan scheduler failed to load after 5 seconds');
        resolve(false);
      }
    }, 100);
  });
};

// Wait for STWidgetManager to be available (legacy function, now loads on demand)
const waitForScheduler = (): Promise<boolean> => {
  return loadServiceTitanScript();
};

// Open the scheduler with proper error handling
export const openScheduler = async () => {
  console.log('Attempting to open ServiceTitan scheduler...');

  // If we already know it's ready, open immediately
  if (schedulerReady && window.STWidgetManager) {
    try {
      window.STWidgetManager('ws-open');
      console.log('Scheduler opened successfully');
      return true;
    } catch (error) {
      console.error('Error opening scheduler:', error);
      showSchedulerError();
      return false;
    }
  }

  // Otherwise, wait for it to load
  if (!isCheckingScheduler) {
    isCheckingScheduler = true;
    const loaded = await waitForScheduler();
    isCheckingScheduler = false;

    if (loaded && window.STWidgetManager) {
      try {
        window.STWidgetManager('ws-open');
        console.log('Scheduler opened successfully after waiting');
        return true;
      } catch (error) {
        console.error('Error opening scheduler after load:', error);
        showSchedulerError();
        return false;
      }
    } else {
      console.error('ServiceTitan scheduler could not be loaded');
      showSchedulerError();
      return false;
    }
  }

  return false;
};

// Show user-friendly error message
const showSchedulerError = () => {
  const austinPhone = window.__PHONE_CONFIG__?.display || '(512) 368-9159';
  const marbleFallsPhone = window.__MARBLE_FALLS_PHONE_CONFIG__?.display || '(830) 460-3565';
  
  alert(
    'Online scheduler is temporarily unavailable.\n\n' +
    'Please call us directly:\n' +
    `Austin: ${austinPhone}\n` +
    `Marble Falls: ${marbleFallsPhone}\n\n` +
    'Or refresh the page and try again.'
  );
};
