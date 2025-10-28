/**
 * Water Heater Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Water Heater Services Austin TX | Repair & Installation | Economy Plumbing',
  description: 'Expert water heater repair, installation & maintenance in Austin. Tankless, gas & electric. Same-day service. Licensed plumbers. Call (512) 368-9159.',
  openGraph: {
    title: 'Water Heater Services Austin TX',
    description: 'Expert water heater repair, installation & maintenance. Same-day service available.',
  },
};

export default function WaterHeaterServicesPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Water Heater Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Expert water heater repair, installation, and maintenance for Austin homes and businesses.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Our Water Heater Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Water Heater Repair',
                'New Installation',
                'Tankless Water Heaters',
                'Gas & Electric Units',
                'Emergency Service',
                'Maintenance & Flushing',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Water Heater Service?</h2>
            <p className="mb-6">
              Call us now for fast, reliable water heater service
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:512-368-9159"
                className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: (512) 368-9159
              </a>
              <a 
                href="/contact"
                className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Request Quote
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
