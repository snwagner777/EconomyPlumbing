'use client';

import type { PhoneConfig } from '@/server/lib/phoneNumbers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface VIPMembershipClientProps {
  phoneConfig: PhoneConfig;
}

export default function VIPMembershipClient({ phoneConfig }: VIPMembershipClientProps) {
  return (
    <>
      <Header austinPhone={phoneConfig} />
      <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            VIP Membership Program
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Priority service, exclusive discounts, and peace of mind for your home's plumbing
          </p>
          <div className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-lg">
            <span className="text-sm uppercase tracking-wide">Starting at</span>
            <div className="text-4xl font-bold">$299/year</div>
          </div>
        </div>

        {/* Benefits */}
        <div className="max-w-5xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Membership Benefits</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: 'Priority Scheduling',
                description: 'Skip the line with priority booking for all service calls',
                icon: '⭐',
              },
              {
                title: '15% Discount',
                description: 'Save 15% on all plumbing services and repairs',
                icon: '💰',
              },
              {
                title: 'Annual Inspection',
                description: 'Comprehensive yearly plumbing system inspection included',
                icon: '🔍',
              },
              {
                title: 'No Overtime Charges',
                description: 'Standard rates apply even for evening and weekend calls',
                icon: '⏰',
              },
              {
                title: 'Extended Warranty',
                description: '2-year warranty on all parts and labor',
                icon: '🛡️',
              },
              {
                title: '24/7 Support',
                description: 'Dedicated member support line for emergencies',
                icon: '📞',
              },
            ].map((benefit, i) => (
              <div key={i} className="flex gap-4 p-6 bg-card rounded-lg">
                <div className="text-4xl">{benefit.icon}</div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* What's Included */}
        <div className="max-w-4xl mx-auto mb-16 bg-muted/30 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-6">Annual Inspection Includes:</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Water heater inspection and flush',
              'Drain cleaning and maintenance',
              'Fixture inspection and adjustment',
              'Leak detection and prevention check',
              'Water pressure testing',
              'Sewer line camera inspection',
              'Safety valve testing',
              'Complete system evaluation report',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-primary">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-primary text-primary-foreground p-12 rounded-lg">
            <h2 className="text-3xl font-bold mb-4">Ready to Join?</h2>
            <p className="text-xl mb-8 opacity-90">
              Protect your home and save money with VIP membership
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="/membership-benefits"
                className="inline-block bg-background text-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                data-testid="button-sign-up-now"
              >
                Sign Up Now
              </a>
              <a 
                href={phoneConfig.tel}
                className="inline-block bg-accent text-accent-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition"
                data-testid="button-call-to-enroll"
              >
                Call: {phoneConfig.display}
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I cancel my membership?',
                a: 'Yes, you can cancel anytime with 30 days notice. Annual memberships are non-refundable but will remain active until expiration.',
              },
              {
                q: 'Are parts and materials included?',
                a: 'Members receive 15% off all parts and materials. The membership includes labor for the annual inspection.',
              },
              {
                q: 'What areas do you serve?',
                a: 'VIP membership is available to all customers in our service areas. Check our service areas page for details.',
              },
            ].map((faq, i) => (
              <div key={i} className="border-b pb-6">
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
