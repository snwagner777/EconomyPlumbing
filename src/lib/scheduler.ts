// ServiceTitan scheduler utility - script loaded in layout.tsx
// CRITICAL: Script MUST be in layout.tsx at end of body tag exactly as ServiceTitan provided
declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
    __PHONE_CONFIG__: { display: string; tel: string };
    __MARBLE_FALLS_PHONE_CONFIG__: { display: string; tel: string };
  }
}

// Open scheduler - calls STWidgetManager directly as ServiceTitan specifies
export const openScheduler = () => {
  if (typeof window === 'undefined') return;
  
  if (typeof window.STWidgetManager === 'function') {
    try {
      window.STWidgetManager('ws-open');
    } catch (error) {
      console.error('Error opening ServiceTitan scheduler:', error);
      showSchedulerError();
    }
  } else {
    console.error('STWidgetManager not found - script may not be loaded yet');
    showSchedulerError();
  }
};

// Show user-friendly error message
const showSchedulerError = () => {
  const austinPhone = window.__PHONE_CONFIG__?.display || '(512) 368-9159';
  const marbleFallsPhone = window.__MARBLE_FALLS_PHONE_CONFIG__?.display || 
                           window.__PHONE_CONFIG__?.display || 
                           '(830) 460-3565';
  
  alert(
    'Online scheduler is temporarily unavailable.\n\n' +
    'Please call us directly:\n' +
    `Austin: ${austinPhone}\n` +
    `Marble Falls: ${marbleFallsPhone}\n\n` +
    'Or refresh the page and try again.'
  );
};
