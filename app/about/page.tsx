/**
 * About Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Economy Plumbing Services | Austin TX Plumbers',
  description: 'Learn about Economy Plumbing Services - Austin\'s trusted plumbing company. Family-owned, licensed plumbers serving Central Texas since [year].',
  openGraph: {
    title: 'About Economy Plumbing Services',
    description: 'Austin\'s trusted plumbing company. Family-owned, licensed plumbers serving Central Texas.',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">About Economy Plumbing Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Austin's trusted plumbing company, serving Central Texas with excellence
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="mb-4">
              Economy Plumbing Services has been proudly serving the Austin area and Central Texas communities with professional plumbing solutions. As a family-owned business, we understand the importance of treating every customer like family.
            </p>
            <p>
              Our team of licensed, experienced plumbers is dedicated to providing honest, reliable service at fair prices. We believe in doing the job right the first time and standing behind our work with comprehensive warranties.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Why Choose Us</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Licensed & Insured', desc: 'Fully licensed plumbers with comprehensive insurance' },
                { title: 'Upfront Pricing', desc: 'Clear quotes before we start any work' },
                { title: '24/7 Emergency Service', desc: 'Available when you need us most' },
                { title: 'Satisfaction Guaranteed', desc: '100% satisfaction or we make it right' },
              ].map((item) => (
                <div key={item.title} className="bg-card p-6 rounded-lg">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Service Areas</h2>
            <p className="mb-4">
              We proudly serve Austin and surrounding communities including Cedar Park, Round Rock, Georgetown, Pflugerville, Leander, Liberty Hill, and the Marble Falls area.
            </p>
            <a href="/service-areas" className="text-primary hover:underline">
              View all service areas →
            </a>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Ready to Experience the Difference?</h2>
            <p className="mb-6">
              Contact us today for all your plumbing needs
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
                Contact Us
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
