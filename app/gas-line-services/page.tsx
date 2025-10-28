/**
 * Gas Line Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gas Line Services Austin TX | Installation & Repair',
  description: 'Licensed gas line installation, repair and inspection in Austin. Water heaters, stoves, fireplaces, pool heaters. Safety guaranteed. Call (512) 368-9159.',
  openGraph: {
    title: 'Gas Line Services Austin TX',
    description: 'Licensed gas line installation, repair and safety inspections',
  },
};

export default function GasLineServicesPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Gas Line Services</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Licensed, safe gas line installation and repair
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Gas Line Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'New Gas Line Installation',
                'Gas Line Repair',
                'Gas Leak Detection',
                'Gas Line Pressure Testing',
                'Appliance Gas Connections',
                'Gas Line Safety Inspections',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Common Gas Line Projects</h2>
            <ul className="space-y-2">
              <li>• Gas water heater installation</li>
              <li>• Gas stove and range hookup</li>
              <li>• Gas fireplace installation</li>
              <li>• Pool heater gas lines</li>
              <li>• Outdoor kitchen gas connections</li>
              <li>• Generator gas line installation</li>
            </ul>
          </section>

          <section className="bg-destructive/10 border border-destructive p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Gas Leak Warning Signs</h2>
            <ul className="space-y-2">
              <li>• Rotten egg smell (added to natural gas)</li>
              <li>• Hissing sound near gas lines</li>
              <li>• Dead plants near gas lines outside</li>
              <li>• Physical symptoms (headache, dizziness, nausea)</li>
            </ul>
            <p className="mt-4 font-semibold">
              If you suspect a gas leak: Leave immediately, call 911 and the gas company, then call us for repairs.
            </p>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Choose Licensed Gas Line Service</h2>
            <ul className="space-y-2">
              <li>• Safety is paramount with gas work</li>
              <li>• Code compliance required by law</li>
              <li>• Proper permits and inspections</li>
              <li>• Insurance coverage for your protection</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Gas Line Service?</h2>
            <p className="mb-6">
              Licensed professionals for safe, code-compliant gas line work
            </p>
            <a 
              href="tel:512-368-9159"
              data-testid="link-phone-gas"
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
