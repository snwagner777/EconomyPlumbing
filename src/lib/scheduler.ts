// ServiceTitan scheduler utility - script loaded in layout.tsx
// CRITICAL: Script MUST be in layout.tsx at end of body tag exactly as ServiceTitan provided
declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
    __PHONE_CONFIG__: { display: string; tel: string };
    __MARBLE_FALLS_PHONE_CONFIG__: { display: string; tel: string };
  }
}

// Wait for STWidgetManager to be available
const waitForScheduler = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if already available
    if (typeof window.STWidgetManager !== 'undefined') {
      resolve(true);
      return;
    }

    // Wait up to 5 seconds for script to load
    const maxAttempts = 50;
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (window.STWidgetManager && typeof window.STWidgetManager === 'function') {
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('ServiceTitan scheduler not found - check that script is in layout.tsx');
        resolve(false);
      }
    }, 100);
  });
};

// Open the scheduler with proper error handling
export const openScheduler = async () => {
  console.log('Attempting to open ServiceTitan scheduler...');

  // Wait for STWidgetManager to be available
  const isReady = await waitForScheduler();

  if (isReady && window.STWidgetManager) {
    try {
      // Call exactly as ServiceTitan specifies: STWidgetManager('ws-open')
      window.STWidgetManager('ws-open');
      console.log('Scheduler opened successfully');
      return true;
    } catch (error) {
      console.error('Error opening scheduler:', error);
      showSchedulerError();
      return false;
    }
  } else {
    console.error('ServiceTitan scheduler could not be loaded');
    showSchedulerError();
    return false;
  }
};

// Show user-friendly error message
const showSchedulerError = () => {
  // Access window globals with multiple fallback levels
  const austinPhone = window.__PHONE_CONFIG__?.display || '(512) 368-9159';
  const marbleFallsPhone = window.__MARBLE_FALLS_PHONE_CONFIG__?.display || 
                           window.__PHONE_CONFIG__?.display || 
                           '(830) 460-3565';
  
  // Log missing config for debugging
  if (!window.__PHONE_CONFIG__) {
    console.warn('[Scheduler] window.__PHONE_CONFIG__ not initialized');
  }
  if (!window.__MARBLE_FALLS_PHONE_CONFIG__) {
    console.warn('[Scheduler] window.__MARBLE_FALLS_PHONE_CONFIG__ not initialized');
  }
  
  alert(
    'Online scheduler is temporarily unavailable.\n\n' +
    'Please call us directly:\n' +
    `Austin: ${austinPhone}\n` +
    `Marble Falls: ${marbleFallsPhone}\n\n` +
    'Or refresh the page and try again.'
  );
};
