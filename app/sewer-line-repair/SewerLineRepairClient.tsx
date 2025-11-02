'use client';

import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface SewerLineRepairClientProps {
  phoneConfig: PhoneConfig;
}

export default function SewerLineRepairClient({ phoneConfig }: SewerLineRepairClientProps) {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Sewer Line Repair & Replacement</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Advanced sewer line solutions for Austin homes and businesses
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Sewer Line Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Camera Sewer Inspection',
                'Trenchless Sewer Repair',
                'Traditional Excavation',
                'Root Removal',
                'Pipe Lining',
                'Complete Line Replacement',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Signs You Need Sewer Line Repair</h2>
            <ul className="space-y-2">
              <li>• Multiple drain backups throughout your home</li>
              <li>• Sewage odors inside or outside your home</li>
              <li>• Wet spots or extra green grass in your yard</li>
              <li>• Gurgling sounds from drains or toilets</li>
              <li>• Slow drains throughout the house</li>
              <li>• Foundation cracks or settling</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Trenchless vs. Traditional Repair</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Trenchless Repair</h3>
                <ul className="text-sm space-y-2">
                  <li>• Minimal yard damage</li>
                  <li>• Faster completion</li>
                  <li>• Often more cost-effective</li>
                  <li>• Long-lasting pipe lining</li>
                </ul>
              </div>
              <div className="bg-card p-6 rounded-lg">
                <h3 className="font-semibold mb-3">Traditional Excavation</h3>
                <ul className="text-sm space-y-2">
                  <li>• Complete pipe replacement</li>
                  <li>• Best for severely damaged lines</li>
                  <li>• Allows full inspection</li>
                  <li>• Long-term solution</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Sewer Line Problems?</h2>
            <p className="mb-6">
              Get a free camera inspection and repair estimate
            </p>
            <a 
              href={phoneConfig.tel}
              data-testid="link-phone-sewer"
              className="inline-block bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
            >
              Call: {phoneConfig.display}
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
