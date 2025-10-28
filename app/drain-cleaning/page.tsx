/**
 * Drain Cleaning Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drain Cleaning Austin TX | Professional Drain Service | Economy Plumbing',
  description: 'Professional drain cleaning in Austin. Hydro jetting, rooter service, camera inspection. Clear stubborn clogs fast. 24/7 emergency service. Call (512) 368-9159.',
  openGraph: {
    title: 'Drain Cleaning Austin TX',
    description: 'Professional drain cleaning services. Clear stubborn clogs fast with hydro jetting.',
  },
};

export default function DrainCleaningPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Drain Cleaning Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Professional drain cleaning to clear even the toughest clogs.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">What We Clean</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Kitchen Sink Drains',
                'Bathroom Drains',
                'Main Sewer Lines',
                'Floor Drains',
                'Storm Drains',
                'Commercial Drains',
              ].map((drain) => (
                <div key={drain} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{drain}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Methods</h2>
            <ul className="space-y-3">
              <li><strong>Hydro Jetting:</strong> High-pressure water clears stubborn blockages</li>
              <li><strong>Rooter Service:</strong> Remove tree roots from sewer lines</li>
              <li><strong>Camera Inspection:</strong> See exactly what's causing the clog</li>
              <li><strong>Preventive Maintenance:</strong> Keep drains flowing smoothly</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Clogged Drain Emergency?</h2>
            <p className="mb-6">
              We're available 24/7 for drain emergencies
            </p>
            <a 
              href="tel:512-368-9159"
              className="inline-block bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Call Now: (512) 368-9159
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
