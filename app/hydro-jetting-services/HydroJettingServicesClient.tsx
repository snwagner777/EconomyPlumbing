'use client';

import { CheckCircle, Droplets } from 'lucide-react';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface HydroJettingServicesClientProps {
  phoneConfig: PhoneConfig;
}

export default function HydroJettingServicesClient({ phoneConfig }: HydroJettingServicesClientProps) {
  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6" data-testid="heading-hydro-jetting">
            Hydro Jetting Services
          </h1>
          
          <p className="text-xl text-muted-foreground mb-12" data-testid="text-subtitle">
            High-pressure water jetting for stubborn clogs and complete pipe cleaning
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6" data-testid="heading-what-is">
              What is Hydro Jetting?
            </h2>
            <p className="text-muted-foreground mb-6" data-testid="text-description">
              Hydro jetting uses high-pressure water (up to 4,000 PSI) to completely clear drain and sewer lines. 
              Unlike snaking, which just punches a hole through clogs, hydro jetting thoroughly cleans pipe walls, 
              removing grease, scale, tree roots, and years of buildup.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Tree Root Removal',
                'Grease Buildup Clearing',
                'Scale and Mineral Deposits',
                'Main Sewer Line Cleaning',
                'Commercial Drain Maintenance',
                'Preventive Pipe Cleaning',
              ].map((service, idx) => (
                <div key={service} className="flex items-center gap-3" data-testid={`service-${idx}`}>
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4" data-testid="heading-when-needed">
              When You Need Hydro Jetting
            </h2>
            <ul className="space-y-2">
              {[
                'Recurring drain clogs that come back quickly',
                'Tree roots infiltrating sewer lines',
                'Grease buildup in commercial kitchens',
                'Slow drains throughout the house',
                'Before camera inspection or pipe lining',
                'Preventive maintenance for older pipes',
                'Multiple fixtures backing up at once',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2" data-testid={`need-${idx}`}>
                  <Droplets className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4" data-testid="heading-comparison">
              Hydro Jetting vs. Snaking
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-primary" data-testid="heading-hydro">
                  Hydro Jetting
                </h3>
                <ul className="space-y-2 text-sm">
                  {[
                    'Cleans entire pipe diameter',
                    'Removes all buildup and debris',
                    'Longer-lasting results',
                    'Effective on tree roots',
                    'Prevents future clogs',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2" data-testid={`hydro-benefit-${idx}`}>
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3" data-testid="heading-snaking">
                  Traditional Snaking
                </h3>
                <ul className="space-y-2 text-sm">
                  {[
                    'Punches hole through clog',
                    'Leaves buildup on pipe walls',
                    'Clogs may return sooner',
                    'Limited effectiveness on roots',
                    'Good for simple clogs',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2" data-testid={`snake-feature-${idx}`}>
                      <Droplets className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4" data-testid="heading-commercial">
              Commercial Hydro Jetting
            </h2>
            <p className="text-muted-foreground mb-4" data-testid="text-commercial-desc">
              Restaurants, hotels, and commercial facilities rely on hydro jetting for regular maintenance:
            </p>
            <ul className="space-y-2">
              {[
                'Monthly or quarterly preventive jetting',
                'Grease trap line maintenance',
                'Kitchen drain cleaning',
                'Main line clearing',
                'Emergency service available 24/7',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2" data-testid={`commercial-${idx}`}>
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-accent/20 border border-accent p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4" data-testid="heading-benefits">
              Benefits of Hydro Jetting
            </h2>
            <ul className="space-y-2">
              {[
                'Environmentally friendly (no harsh chemicals)',
                'Thorough cleaning extends pipe life',
                'Reduces frequency of future clogs',
                'Safe for all pipe materials when done properly',
                'Removes bacteria and odor-causing buildup',
                'Prepares pipes for camera inspection or repair',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2" data-testid={`benefit-${idx}`}>
                  <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4" data-testid="heading-cta">
              Need Hydro Jetting Service?
            </h2>
            <p className="mb-6" data-testid="text-cta-desc">
              Experienced technicians with professional hydro jetting equipment
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href={phoneConfig.tel}
                data-testid="link-phone-hydro-jetting"
                className="inline-block bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call: {phoneConfig.display}
              </a>
              <a 
                href="/contact"
                data-testid="link-contact-hydro-jetting"
                className="inline-block bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
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
