'use client';

/**
 * Water Heater Cost Calculator Client Component
 * 
 * Interactive calculator for water heater installation costs
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface WaterHeaterCalculatorClientProps {
  phoneConfig: PhoneConfig;
}

export default function WaterHeaterCalculatorClient({ phoneConfig }: WaterHeaterCalculatorClientProps) {
  const [heaterType, setHeaterType] = useState<string>('tank');
  const [fuelType, setFuelType] = useState<string>('electric');
  const [capacity, setCapacity] = useState<string>('50');
  const [installation, setInstallation] = useState<string>('standard');
  const [estimate, setEstimate] = useState<number | null>(null);

  const calculateCost = () => {
    let baseCost = 0;
    
    // Base cost by heater type and fuel
    if (heaterType === 'tank') {
      if (fuelType === 'electric') {
        baseCost = capacity === '40' ? 1200 : capacity === '50' ? 1400 : 1600;
      } else if (fuelType === 'gas') {
        baseCost = capacity === '40' ? 1400 : capacity === '50' ? 1600 : 1800;
      }
    } else if (heaterType === 'tankless') {
      baseCost = fuelType === 'electric' ? 2500 : 3000;
    } else if (heaterType === 'hybrid') {
      baseCost = 3500;
    }
    
    // Installation complexity
    const installationMultiplier = {
      'standard': 1.0,
      'complex': 1.3,
      'relocation': 1.5,
    }[installation] || 1.0;
    
    const total = Math.round(baseCost * installationMultiplier);
    setEstimate(total);
  };

  return (
    <>
      <Header />
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6" data-testid="heading-calculator">
            Water Heater Cost Calculator
          </h1>
          <p className="text-xl text-muted-foreground mb-12" data-testid="text-subtitle">
            Get an instant estimate for your water heater installation
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Calculator */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="heading-calculator-form">Calculate Your Estimate</CardTitle>
                <CardDescription data-testid="text-calculator-intro">
                  Answer a few questions to get an estimated cost
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Heater Type */}
                <div className="space-y-3">
                  <Label data-testid="label-heater-type">Water Heater Type</Label>
                  <RadioGroup value={heaterType} onValueChange={setHeaterType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tank" id="tank" data-testid="radio-tank" />
                      <Label htmlFor="tank" className="font-normal">Traditional Tank</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tankless" id="tankless" data-testid="radio-tankless" />
                      <Label htmlFor="tankless" className="font-normal">Tankless</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="hybrid" id="hybrid" data-testid="radio-hybrid" />
                      <Label htmlFor="hybrid" className="font-normal">Hybrid/Heat Pump</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Fuel Type */}
                <div className="space-y-3">
                  <Label data-testid="label-fuel-type">Fuel Type</Label>
                  <RadioGroup value={fuelType} onValueChange={setFuelType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="electric" id="electric" data-testid="radio-electric" />
                      <Label htmlFor="electric" className="font-normal">Electric</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gas" id="gas" data-testid="radio-gas" />
                      <Label htmlFor="gas" className="font-normal">Natural Gas</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Capacity (only for tank) */}
                {heaterType === 'tank' && (
                  <div className="space-y-3">
                    <Label htmlFor="capacity" data-testid="label-capacity">
                      Tank Capacity
                    </Label>
                    <Select value={capacity} onValueChange={setCapacity}>
                      <SelectTrigger id="capacity" data-testid="select-capacity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="40">40 Gallons</SelectItem>
                        <SelectItem value="50">50 Gallons</SelectItem>
                        <SelectItem value="75">75 Gallons</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Installation Type */}
                <div className="space-y-3">
                  <Label htmlFor="installation" data-testid="label-installation">
                    Installation Type
                  </Label>
                  <Select value={installation} onValueChange={setInstallation}>
                    <SelectTrigger id="installation" data-testid="select-installation">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard Replacement</SelectItem>
                      <SelectItem value="complex">Complex Installation</SelectItem>
                      <SelectItem value="relocation">Relocation Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={calculateCost} 
                  className="w-full"
                  data-testid="button-calculate"
                >
                  Calculate Estimate
                </Button>

                {estimate !== null && (
                  <div className="bg-primary text-primary-foreground p-6 rounded-lg text-center">
                    <div className="text-sm uppercase tracking-wide mb-2">Estimated Cost</div>
                    <div className="text-4xl font-bold" data-testid="text-estimate">
                      ${estimate.toLocaleString()}
                    </div>
                    <div className="text-sm mt-2 opacity-90">
                      This is an estimate. Actual cost may vary.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Information */}
            <div className="space-y-6">
              <Card data-testid="card-whats-included">
                <CardHeader>
                  <CardTitle data-testid="heading-whats-included">What's Included</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {[
                      'Water heater unit',
                      'Professional installation',
                      'All necessary permits',
                      'Code-compliant work',
                      'Disposal of old unit',
                      'Testing and inspection',
                      'Warranty on parts and labor',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2" data-testid={`included-${idx}`}>
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card data-testid="card-factors">
                <CardHeader>
                  <CardTitle data-testid="heading-factors">Factors That Affect Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {[
                      'Type of water heater',
                      'Fuel source (electric vs. gas)',
                      'Tank capacity',
                      'Installation complexity',
                      'Location and accessibility',
                      'Code upgrades required',
                      'Additional materials needed',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2" data-testid={`factor-${idx}`}>
                        <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-accent/20 border-accent" data-testid="card-cta">
                <CardHeader>
                  <CardTitle className="text-lg" data-testid="heading-cta">Ready for Installation?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm" data-testid="text-cta-desc">
                    Get an exact quote from our licensed professionals
                  </p>
                  <div className="flex flex-col gap-2">
                    <a 
                      href={phoneConfig.tel}
                      data-testid="link-phone-calculator"
                      className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition text-center"
                    >
                      Call: {phoneConfig.display}
                    </a>
                    <a 
                      href="/contact"
                      data-testid="link-contact-calculator"
                      className="inline-block bg-background border px-4 py-2 rounded-lg font-semibold hover:bg-accent transition text-center"
                    >
                      Request Free Quote
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-16 space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-6" data-testid="heading-choosing">Choosing the Right Water Heater</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <Card data-testid="card-tank">
                  <CardHeader>
                    <CardTitle className="text-lg" data-testid="heading-tank">Traditional Tank</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-4" data-testid="text-tank-desc">Most affordable option. Stores hot water for on-demand use.</p>
                    <p className="text-muted-foreground" data-testid="text-tank-best">
                      <strong>Best for:</strong> Budget-conscious homeowners, consistent hot water needs
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-tankless">
                  <CardHeader>
                    <CardTitle className="text-lg" data-testid="heading-tankless">Tankless</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-4" data-testid="text-tankless-desc">Heats water on demand. Energy-efficient and space-saving.</p>
                    <p className="text-muted-foreground" data-testid="text-tankless-best">
                      <strong>Best for:</strong> Energy efficiency, unlimited hot water, small spaces
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-hybrid">
                  <CardHeader>
                    <CardTitle className="text-lg" data-testid="heading-hybrid">Hybrid/Heat Pump</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="mb-4" data-testid="text-hybrid-desc">Most energy-efficient. Uses heat pump technology with backup tank.</p>
                    <p className="text-muted-foreground" data-testid="text-hybrid-best">
                      <strong>Best for:</strong> Maximum energy savings, larger homes, Texas climate
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <section className="bg-muted/30 p-8 rounded-lg" data-testid="section-notes">
              <h2 className="text-2xl font-semibold mb-4" data-testid="heading-notes">Important Notes</h2>
              <ul className="space-y-2 text-muted-foreground">
                {[
                  'This calculator provides estimates only. Actual costs may vary based on specific conditions.',
                  'Costs include standard installation. Upgrades to electrical, gas lines, or venting may cost extra.',
                  'Permits and inspections are required by code and are included in estimates.',
                  'We offer financing options for qualified customers.',
                  'All work is performed by licensed, insured professionals.',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2" data-testid={`note-${idx}`}>
                    <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
      <Footer />
    </>
  );
}
