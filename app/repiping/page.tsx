/**
 * Whole Home Repiping Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Whole Home Repiping Austin TX | Copper & PEX Installation',
  description: 'Complete home repiping services in Austin. Replace old galvanized or polybutylene pipes with copper or PEX. Financing available. Call (512) 368-9159.',
  openGraph: {
    title: 'Whole Home Repiping Austin TX',
    description: 'Complete home repiping services. Replace old pipes with modern materials.',
  },
};

export default function RepipingPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Whole Home Repiping</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Replace old, failing pipes with modern, reliable plumbing
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Signs You Need Repiping</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Frequent pipe leaks',
                'Low water pressure throughout home',
                'Discolored or rusty water',
                'Galvanized or polybutylene pipes',
                'Home built before 1980',
                'Planning major renovation',
              ].map((sign) => (
                <div key={sign} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{sign}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Pipe Material Options</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Copper Pipes</h3>
                <ul className="text-sm space-y-2">
                  <li>• Long-lasting (50+ years)</li>
                  <li>• Heat and fire resistant</li>
                  <li>• Recyclable and eco-friendly</li>
                  <li>• Traditional, proven reliability</li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg">
                <h3 className="font-semibold mb-3">PEX Pipes</h3>
                <ul className="text-sm space-y-2">
                  <li>• Cost-effective solution</li>
                  <li>• Flexible, easy installation</li>
                  <li>• Freeze-resistant</li>
                  <li>• Faster installation time</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Repiping Process</h2>
            <ol className="space-y-2 list-decimal pl-6">
              <li>Free in-home inspection and estimate</li>
              <li>Detailed plan to minimize disruption</li>
              <li>Expert installation with minimal wall damage</li>
              <li>Professional drywall repair and paint touch-up</li>
              <li>Final inspection and testing</li>
            </ol>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Repiping Service?</h2>
            <p className="mb-6">
              Get a free estimate for whole home repiping
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:512-368-9159"
                data-testid="link-phone-repiping"
                className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: (512) 368-9159
              </a>
              <a 
                href="/contact"
                data-testid="link-contact-repiping"
                className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Request Free Estimate
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
