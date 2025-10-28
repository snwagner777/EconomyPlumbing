/**
 * Store Page
 * 
 * Ecwid-powered store for memberships and products
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Store | Economy Plumbing Services',
  description: 'Shop VIP memberships and plumbing products from Economy Plumbing Services.',
  openGraph: {
    title: 'Store - Economy Plumbing Services',
    description: 'Shop VIP memberships and plumbing products',
  },
};

export default function StorePage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-6">Store</h1>
        
        <p className="text-xl text-muted-foreground mb-12">
          Shop VIP memberships and plumbing products
        </p>

        <div className="bg-muted/30 p-12 rounded-lg text-center">
          <p className="text-lg mb-6">
            Ecwid store integration will be displayed here
          </p>
          <div className="space-y-4">
            <a 
              href="/vip-membership"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              View VIP Membership
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
