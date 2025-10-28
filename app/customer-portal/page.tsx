/**
 * Customer Portal - Landing/Login Page
 * 
 * Entry point for customer portal with ServiceTitan OAuth
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Customer Portal | Economy Plumbing Services',
  description: 'Access your plumbing service history, view invoices, and manage your account.',
};

export default function CustomerPortalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        <div className="bg-card p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">Customer Portal</h1>
          
          <p className="text-muted-foreground mb-8 text-center">
            Access your service history, invoices, and account information
          </p>

          <div className="space-y-4">
            <Link
              href="/api/servicetitan/auth"
              className="block w-full bg-primary text-primary-foreground text-center px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Login with ServiceTitan
            </Link>

            <p className="text-sm text-muted-foreground text-center">
              Use the same credentials you received in your service email
            </p>
          </div>

          <div className="mt-8 pt-6 border-t">
            <h2 className="font-semibold mb-3">Portal Features:</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• View service history and job details</li>
              <li>• Access invoices and receipts</li>
              <li>• Check VIP membership status</li>
              <li>• Schedule appointments online</li>
            </ul>
          </div>

          <div className="mt-6 text-center">
            <Link href="/contact" className="text-sm text-primary hover:underline">
              Need help accessing your account?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
