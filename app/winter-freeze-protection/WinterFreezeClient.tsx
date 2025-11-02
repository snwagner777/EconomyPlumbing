/**
 * Winter Freeze Protection Client Component
 */

'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface WinterFreezeClientProps {
  phoneConfig: PhoneConfig;
}

export default function WinterFreezeClient({ phoneConfig }: WinterFreezeClientProps) {
  return (
    <>
      <Header />
      
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
          <div className="bg-primary text-primary-foreground p-6 rounded-lg mb-8">
            <h1 className="text-3xl font-bold mb-2">Winter Freeze Protection</h1>
            <p className="text-lg">Protect your home from costly frozen pipe damage</p>
          </div>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Winter Preparation Checklist</h2>
            <div className="space-y-4">
              {[
                { task: 'Disconnect Garden Hoses', desc: 'Remove and drain all outdoor hoses to prevent pipe damage', critical: true },
                { task: 'Insulate Exposed Pipes', desc: 'Wrap pipes in unheated areas with foam insulation', critical: true },
                { task: 'Drain Sprinkler System', desc: 'Winterize irrigation to prevent freeze damage', critical: true },
                { task: 'Cover Outdoor Faucets', desc: 'Install insulated faucet covers on all exterior spigots', critical: true },
                { task: 'Know How to Drip Faucets', desc: 'During freezes, let faucets drip to prevent bursts', critical: true },
                { task: 'Locate Main Water Shutoff', desc: 'Know where your shutoff valve is for emergencies', critical: true },
                { task: 'Service Water Heater', desc: 'Flush and inspect for winter efficiency', critical: false },
                { task: 'Open Cabinet Doors During Freezes', desc: 'Allow warm air to circulate around pipes under sinks', critical: false },
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

          <section className="bg-destructive/10 border border-destructive p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">During a Freeze Warning</h2>
            <ul className="space-y-2">
              <li><strong>Let faucets drip:</strong> A slow drip keeps water moving through pipes</li>
              <li><strong>Open cabinet doors:</strong> Expose pipes to warm indoor air</li>
              <li><strong>Keep heat on:</strong> Never let interior temp drop below 55°F</li>
              <li><strong>Check outdoor faucets:</strong> Ensure covers are secure</li>
            </ul>
          </section>

          <section className="bg-muted/30 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold mb-4">What If a Pipe Freezes?</h2>
            <ol className="space-y-2 list-decimal pl-6">
              <li>Turn off water at main shutoff valve</li>
              <li>Open faucets to relieve pressure</li>
              <li>Call us immediately for emergency service</li>
              <li>Do NOT use open flame to thaw pipes</li>
            </ol>
          </section>

          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Frozen Pipe Emergency?</h2>
            <p className="text-lg mb-6">
              24/7 emergency service for frozen and burst pipes
            </p>
            <Button 
              variant="outline" 
              size="lg"
              className="bg-white text-primary border-white"
              asChild
            >
              <a href={phoneConfig.tel} className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                CALL NOW: {phoneConfig.display}
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
