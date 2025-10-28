/**
 * Commercial Customers - Admin Page
 * 
 * Commercial customer management
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commercial Customers | Admin',
  robots: 'noindex',
};

export default function CommercialPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-commercial">
          Commercial Customers
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Manage commercial customer logos and information
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - Commercial customer management
          </p>
        </div>
      </div>
    </div>
  );
}
