/**
 * Round Rock Service Area Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Round Rock Plumber | Economy Plumbing Services TX',
  description: 'Trusted plumber in Round Rock TX. Water heaters, drain cleaning, leak repair, emergency service 24/7. Licensed & insured. Call (512) 368-9159.',
  openGraph: {
    title: 'Round Rock Plumber - Economy Plumbing',
    description: 'Professional plumbing services for Round Rock, TX',
  },
};

export default function RoundRockPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Plumber in Round Rock, TX</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Reliable plumbing services for Round Rock homes and businesses
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Round Rock Plumbing Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Water Heater Service',
                'Drain Cleaning',
                'Leak Repair',
                'Emergency Plumbing 24/7',
                'Commercial Plumbing',
                'Residential Plumbing',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Serving Round Rock</h2>
            <p className="mb-4">
              We serve all of Round Rock including downtown, Forest Creek, Teravista, 
              Walsh Ranch, and surrounding areas. Our plumbers know Round Rock and can 
              quickly respond to your plumbing needs.
            </p>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Round Rock Plumbing Service</h2>
            <p className="mb-6">
              Call us today for plumbing service in Round Rock
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:512-368-9159"
                data-testid="link-phone-round-rock"
                className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: (512) 368-9159
              </a>
              <a 
                href="/contact"
                data-testid="link-contact-round-rock"
                className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Request Service
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
