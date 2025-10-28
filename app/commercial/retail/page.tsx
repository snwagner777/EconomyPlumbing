/**
 * Retail Store Plumbing Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Retail Store Plumbing Services Austin TX | Minimize Downtime',
  description: 'Expert retail plumbing for Austin stores. Customer restroom maintenance, emergency repairs, ADA compliance. Keep your store open and customers happy!',
  openGraph: {
    title: 'Retail Store Plumbing Services Austin TX',
    description: 'Expert retail plumbing. Restroom maintenance, emergency repairs, ADA compliance.',
  },
};

export default function RetailPlumbingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Retail Store Plumbing Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Keep your store running smoothly with professional retail plumbing services
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Retail Plumbing Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Customer Restroom Maintenance',
                'Emergency Leak Repairs',
                'Backflow Prevention',
                'Water Heater Service',
                'Drain Line Maintenance',
                'Fixture Upgrades',
                'ADA Compliance',
                'Preventive Maintenance Plans',
              ].map((service) => (
                <div key={service} className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Retail Stores Trust Us</h2>
            <ul className="space-y-2">
              <li>• Fast response to minimize downtime</li>
              <li>• Work around your business hours</li>
              <li>• Clean, professional service</li>
              <li>• Prevent customer complaints with well-maintained facilities</li>
              <li>• Reduce water bills with efficient fixtures</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Retail Plumbing Service</h2>
            <p className="mb-6">
              Keep your store operational and customers satisfied
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
