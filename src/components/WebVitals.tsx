'use client';

import { useEffect } from 'react';
import type { Metric } from 'web-vitals';

// Dynamic import for web-vitals to avoid SSR issues
const reportWebVitals = async (metric: Metric) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    const { name, value, rating, delta, id, navigationType } = metric;
    
    // Send to Google Analytics 4
    (window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      metric_id: id,
      metric_value: value,
      metric_delta: delta,
      metric_rating: rating,
      navigation_type: navigationType,
      non_interaction: true,
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Web Vitals] ${name}:`, {
        value: Math.round(value),
        rating,
        delta: Math.round(delta),
      });
    }
  }
};

/**
 * Core Web Vitals monitoring component
 * Measures and reports:
 * - LCP (Largest Contentful Paint)
 * - FID (First Input Delay) - deprecated, replaced by INP
 * - INP (Interaction to Next Paint) - new responsiveness metric
 * - CLS (Cumulative Layout Shift)
 * - FCP (First Contentful Paint)
 * - TTFB (Time to First Byte)
 * 
 * Sends metrics to Google Analytics 4 via gtag
 */
export function WebVitals() {
  useEffect(() => {
    // Dynamically import web-vitals only on client-side
    import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVitals);
      onFID(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
      onINP(reportWebVitals); // New responsiveness metric replacing FID
    });
  }, []);

  return null;
}
