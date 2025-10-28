/**
 * Photo Management - Admin Page
 * 
 * Photo library management
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Photo Management | Admin',
  robots: 'noindex',
};

export default function PhotosPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-photos">
          Photo Management
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Manage photos from CompanyCam, Google Drive, and ServiceTitan
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - Photo library management and metadata
          </p>
        </div>
      </div>
    </div>
  );
}
