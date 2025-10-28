/**
 * Commercial Plumbing Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commercial Plumbing Austin TX | Business Plumbing Experts',
  description: 'Professional commercial plumbing for Austin businesses. Restaurants, offices, retail, property management. 24/7 emergency service. Call (512) 368-9159.',
  openGraph: {
    title: 'Commercial Plumbing Austin TX',
    description: 'Professional commercial plumbing for Austin businesses. 24/7 emergency service.',
  },
};

export default function CommercialPlumbingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Commercial Plumbing Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Professional plumbing solutions for Austin businesses
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Industries We Serve</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Restaurants', href: '/commercial/restaurants' },
                { title: 'Office Buildings', href: '/commercial/office-buildings' },
                { title: 'Retail Stores', href: '/commercial/retail' },
                { title: 'Property Management', href: '/commercial/property-management' },
                { title: 'Medical Facilities', href: '/commercial-plumbing' },
                { title: 'Schools & Universities', href: '/commercial-plumbing' },
              ].map((industry) => (
                <a
                  key={industry.title}
                  href={industry.href}
                  className="bg-card p-6 rounded-lg hover:bg-accent transition"
                >
                  <h3 className="font-semibold">{industry.title}</h3>
                </a>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Commercial Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Emergency Plumbing Repair',
                'Grease Trap Service',
                'Backflow Testing & Certification',
                'Commercial Water Heaters',
                'Drain & Sewer Cleaning',
                'Pipe Repair & Replacement',
                'Fixture Installation',
                'Preventive Maintenance Plans',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Businesses Choose Us</h2>
            <ul className="space-y-2">
              <li>• 24/7 emergency response to minimize downtime</li>
              <li>• After-hours and weekend service available</li>
              <li>• Preventive maintenance plans to reduce costs</li>
              <li>• Licensed, insured commercial plumbers</li>
              <li>• Code compliance expertise</li>
              <li>• Fast, professional service</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Commercial Plumbing Service?</h2>
            <p className="mb-6">
              Contact us for a customized service plan for your business
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:512-368-9159"
                data-testid="link-phone-commercial"
                className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: (512) 368-9159
              </a>
              <a 
                href="/contact"
                data-testid="link-contact-commercial"
                className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Request Service Plan
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
