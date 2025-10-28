/**
 * Backflow Testing & Prevention Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Backflow Testing Austin TX | Certified Backflow Prevention',
  description: 'Certified backflow testing and prevention in Austin. Annual testing, installation, repair. Licensed backflow testers. Call (512) 368-9159.',
  openGraph: {
    title: 'Backflow Testing Austin TX',
    description: 'Certified backflow testing and prevention services',
  },
};

export default function BackflowPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Backflow Testing & Prevention</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Certified backflow testing to protect your water supply
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Our Backflow Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Annual Backflow Testing',
                'Backflow Device Installation',
                'Backflow Repair & Replacement',
                'Certified Testing Reports',
                'City Compliance Certification',
                'Commercial & Residential',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">What is Backflow?</h2>
            <p className="mb-4">
              Backflow occurs when contaminated water flows backward into your clean water supply. This can happen due to back pressure or back siphonage.
            </p>
            <p>
              Backflow prevention devices protect your water supply from contamination. Texas law requires annual testing by a certified backflow tester.
            </p>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Backflow Testing?</h2>
            <p className="mb-6">
              Our certified testers provide fast, compliant testing and reporting
            </p>
            <a 
              href="tel:512-368-9159"
              data-testid="link-phone-backflow"
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
