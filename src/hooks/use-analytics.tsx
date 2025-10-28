'use client';

// Analytics hook for tracking page views on route changes
// Reference: blueprint:javascript_google_analytics

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const location = usePathname() || '/';
  const prevLocationRef = useRef<string>(location);
  
  useEffect(() => {
    if (location !== prevLocationRef.current) {
      trackPageView(location);
      prevLocationRef.current = location;
    }
  }, [location]);
};
