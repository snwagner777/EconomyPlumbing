/**
 * Contacts - Admin Page
 * 
 * Form submissions and leads
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacts | Admin',
  robots: 'noindex',
};

export default function ContactsPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-contacts">
          Contact Submissions
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          View and manage form submissions and leads
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - Contact form submissions and lead management
          </p>
        </div>
      </div>
    </div>
  );
}
