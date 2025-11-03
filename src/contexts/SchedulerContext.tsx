'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SchedulerContextType {
  isOpen: boolean;
  openScheduler: (prefilledService?: string) => void;
  closeScheduler: () => void;
  prefilledService?: string;
}

const SchedulerContext = createContext<SchedulerContextType | undefined>(undefined);

export function SchedulerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefilledService, setPrefilledService] = useState<string>();

  const openScheduler = (service?: string) => {
    setPrefilledService(service);
    setIsOpen(true);
  };

  const closeScheduler = () => {
    setIsOpen(false);
    setPrefilledService(undefined);
  };

  // Listen for scheduler events from openScheduler() calls
  useEffect(() => {
    const handleOpenScheduler = (event: CustomEvent<{ prefilledService?: string }>) => {
      setPrefilledService(event.detail?.prefilledService);
      setIsOpen(true);
    };

    window.addEventListener('open-scheduler', handleOpenScheduler as EventListener);

    return () => {
      window.removeEventListener('open-scheduler', handleOpenScheduler as EventListener);
    };
  }, []);

  return (
    <SchedulerContext.Provider value={{ isOpen, openScheduler, closeScheduler, prefilledService }}>
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
