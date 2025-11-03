'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SchedulerOptions {
  prefilledService?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referralCode?: string;
  customerId?: number;
}

interface SchedulerContextType {
  isOpen: boolean;
  openScheduler: (optionsOrService?: string | SchedulerOptions) => void;
  closeScheduler: () => void;
  options: SchedulerOptions;
}

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

export function SchedulerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<SchedulerOptions>({});

  const openScheduler = (optionsOrService?: string | SchedulerOptions) => {
    // Backwards compatibility: if string is passed, treat it as prefilledService
    if (typeof optionsOrService === 'string') {
      setOptions({ prefilledService: optionsOrService });
    } else {
      setOptions(optionsOrService || {});
    }
    setIsOpen(true);
  };

  const closeScheduler = () => {
    setIsOpen(false);
    // Clear options after animation completes
    setTimeout(() => setOptions({}), 300);
  };

  // Listen for scheduler events from openScheduler() calls
  useEffect(() => {
    const handleOpenScheduler = (event: CustomEvent<SchedulerOptions>) => {
      const eventOptions = event.detail || {};
      setOptions(eventOptions);
      setIsOpen(true);
    };

    window.addEventListener('open-scheduler', handleOpenScheduler as EventListener);

    return () => {
      window.removeEventListener('open-scheduler', handleOpenScheduler as EventListener);
    };
  }, []);

  return (
    <SchedulerContext.Provider value={{ isOpen, openScheduler, closeScheduler, options }}>
      {children}
    </SchedulerContext.Provider>
  );
}

export function useScheduler() {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within SchedulerProvider');
  }
  return context;
}
