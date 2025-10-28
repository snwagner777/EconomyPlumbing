/**
 * Tracking Numbers - Admin Page
 * 
 * Phone number tracking management
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tracking Numbers | Admin',
  robots: 'noindex',
};

export default function TrackingPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-tracking">
          Tracking Numbers
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Manage phone numbers for marketing channel tracking
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - Phone number tracking management
          </p>
        </div>
      </div>
    </div>
  );
}
