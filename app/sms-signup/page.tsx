/**
 * SMS Marketing Signup Page
 */

import type { Metadata } from 'next';
import { SMSForm } from './sms-form';

export const metadata: Metadata = {
  title: 'SMS Alerts Signup | Economy Plumbing Text Notifications',
  description: 'Sign up for SMS alerts from Economy Plumbing. Get exclusive deals, maintenance reminders, and appointment updates via text. Unsubscribe anytime.',
  openGraph: {
    title: 'SMS Alerts - Economy Plumbing',
    description: 'Get exclusive deals and appointment updates via text',
  },
};

export default function SMSSignupPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center" data-testid="heading-sms-signup">
            Join Our SMS List
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Get exclusive deals, maintenance reminders, and service updates via text
          </p>

          <section className="bg-card p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">Sign Up for Text Alerts</h2>
            <SMSForm />
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">What You'll Receive</h2>
            <div className="grid gap-4">
              {[
                { id: 'deals', title: 'Exclusive Deals', desc: 'Special offers and discounts for SMS subscribers' },
                { id: 'reminders', title: 'Maintenance Reminders', desc: 'Timely reminders for water heater flushing and seasonal prep' },
                { id: 'updates', title: 'Appointment Updates', desc: 'Service confirmations and technician arrival notifications' },
                { id: 'alerts', title: 'Emergency Alerts', desc: 'Important notices about freeze warnings and water issues' },
              ].map((item) => (
                <div key={item.id} className="flex gap-4 items-start" data-testid={`benefit-${item.id}`}>
                  <span className="text-primary text-2xl">✓</span>
                  <div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg text-center">
            <h2 className="text-xl font-semibold mb-4">Questions About SMS Alerts?</h2>
            <p className="mb-6 text-muted-foreground">
              Contact us for more information
            </p>
            <a 
              href="tel:512-368-9159"
              data-testid="link-phone-sms"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Call: (512) 368-9159
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
