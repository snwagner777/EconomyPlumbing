// Custom scheduler utility - replaces ServiceTitan widget with our custom scheduler
declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
    __PHONE_CONFIG__: { display: string; tel: string };
    __MARBLE_FALLS_PHONE_CONFIG__: { display: string; tel: string };
  }
}

// Open custom scheduler - dispatches event that SchedulerContext listens to
export const openScheduler = (prefilledService?: string) => {
  if (typeof window === 'undefined') return;
  
  try {
    // Dispatch custom event to trigger scheduler modal
    const event = new CustomEvent('open-scheduler', {
      detail: { prefilledService },
    });
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error opening scheduler:', error);
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
