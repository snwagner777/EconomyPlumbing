/**
 * Office Building Plumbing Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Office Building Plumbing Services Austin TX | Commercial Experts',
  description: 'Professional office building plumbing in Austin. Multi-floor systems, restroom facilities, emergency response. Keep your tenants comfortable and productive!',
  openGraph: {
    title: 'Office Building Plumbing Services Austin TX',
    description: 'Professional office building plumbing. Multi-floor systems, emergency response.',
  },
};

export default function OfficeBuildingPlumbingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Office Building Plumbing Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Professional plumbing solutions for office buildings and commercial spaces
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Office Building Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Multi-Floor Plumbing Systems',
                'Restroom Facility Management',
                'Break Room & Kitchen Plumbing',
                'Commercial Water Heaters',
                'Backflow Testing & Certification',
                'Pipe Leak Detection',
                'Emergency Shutoff Systems',
                'Preventive Maintenance Programs',
              ].map((service) => (
                <div key={service} className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Office Buildings Choose Us</h2>
            <ul className="space-y-2">
              <li>• Minimal disruption to business operations</li>
              <li>• After-hours and weekend service available</li>
              <li>• Comprehensive maintenance plans</li>
              <li>• Fast emergency response</li>
              <li>• Licensed and fully insured</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Commercial Plumbing Service?</h2>
            <p className="mb-6">
              Contact us for office building plumbing solutions
            </p>
            <a 
              href="tel:512-368-9159"
              className="inline-block bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Call: (512) 368-9159
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
