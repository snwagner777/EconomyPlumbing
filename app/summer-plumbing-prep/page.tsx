/**
 * Summer Plumbing Prep Page
 */

'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { usePhoneConfig } from '@/hooks/usePhoneConfig';

export default function SummerPlumbingPrepPage() {
  const phoneConfig = usePhoneConfig();
  
  return (
    <>
      <Header />
      
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Summer Plumbing Prep Checklist</h1>
          
          <p className="text-xl text-muted-foreground mb-12">
            Get your home's plumbing ready for the hot Texas summer
          </p>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Essential Summer Checklist</h2>
            <div className="space-y-4">
              {[
                { task: 'Check AC Condensate Drain', desc: 'Ensure drain line is clear to prevent overflow', critical: true },
                { task: 'Service Water Heater', desc: 'Flush sediment and check efficiency before high demand', critical: true },
                { task: 'Inspect Sprinkler System', desc: 'Check for leaks and adjust for efficient watering', critical: true },
                { task: 'Test Outdoor Faucets & Hoses', desc: 'Check for leaks and replace damaged hoses', critical: true },
                { task: 'Inspect Sewer Line', desc: 'Tree roots grow aggressively in summer', critical: true },
                { task: 'Check Washing Machine Hoses', desc: 'Inspect for cracks or bulges', critical: false },
                { task: 'Test Toilets for Leaks', desc: 'Add food coloring to tank to check for leaks', critical: false },
                { task: 'Clean Garbage Disposal', desc: 'Deep clean with ice and citrus', critical: false },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-lg border ${item.critical ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="mt-1" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        {item.task}
                        {item.critical && <span className="ml-2 text-xs text-primary">CRITICAL</span>}
                      </h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Summer Prep Matters</h2>
            <ul className="space-y-2">
              <li>• Higher water usage puts stress on plumbing</li>
              <li>• AC systems can cause water damage if drains clog</li>
              <li>• Summer storms can overwhelm drainage systems</li>
              <li>• Tree roots grow aggressively in summer heat</li>
            </ul>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Need Help with Summer Prep?</h2>
            <p className="mb-6">
              Our technicians can inspect and prepare your plumbing for summer
            </p>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white text-primary border-white"
              asChild
            >
              <a href={phoneConfig.tel} className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call: {phoneConfig.display}
              </a>
            </Button>
          </section>
        </div>
      </div>
    </div>
    
    <Footer />
    </>
  );
}
