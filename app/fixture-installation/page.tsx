/**
 * Fixture Installation Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plumbing Fixture Installation Austin TX | Faucets, Toilets & More',
  description: 'Expert plumbing fixture installation in Austin. Faucets, toilets, sinks, showers, bathtubs. Professional installation guaranteed. Call (512) 368-9159.',
  openGraph: {
    title: 'Plumbing Fixture Installation Austin TX',
    description: 'Expert installation of faucets, toilets, sinks, showers and more',
  },
};

export default function FixtureInstallationPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Plumbing Fixture Installation</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Professional installation of all types of plumbing fixtures
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Fixtures We Install</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Kitchen Faucets',
                'Bathroom Faucets',
                'Toilets',
                'Sinks & Vanities',
                'Showers & Shower Heads',
                'Bathtubs',
                'Garbage Disposals',
                'Water Filtration Systems',
              ].map((fixture) => (
                <div key={fixture} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{fixture}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Professional Installation Matters</h2>
            <ul className="space-y-2">
              <li>• Prevent leaks and water damage</li>
              <li>• Ensure proper function and longevity</li>
              <li>• Maintain manufacturer warranties</li>
              <li>• Code-compliant installation</li>
              <li>• Save time and frustration</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Installation Process</h2>
            <ol className="space-y-2 list-decimal pl-6">
              <li>Remove old fixture safely</li>
              <li>Inspect existing plumbing connections</li>
              <li>Install new fixture to manufacturer specs</li>
              <li>Test for leaks and proper function</li>
              <li>Clean up and haul away old fixture</li>
            </ol>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Fixture Installation?</h2>
            <p className="mb-6">
              Professional installation of any plumbing fixture
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:512-368-9159"
                data-testid="link-phone-fixtures"
                className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: (512) 368-9159
              </a>
              <a 
                href="/contact"
                data-testid="link-contact-fixtures"
                className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Request Quote
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
