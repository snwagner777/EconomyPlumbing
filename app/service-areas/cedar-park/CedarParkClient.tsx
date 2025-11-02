'use client';

import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface CedarParkClientProps {
  phoneConfig: PhoneConfig;
}

export default function CedarParkClient({ phoneConfig }: CedarParkClientProps) {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Plumber in Cedar Park, TX</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Your trusted local plumber serving Cedar Park and surrounding areas
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Services in Cedar Park</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Water Heater Repair & Installation',
                'Drain Cleaning & Hydro Jetting',
                'Leak Detection & Repair',
                '24/7 Emergency Plumbing',
                'Sewer Line Services',
                'Fixture Installation & Repair',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Serving Cedar Park Neighborhoods</h2>
            <p className="mb-4">
              We proudly serve all Cedar Park neighborhoods including Buttercup Creek, Twin Creeks, 
              Carriage Hills, Anderson Mill, and more. As local plumbers, we know Cedar Park's unique 
              plumbing needs and can respond quickly to emergencies.
            </p>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need a Plumber in Cedar Park?</h2>
            <p className="mb-6">
              Fast, reliable service for Cedar Park residents
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href={phoneConfig.tel}
                data-testid="link-phone-cedar-park"
                className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: {phoneConfig.display}
              </a>
              <a 
                href="/contact"
                data-testid="link-contact-cedar-park"
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
