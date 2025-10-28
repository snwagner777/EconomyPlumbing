/**
 * Success Stories - Admin Page
 * 
 * Testimonials and customer success stories
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Success Stories | Admin',
  robots: 'noindex',
};

export default function SuccessStoriesPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-success-stories">
          Success Stories
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Manage customer testimonials and success stories
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - Testimonial and success story management
          </p>
        </div>
      </div>
    </div>
  );
}
