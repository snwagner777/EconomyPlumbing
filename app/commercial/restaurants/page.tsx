/**
 * Restaurant Plumbing Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Restaurant Plumbing Services Austin TX | Commercial Kitchen Experts',
  description: 'Expert restaurant plumbing for Austin kitchens. Grease traps, emergency drain clearing, commercial water heaters, gas lines. 24/7 service. Health inspection ready!',
  openGraph: {
    title: 'Restaurant Plumbing Services Austin TX',
    description: 'Expert restaurant plumbing. Grease traps, emergency drain clearing, 24/7 service.',
  },
};

export default function RestaurantPlumbingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Restaurant Plumbing Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Keep your kitchen running with expert commercial plumbing for restaurants
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Restaurant Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Grease Trap Installation & Maintenance',
                'Commercial Kitchen Plumbing',
                'Emergency Drain Clearing',
                'Water Heater Systems',
                'Backflow Prevention',
                'Gas Line Installation & Repair',
                'Ice Machine Plumbing',
                'ADA-Compliant Restrooms',
              ].map((service) => (
                <div key={service} className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Common Restaurant Issues We Solve</h2>
            <ul className="space-y-3">
              <li><strong>Failed Health Inspection:</strong> Emergency grease trap service and drain repairs</li>
              <li><strong>Kitchen Flooding During Rush:</strong> 24/7 emergency response</li>
              <li><strong>No Hot Water:</strong> Commercial water heater repair/replacement same-day</li>
              <li><strong>Recurring Drain Clogs:</strong> Preventive maintenance and camera inspections</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Restaurant Plumbing Emergency?</h2>
            <p className="mb-6">
              24/7 service to keep your kitchen operational
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
