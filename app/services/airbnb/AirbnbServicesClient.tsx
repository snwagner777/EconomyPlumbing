'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PhoneLookupModal } from '@/components/PhoneLookupModal';
import { CheckCircle, Shield, Clock, Wrench, DollarSign, Star } from 'lucide-react';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';

interface AirbnbServicesClientProps {
  phoneConfig: PhoneConfig;
}

export default function AirbnbServicesClient({ phoneConfig }: AirbnbServicesClientProps) {
  const router = useRouter();
  const [lookupModalOpen, setLookupModalOpen] = useState(false);

  const services = [
    {
      icon: Clock,
      title: 'Priority Emergency Service',
      description: 'Get to the front of the line when plumbing emergencies threaten your bookings',
    },
    {
      icon: Shield,
      title: 'Preventive Maintenance',
      description: 'Regular inspections to catch problems before they impact your guests',
    },
    {
      icon: Wrench,
      title: 'Guest-Friendly Service',
      description: 'Professional, courteous service that respects your guests\' experience',
    },
    {
      icon: DollarSign,
      title: 'Member Savings',
      description: 'VIP pricing on all services helps protect your rental income',
    },
  ];

  const benefits = [
    'Priority scheduling for emergency repairs',
    'Discounted rates on all plumbing services',
    'Annual plumbing inspection included',
    'Coverage for all rental properties in our area',
    '24/7 emergency support',
    'Fast response times to minimize guest disruption',
  ];

  function handleVIPPurchase(data: { customerId: number; customerName: string; phone: string }) {
    sessionStorage.setItem('membership_checkout_customer', JSON.stringify({
      customerId: data.customerId,
      customerName: data.customerName,
      phone: data.phone,
      timestamp: Date.now(),
    }));
    
    setLookupModalOpen(false);
    router.push('/store/checkout/rental-vip');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header phoneConfig={phoneConfig} />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Plumbing Services for Airbnb & Rental Properties
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Protect your rental income with priority plumbing service designed for property owners and hosts
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Card key={index} className="p-6 text-center hover-elevate" data-testid={`card-service-${index}`}>
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{service.description}</p>
                  </Card>
                );
              })}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={() => setLookupModalOpen(true)}
                className="px-8"
                data-testid="button-get-rental-vip"
              >
                <Star className="w-5 h-5 mr-2" />
                Get Rental VIP Membership
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Why Airbnb Hosts Choose Our VIP Program
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Running a successful rental property means minimizing downtime and keeping guests happy. 
                  Our Rental VIP membership gives you peace of mind with priority service and preventive care 
                  for all your properties in our coverage area.
                </p>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3" data-testid={`benefit-${index}`}>
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{benefit}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Card className="p-8 bg-primary/5 border-primary/20">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Rental VIP Membership</h3>
                  <p className="text-muted-foreground">
                    Comprehensive coverage for all your rental properties
                  </p>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">Priority Emergency Service</span>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">VIP Savings on All Services</span>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">Annual Inspection Included</span>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-muted-foreground">All Properties Covered</span>
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setLookupModalOpen(true)}
                  data-testid="button-enroll-now"
                >
                  Enroll Now
                </Button>
              </Card>
            </div>
          </div>
        </section>

        <section className="bg-muted/50 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Questions About Our Rental VIP Program?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our team is here to help you understand how our VIP membership can protect your rental properties 
              and keep your guests happy. Call us today to learn more!
            </p>
            <a
              href={`tel:${phoneConfig.phoneNumber}`}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover-elevate active-elevate-2"
              data-testid="button-call-for-info"
            >
              Call Now: {phoneConfig.displayNumber}
            </a>
          </div>
        </section>
      </main>

      <Footer phoneConfig={phoneConfig} />

      <PhoneLookupModal
        open={lookupModalOpen}
        onOpenChange={setLookupModalOpen}
        onSuccess={handleVIPPurchase}
        title="Enroll in Rental VIP"
        description="Enter your phone number or email to get started with your Rental VIP membership."
      />
    </div>
  );
}
