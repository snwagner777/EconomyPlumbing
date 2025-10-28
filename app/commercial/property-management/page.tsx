/**
 * Property Management Plumbing Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Property Management Plumbing Services Austin TX | Multi-Unit Experts',
  description: 'Expert plumbing for Austin property managers. Multi-property service plans, 24/7 tenant support, preventive maintenance. Reduce costs and keep tenants happy!',
  openGraph: {
    title: 'Property Management Plumbing Services Austin TX',
    description: 'Expert plumbing for property managers. Multi-property plans, 24/7 tenant support.',
  },
};

export default function PropertyManagementPlumbingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Property Management Plumbing Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Comprehensive plumbing solutions for property managers and multi-unit buildings
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Property Management Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Multi-Property Service Plans',
                '24/7 Tenant Emergency Response',
                'Preventive Maintenance Programs',
                'Turnover Plumbing Services',
                'Water Heater Management',
                'Leak Detection & Repair',
                'Sewer Line Inspections',
                'Code Compliance Consulting',
              ].map((service) => (
                <div key={service} className="flex items-start gap-3">
                  <span className="text-primary mt-1">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Benefits for Property Managers</h2>
            <ul className="space-y-3">
              <li><strong>Reduce Maintenance Costs:</strong> Preventive care is cheaper than emergency repairs</li>
              <li><strong>Happy Tenants:</strong> Fast response times lead to higher tenant satisfaction</li>
              <li><strong>Priority Scheduling:</strong> Property management clients get priority service</li>
              <li><strong>Transparent Pricing:</strong> Clear quotes and consistent pricing across properties</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Property Management Solutions</h2>
            <p className="mb-6">
              Let's discuss a service plan for your properties
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
                Request Portfolio Quote
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
