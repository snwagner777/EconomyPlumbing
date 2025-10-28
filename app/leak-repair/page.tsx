/**
 * Leak Repair Services Page
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leak Repair Austin TX | Fast Leak Detection & Repair | Economy Plumbing',
  description: 'Professional leak detection and repair in Austin. Slab leaks, pipe leaks, water heater leaks. Advanced leak detection technology. Call (512) 368-9159.',
  openGraph: {
    title: 'Leak Repair Austin TX',
    description: 'Professional leak detection and repair. Advanced technology to find and fix leaks fast.',
  },
};

export default function LeakRepairPage() {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Leak Detection & Repair</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Fast, accurate leak detection and professional repair services.
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Types of Leaks We Fix</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Slab Leaks',
                'Pipe Leaks',
                'Water Heater Leaks',
                'Toilet Leaks',
                'Faucet Leaks',
                'Hidden Leaks',
              ].map((leak) => (
                <div key={leak} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{leak}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Signs You Have a Leak</h2>
            <ul className="space-y-2">
              <li>• Unexplained water bill increases</li>
              <li>• Wet spots on walls, floors, or ceilings</li>
              <li>• Musty odors or mold growth</li>
              <li>• Sound of running water when nothing is on</li>
              <li>• Reduced water pressure</li>
              <li>• Warm spots on floor (slab leak)</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Suspect a Leak?</h2>
            <p className="mb-6">
              Early detection saves money. Call us for professional leak detection.
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
