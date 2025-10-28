/**
 * Reputation Management - Admin Page
 * 
 * Review request campaigns and templates
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reputation Management | Admin',
  robots: 'noindex',
};

export default function ReputationPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-reputation">
          Reputation Management
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Review request campaigns and templates
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - Review request automation and template management
          </p>
        </div>
      </div>
    </div>
  );
}
