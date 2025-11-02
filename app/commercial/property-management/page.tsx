/**
 * Property Management Plumbing Services Page
 */

'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Star, Shield, Clock, CheckCircle, Building2 } from 'lucide-react';
import { usePhoneConfig } from '@/hooks/usePhoneConfig';

export default function PropertyManagementPlumbingPage() {
  const phoneConfig = usePhoneConfig();
  
  return (
    <>
      <Header />
      
      <div className="min-h-screen py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">Property Management Plumbing Services</h1>
            
            <p className="text-xl text-muted-foreground mb-12">
              Comprehensive plumbing solutions for property managers and multi-unit buildings
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Property Management Services</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  'Multi-Property Service Plans',
                  '24/7 Tenant Emergency Response',
                  'Preventive Maintenance Programs',
                  'Turnover Plumbing Services',
                  'Water Heater Management',
                  'Leak Detection & Repair',
                  'Sewer Line Inspections',
                  'Code Compliance Consulting',
                ].map((service) => (
                  <div key={service} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <span>{service}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-muted/30 p-8 rounded-lg mb-12">
              <h2 className="text-2xl font-semibold mb-4">Benefits for Property Managers</h2>
              <ul className="space-y-3">
                <li><strong>Reduce Maintenance Costs:</strong> Preventive care is cheaper than emergency repairs</li>
                <li><strong>Happy Tenants:</strong> Fast response times lead to higher tenant satisfaction</li>
                <li><strong>Priority Scheduling:</strong> Property management clients get priority service</li>
                <li><strong>Transparent Pricing:</strong> Clear quotes and consistent pricing across properties</li>
              </ul>
            </section>

            {/* Rental VIP Membership */}
            <Card className="mb-12 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Building2 className="w-6 h-6 text-primary" />
                  Rental VIP Membership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-lg">
                  Protect all your rental properties with our Rental VIP program - specially designed for property managers.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Star className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Priority Emergency Service</p>
                      <p className="text-sm text-muted-foreground">Keep tenants happy with fast response</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Discounts on All Repairs</p>
                      <p className="text-sm text-muted-foreground">Save on every property service call</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Multi-Property Coverage</p>
                      <p className="text-sm text-muted-foreground">One plan covers all your rentals</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Preventive Maintenance</p>
                      <p className="text-sm text-muted-foreground">Regular inspections prevent costly repairs</p>
                    </div>
                  </div>
                </div>
                <div className="pt-4">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <a href="/store">Learn More About Rental VIP</a>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <section className="bg-primary text-primary-foreground p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Property Management Solutions</h2>
              <p className="mb-6">
                Let's discuss a service plan for your properties
              </p>
              <div className="flex flex-wrap gap-4">
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
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-transparent text-white border-white"
                  asChild
                >
                  <a href="/contact">
                    Request Portfolio Quote
                  </a>
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
}
