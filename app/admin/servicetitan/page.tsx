/**
 * ServiceTitan Sync - Admin Page
 * 
 * ServiceTitan sync monitoring
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ServiceTitan Sync | Admin',
  robots: 'noindex',
};

export default function ServiceTitanPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-servicetitan">
          ServiceTitan Sync
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Monitor customer data sync status and imports
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - ServiceTitan sync monitoring and XLSX imports
          </p>
        </div>
      </div>
    </div>
  );
}
