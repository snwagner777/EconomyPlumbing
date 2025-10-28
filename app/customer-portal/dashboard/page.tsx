/**
 * Customer Portal - Dashboard
 * 
 * Main dashboard after login showing account overview
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Dashboard | Customer Portal',
};

async function getCustomerData() {
  const session = await getSession();
  
  if (!session.customerPortalAuth) {
    return null;
  }

  // Fetch customer data (cookies forwarded automatically for same-origin requests)
  const [accountRes, jobsRes, membershipsRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/customer-portal/account`, {
      cache: 'no-store',
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/customer-portal/jobs`, {
      cache: 'no-store',
    }),
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/customer-portal/memberships`, {
      cache: 'no-store',
    }),
  ]);

  const account = await accountRes.json().catch(() => null);
  const jobs = await jobsRes.json().catch(() => ({ jobs: [] }));
  const memberships = await membershipsRes.json().catch(() => ({ memberships: [] }));

  return { account, jobs, memberships };
}

export default async function CustomerDashboardPage() {
  const session = await getSession();
  
  if (!session.customerPortalAuth) {
    redirect('/customer-portal');
  }

  const data = await getCustomerData();

  if (!data) {
    redirect('/customer-portal');
  }

  const { account, jobs, memberships } = data;
  const customer = account?.customer;

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome, {customer?.name}</h1>
              <p className="text-muted-foreground">Customer ID: #{customer?.id}</p>
            </div>
            <a 
              href="/api/auth/logout" 
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Logout
            </a>
          </div>

          {/* Account Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-sm text-muted-foreground mb-2">Account Balance</h3>
              <p className="text-2xl font-bold">
                ${(customer?.balance || 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-sm text-muted-foreground mb-2">Total Jobs</h3>
              <p className="text-2xl font-bold">{customer?.jobCount || 0}</p>
            </div>
            <div className="bg-card p-6 rounded-lg">
              <h3 className="text-sm text-muted-foreground mb-2">Lifetime Value</h3>
              <p className="text-2xl font-bold">
                ${(customer?.lifetimeValue || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Membership Status */}
          {memberships.hasActiveMembership && (
            <div className="bg-primary/10 border border-primary p-6 rounded-lg mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">VIP Member</h3>
                  <p className="text-sm text-muted-foreground">
                    Your membership is active
                  </p>
                </div>
                <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold">
                  Active
                </span>
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Recent Service History</h2>
            {jobs.jobs && jobs.jobs.length > 0 ? (
              <div className="space-y-4">
                {jobs.jobs.slice(0, 5).map((job: any) => (
                  <div key={job.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{job.description || 'Service Call'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(job.completedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">
                        ${(job.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    {job.serviceType && (
                      <p className="text-sm text-muted-foreground">{job.serviceType}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No service history yet
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-8 bg-muted/30 p-6 rounded-lg">
            <h3 className="font-semibold mb-4">Need Service?</h3>
            <p className="text-muted-foreground mb-4">
              Contact us for scheduling, questions, or emergency service
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:555-555-5555"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition"
              >
                Call: (555) 555-5555
              </a>
              <a 
                href="/contact"
                className="bg-accent text-accent-foreground px-6 py-2 rounded-lg hover:opacity-90 transition"
              >
                Contact Form
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
