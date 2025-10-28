/**
 * Settings - Admin Page
 * 
 * Site configuration and settings
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | Admin',
  robots: 'noindex',
};

export default function SettingsPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" data-testid="heading-settings">
          Settings
        </h1>
        <p className="text-muted-foreground mb-8" data-testid="text-description">
          Configure site settings and preferences
        </p>
        <div className="bg-muted/30 p-8 rounded-lg border text-center">
          <p className="text-muted-foreground" data-testid="text-coming-soon">
            Coming soon - Site configuration and settings management
          </p>
        </div>
      </div>
    </div>
  );
}
