/**
 * Office Building Plumbing Services Page
 */

'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Star, Shield, Clock, CheckCircle } from 'lucide-react';
import { usePhoneConfig } from '@/hooks/usePhoneConfig';

export default function OfficeBuildingPlumbingPage() {
  const phoneConfig = usePhoneConfig();
  
  return (
    <>
      <Header />
      
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Office Building Plumbing Services</h1>
            
            <p className="text-xl text-muted-foreground mb-12">
              Professional plumbing solutions for office buildings and commercial spaces
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Office Building Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'Multi-Floor Plumbing Systems',
                  'Restroom Facility Management',
                  'Break Room & Kitchen Plumbing',
                  'Commercial Water Heaters',
                  'Backflow Testing & Certification',
                  'Pipe Leak Detection',
                  'Emergency Shutoff Systems',
                  'Preventive Maintenance Programs',
                ].map((service) => (
                  <div key={service} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-muted/30 p-8 rounded-lg mb-12">
              <h2 className="text-2xl font-semibold mb-4">Why Office Buildings Choose Us</h2>
              <ul className="space-y-2">
                <li>• Minimal disruption to business operations</li>
                <li>• After-hours and weekend service available</li>
                <li>• Comprehensive maintenance plans</li>
                <li>• Fast emergency response</li>
                <li>• Licensed and fully insured</li>
              </ul>
            </section>

            {/* Commercial VIP Membership */}
            <Card className="mb-12 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Shield className="w-6 h-6 text-primary" />
                  Commercial VIP Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  Protect your investment and keep your tenants happy with our Commercial VIP program.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Priority Emergency Service</p>
                      <p className="text-sm text-muted-foreground">Keep your building operational 24/7</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">10% Discount on All Repairs</p>
                      <p className="text-sm text-muted-foreground">Save on every service call</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Regular Inspections</p>
                      <p className="text-sm text-muted-foreground">Prevent costly emergency repairs</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Peace of Mind</p>
                      <p className="text-sm text-muted-foreground">Professional support you can count on</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <a href="/store">Learn More About Commercial VIP</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <section className="bg-primary text-primary-foreground p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Need Commercial Plumbing Service?</h2>
              <p className="mb-6">
                Contact us for office building plumbing solutions
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
