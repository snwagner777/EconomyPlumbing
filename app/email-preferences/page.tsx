/**
 * Email Preference Center
 * 
 * Public page for managing email subscriptions (CAN-SPAM compliance)
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Email Preferences | Economy Plumbing Services',
  description: 'Manage your email subscription preferences',
  robots: 'noindex', // Don't index preference pages
};

type Props = {
  searchParams: Promise<{ token?: string }>;
};

async function getPreferences(token: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/email-preferences?token=${token}`,
    { cache: 'no-store' }
  );
  
  if (!res.ok) {
    return null;
  }
  
  return res.json();
}

export default async function EmailPreferencesPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Link</h1>
          <p className="text-muted-foreground">
            This email preference link is invalid or expired. Please use the link from your email.
          </p>
        </div>
      </div>
    );
  }

  const data = await getPreferences(token);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Not Found</h1>
          <p className="text-muted-foreground">
            We couldn't find your email preferences. The link may be expired.
          </p>
        </div>
      </div>
    );
  }

  const prefs = data.preferences;

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Email Preferences</h1>
          <p className="text-muted-foreground mb-8">
            Manage your email subscriptions for {prefs.email}
          </p>

          <form action="/api/email-preferences" method="POST" className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <input 
                  type="checkbox" 
                  name="reviewRequests" 
                  defaultChecked={prefs.reviewRequests}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">Review Requests</div>
                  <div className="text-sm text-muted-foreground">
                    Occasional requests to review our service
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <input 
                  type="checkbox" 
                  name="referralNurture" 
                  defaultChecked={prefs.referralNurture}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">Referral Program</div>
                  <div className="text-sm text-muted-foreground">
                    Information about our referral rewards program
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <input 
                  type="checkbox" 
                  name="quoteFollowup" 
                  defaultChecked={prefs.quoteFollowup}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">Quote Follow-ups</div>
                  <div className="text-sm text-muted-foreground">
                    Follow-up on estimates and quotes
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border rounded-lg cursor-pointer hover:bg-accent/50">
                <input 
                  type="checkbox" 
                  name="marketingEmails" 
                  defaultChecked={prefs.marketingEmails}
                  className="mt-1"
                />
                <div>
                  <div className="font-semibold">Marketing & Promotions</div>
                  <div className="text-sm text-muted-foreground">
                    Special offers, tips, and company updates
                  </div>
                </div>
              </label>
            </div>

            <div className="pt-6 border-t">
              <button 
                type="submit"
                className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Save Preferences
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Want to unsubscribe from all marketing emails?
            </p>
            <a 
              href={`/api/email-preferences/unsubscribe?token=${token}`}
              className="text-sm text-destructive hover:underline"
            >
              Unsubscribe from All Marketing Emails
            </a>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>
              You will continue to receive transactional emails related to your service appointments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
