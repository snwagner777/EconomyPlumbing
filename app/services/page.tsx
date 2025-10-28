/**
 * All Services Page
 * 
 * Complete list of plumbing services
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Plumbing Services | Economy Plumbing Austin TX',
  description: 'Complete list of plumbing services from Economy Plumbing. Residential and commercial plumbing solutions in Austin and Central Texas.',
  openGraph: {
    title: 'All Plumbing Services - Economy Plumbing',
    description: 'Complete list of residential and commercial plumbing services',
  },
};

export default function AllServicesPage() {
  const services = [
    { title: 'Water Heater Services', href: '/water-heater-services', desc: 'Repair, installation, tankless systems' },
    { title: 'Drain Cleaning', href: '/drain-cleaning', desc: 'Hydro jetting, rooter service, camera inspection' },
    { title: 'Leak Repair', href: '/leak-repair', desc: 'Detection and repair of all types of leaks' },
    { title: 'Emergency Plumbing', href: '/emergency', desc: '24/7 emergency service for urgent issues' },
    { title: 'Commercial Plumbing', href: '/commercial-plumbing', desc: 'Business plumbing solutions' },
    { title: 'Backflow Testing', href: '/backflow', desc: 'Testing and certification services' },
  ];

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">All Plumbing Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Comprehensive plumbing solutions for homes and businesses in Austin and Central Texas
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service) => (
              <a
                key={service.href}
                href={service.href}
                className="bg-card p-8 rounded-lg hover:bg-accent transition"
              >
                <h2 className="text-2xl font-semibold mb-3">{service.title}</h2>
                <p className="text-muted-foreground mb-4">{service.desc}</p>
                <span className="text-primary">Learn more →</span>
              </a>
            ))}
          </div>

          <div className="mt-16 bg-primary text-primary-foreground p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">Need Plumbing Service?</h2>
            <p className="mb-6">
              Contact us today for fast, professional plumbing service
            </p>
            <div className="flex flex-wrap justify-center gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
}
