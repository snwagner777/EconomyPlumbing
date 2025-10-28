/**
 * Admin Dashboard - Main Page
 * 
 * Overview and navigation for admin functions
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/session';
import Link from 'next/link';
import { 
  Users, 
  Mail, 
  FileText, 
  Phone, 
  ImageIcon, 
  Settings,
  Star,
  Database,
  PlusCircle,
  Upload,
  ArrowRight
} from 'lucide-react';

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
      icon: Users,
      description: 'Customer database and ServiceTitan sync',
    },
    {
      title: 'Marketing',
      href: '/admin/marketing',
      count: (stats.activeReviewRequests || 0) + (stats.activeReferralCampaigns || 0),
      icon: Mail,
      description: 'Email campaigns and automation',
    },
    {
      title: 'Blog',
      href: '/admin/blog',
      count: stats.totalBlogPosts || 0,
      icon: FileText,
      description: 'Content management system',
    },
    {
      title: 'Contacts',
      href: '/admin/contacts',
      count: stats.recentContacts || 0,
      icon: Mail,
      description: 'Form submissions and leads',
    },
    {
      title: 'Photos',
      href: '/admin/photos',
      count: 0,
      icon: ImageIcon,
      description: 'Photo library management',
    },
    {
      title: 'Settings',
      href: '/admin/settings',
      count: null,
      icon: Settings,
      description: 'Site configuration',
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="heading-dashboard">
            Dashboard
          </h1>
          <p className="text-muted-foreground" data-testid="text-description">
            Overview and analytics for Economy Plumbing Services
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1" data-testid="label-total-customers">
              Total Customers
            </div>
            <div className="text-3xl font-bold" data-testid="stat-total-customers">
              {stats.totalCustomers || 0}
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1" data-testid="label-active-campaigns">
              Active Campaigns
            </div>
            <div className="text-3xl font-bold" data-testid="stat-active-campaigns">
              {(stats.activeReviewRequests || 0) + (stats.activeReferralCampaigns || 0)}
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1" data-testid="label-blog-posts">
              Blog Posts
            </div>
            <div className="text-3xl font-bold" data-testid="stat-blog-posts">
              {stats.totalBlogPosts || 0}
            </div>
          </div>
          <div className="bg-card p-6 rounded-lg border">
            <div className="text-sm text-muted-foreground mb-1" data-testid="label-recent-contacts">
              Recent Contacts
            </div>
            <div className="text-3xl font-bold" data-testid="stat-recent-contacts">
              {stats.recentContacts || 0}
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="block p-6 bg-card hover:bg-accent rounded-lg border transition group"
              data-testid={`card-admin-${section.title.toLowerCase()}`}
            >
              <div className="flex items-start justify-between mb-3">
                <section.icon className="h-8 w-8 text-primary" />
                {section.count !== null && (
                  <span className="text-2xl font-bold text-muted-foreground" data-testid={`count-${section.title.toLowerCase()}`}>
                    {section.count}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold mb-1 flex items-center gap-2" data-testid={`heading-${section.title.toLowerCase()}`}>
                {section.title}
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
              </h2>
              <p className="text-sm text-muted-foreground" data-testid={`description-${section.title.toLowerCase()}`}>
                {section.description}
              </p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-muted/30 p-8 rounded-lg border">
          <h2 className="text-2xl font-bold mb-6" data-testid="heading-quick-actions">
            Quick Actions
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link 
              href="/admin/blog/new"
              className="flex items-start gap-4 p-4 bg-card hover:bg-accent rounded-lg border transition"
              data-testid="action-create-blog"
            >
              <PlusCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Create Blog Post</div>
                <div className="text-sm text-muted-foreground">
                  Write a new blog article
                </div>
              </div>
            </Link>
            <Link 
              href="/admin/google-reviews/sync"
              className="flex items-start gap-4 p-4 bg-card hover:bg-accent rounded-lg border transition"
              data-testid="action-sync-reviews"
            >
              <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Sync Google Reviews</div>
                <div className="text-sm text-muted-foreground">
                  Update reviews from Google
                </div>
              </div>
            </Link>
            <Link 
              href="/admin/customers/import"
              className="flex items-start gap-4 p-4 bg-card hover:bg-accent rounded-lg border transition"
              data-testid="action-import-customers"
            >
              <Upload className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">Import Customers</div>
                <div className="text-sm text-muted-foreground">
                  Upload ServiceTitan XLSX file
                </div>
              </div>
            </Link>
            <Link 
              href="/admin/campaigns/create"
              className="flex items-start gap-4 p-4 bg-card hover:bg-accent rounded-lg border transition"
              data-testid="action-new-campaign"
            >
              <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold mb-1">New Campaign</div>
                <div className="text-sm text-muted-foreground">
                  Start email or SMS campaign
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
