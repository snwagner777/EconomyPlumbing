/**
 * SMS Marketing Signup Page
 */

import type { Metadata } from 'next';

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
          <h1 className="text-4xl font-bold mb-6 text-center">Join Our SMS List</h1>
          
          <p className="text-xl text-muted-foreground mb-12 text-center">
            Get exclusive deals, maintenance reminders, and service updates via text
          </p>

          <section className="bg-card p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">Sign Up for Text Alerts</h2>
            
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full px-4 py-3 border rounded-lg text-lg"
                  placeholder="(512) 555-1234"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>

              <div className="bg-muted/30 p-4 rounded-lg text-sm">
                <p className="mb-2">
                  By signing up, you agree to receive text messages from Economy Plumbing Services. 
                  Message and data rates may apply. Message frequency varies.
                </p>
                <p>
                  Reply STOP to unsubscribe or HELP for help at any time.
                </p>
              </div>

              <button 
                type="submit"
                className="w-full bg-primary text-primary-foreground px-6 py-4 rounded-lg font-semibold text-lg hover:opacity-90 transition"
              >
                Sign Me Up
              </button>
            </form>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-center">What You'll Receive</h2>
            <div className="grid gap-4">
              {[
                { title: 'Exclusive Deals', desc: 'Special offers and discounts for SMS subscribers' },
                { title: 'Maintenance Reminders', desc: 'Timely reminders for water heater flushing and seasonal prep' },
                { title: 'Appointment Updates', desc: 'Service confirmations and technician arrival notifications' },
                { title: 'Emergency Alerts', desc: 'Important notices about freeze warnings and water issues' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 items-start">
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
