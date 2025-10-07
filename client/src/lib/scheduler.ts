// ServiceTitan scheduler utility with proper async handling and error reporting
declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
  }
}

let isCheckingScheduler = false;
let schedulerReady = false;

// Wait for STWidgetManager to be available
const waitForScheduler = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.STWidgetManager && typeof window.STWidgetManager === 'function') {
      schedulerReady = true;
      resolve(true);
      return;
    }

    // Wait up to 5 seconds for the script to load
    const maxAttempts = 50;
    let attempts = 0;

    const checkInterval = setInterval(() => {
      attempts++;

      if (window.STWidgetManager && typeof window.STWidgetManager === 'function') {
        schedulerReady = true;
        clearInterval(checkInterval);
        resolve(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('ServiceTitan scheduler failed to load after 5 seconds');
        resolve(false);
      }
    }, 100);
  });
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
  alert(
    'Online scheduler is temporarily unavailable.\n\n' +
    'Please call us directly:\n' +
    'Austin: (512) 368-9159\n' +
    'Marble Falls: (830) 460-3565\n\n' +
    'Or refresh the page and try again.'
  );
};
