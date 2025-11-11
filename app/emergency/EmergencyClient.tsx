'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface EmergencyClientProps {
  phoneConfig: PhoneConfig;
}

export default function EmergencyClient({ phoneConfig }: EmergencyClientProps) {
  return (
    <>
      <Header austinPhone={phoneConfig} />
      <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-destructive text-destructive-foreground p-6 rounded-lg mb-8">
            <h1 className="text-3xl font-bold mb-2">24/7 Emergency Plumbing</h1>
            <p className="text-lg">Fast response when you need it most</p>
          </div>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Emergency Services</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Burst Pipe Repair',
                'Sewer Backup Cleanup',
                'Water Heater Failures',
                'Major Leaks',
                'Gas Line Emergencies',
                'Frozen Pipe Thawing',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">What Counts as an Emergency?</h2>
            <ul className="space-y-2">
              <li>• Burst or frozen pipes flooding your home</li>
              <li>• Sewer backup into home or building</li>
              <li>• No water throughout the house</li>
              <li>• Gas leak (also call gas company)</li>
              <li>• Water heater leaking heavily</li>
              <li>• Major leaks causing property damage</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Plumbing Emergency?</h2>
            <p className="text-lg mb-6">
              Available 24/7 including nights, weekends, and holidays
            </p>
            <a 
              href={phoneConfig.tel}
              className="inline-block bg-background text-foreground px-8 py-4 rounded-lg font-bold text-lg hover:opacity-90 transition"
            >
              CALL NOW: {phoneConfig.display}
            </a>
          </section>
        </div>
      </div>
    </div>
    <Footer />
    </>
  );
}
