/**
 * Admin Dashboard - Main Page
 * 
 * Overview and navigation for admin functions
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Economy Plumbing Services',
  robots: 'noindex',
};

async function getStats() {
  // Server-side fetch for admin stats (cookies forwarded automatically)
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/admin/stats`, {
    cache: 'no-store',
  });
  
  if (!res.ok) {
    return null;
  }
  
  return res.json();
}

export default async function AdminDashboardPage() {
  const admin = await isAdmin();
  
  if (!admin) {
    redirect('/admin/oauth-login');
  }

  const statsData = await getStats();
  const stats = statsData?.stats || {};

  const sections = [
    {
      title: 'Customers',
      href: '/admin/customers',
      count: stats.totalCustomers || 0,
    },
    {
      title: 'Marketing',
      href: '/admin/marketing',
      count: stats.activeReviewRequests + stats.activeReferralCampaigns || 0,
    },
    {
      title: 'Blog',
      href: '/admin/blog',
      count: stats.totalBlogPosts || 0,
    },
    {
      title: 'Contacts',
      href: '/admin/contacts',
      count: stats.recentContacts || 0,
    },
    {
      title: 'Photos',
      href: '/admin/photos',
      count: 0,
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      count: null,
    },
  ];

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Economy Plumbing Services Management
              </p>
            </div>
            <a 
              href="/api/auth/logout" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </a>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="bg-card p-6 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Customers</div>
              <div className="text-3xl font-bold">{stats.totalCustomers || 0}</div>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Active Campaigns</div>
              <div className="text-3xl font-bold">
                {(stats.activeReviewRequests || 0) + (stats.activeReferralCampaigns || 0)}
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Blog Posts</div>
              <div className="text-3xl font-bold">{stats.totalBlogPosts || 0}</div>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Recent Contacts</div>
              <div className="text-3xl font-bold">{stats.recentContacts || 0}</div>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="grid md:grid-cols-3 gap-6">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="block p-6 bg-card hover:bg-accent rounded-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                  {section.count !== null && (
                    <span className="text-2xl font-bold text-muted-foreground">
                      {section.count}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-12 bg-muted/30 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <a 
                href="/admin/blog/new"
                className="p-4 bg-card hover:bg-accent rounded-lg transition"
              >
                <div className="font-semibold">Create Blog Post</div>
                <div className="text-sm text-muted-foreground">
                  Write a new blog article
                </div>
              </a>
              <a 
                href="/admin/google-reviews/sync"
                className="p-4 bg-card hover:bg-accent rounded-lg transition"
              >
                <div className="font-semibold">Sync Google Reviews</div>
                <div className="text-sm text-muted-foreground">
                  Update reviews from Google
                </div>
              </a>
              <a 
                href="/admin/customers/import"
                className="p-4 bg-card hover:bg-accent rounded-lg transition"
              >
                <div className="font-semibold">Import Customers</div>
                <div className="text-sm text-muted-foreground">
                  Upload ServiceTitan XLSX file
                </div>
              </a>
              <a 
                href="/admin/campaigns/create"
                className="p-4 bg-card hover:bg-accent rounded-lg transition"
              >
                <div className="font-semibold">New Campaign</div>
                <div className="text-sm text-muted-foreground">
                  Start email or SMS campaign
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
