'use client';

// Analytics hook for tracking page views on route changes
// Reference: blueprint:javascript_google_analytics

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '../lib/analytics';

export const useAnalytics = () => {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  
  // Reconstruct full URL with query string for UTM tracking
  const fullUrl = searchParams?.toString() 
    ? `${pathname}?${searchParams.toString()}` 
    : pathname;
  
  const prevLocationRef = useRef<string>(fullUrl);
  
  useEffect(() => {
    if (fullUrl !== prevLocationRef.current) {
      trackPageView(fullUrl);
      prevLocationRef.current = fullUrl;
    }
  }, [fullUrl]);
};
