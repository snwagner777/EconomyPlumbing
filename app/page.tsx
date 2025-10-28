/**
 * Home Page
 * 
 * Main landing page for Economy Plumbing Services
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Economy Plumbing Services | Plumber Austin TX & Marble Falls',
  description: 'Trusted plumber in Austin TX and Marble Falls. Water heaters, drain cleaning, leak repair, emergency service 24/7. Licensed & insured. Call (512) 368-9159.',
  openGraph: {
    title: 'Economy Plumbing Services - Austin TX Plumber',
    description: 'Trusted plumber in Austin and Marble Falls. Water heaters, drains, leaks, 24/7 emergency service.',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Austin's Trusted Plumber
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Professional plumbing services for your home or business. 
            Licensed, insured, and available 24/7 for emergencies.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="tel:512-368-9159"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition"
            >
              Call: (512) 368-9159
            </a>
            <a 
              href="/contact"
              className="bg-accent text-accent-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition"
            >
              Request Quote
            </a>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { title: 'Water Heaters', href: '/water-heater-services', desc: 'Repair, installation & maintenance' },
              { title: 'Drain Cleaning', href: '/drain-cleaning', desc: 'Clear clogs fast with hydro jetting' },
              { title: 'Leak Repair', href: '/leak-repair', desc: 'Advanced leak detection & repair' },
              { title: 'Emergency Service', href: '/emergency', desc: 'Available 24/7 for emergencies' },
              { title: 'Commercial Plumbing', href: '/commercial-plumbing', desc: 'Solutions for businesses' },
              { title: 'VIP Membership', href: '/vip-membership', desc: 'Priority service & discounts' },
            ].map((service) => (
              <a
                key={service.href}
                href={service.href}
                className="bg-card p-6 rounded-lg hover:bg-accent transition"
              >
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-muted/30 py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Economy Plumbing</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: 'Licensed & Insured', desc: 'Fully licensed plumbers' },
              { title: '24/7 Emergency', desc: 'Available when you need us' },
              { title: 'Upfront Pricing', desc: 'No hidden fees' },
              { title: 'Satisfaction Guaranteed', desc: '100% guaranteed work' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">Need Plumbing Service?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Call us today or request a free quote online
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="tel:512-368-9159"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition"
            >
              Call: (512) 368-9159
            </a>
            <a 
              href="/contact"
              className="bg-accent text-accent-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:opacity-90 transition"
            >
              Request Free Quote
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
