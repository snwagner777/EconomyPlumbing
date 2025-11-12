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
      title: '24/7 Emergency Response',
      description: 'Burst pipes, leaks, or backups between guests? We respond immediately to protect your property and booking calendar.',
    },
    {
      icon: Shield,
      title: 'Preventive Maintenance Plans',
      description: 'Regular inspections catch problems before they impact your 5-star reviews and revenue.',
    },
    {
      icon: Wrench,
      title: 'Turnover-Ready Service',
      description: 'Fast repairs timed between bookings. We coordinate with your cleaning schedule to minimize property downtime.',
    },
    {
      icon: DollarSign,
      title: 'VIP Membership Savings',
      description: 'Discounted rates and priority scheduling for rental property owners and property managers.',
    },
  ];

  const rentalServices = [
    {
      title: 'Emergency Plumbing Response',
      description: 'Burst pipes, water leaks, toilet backups, or drainage issues can cost you bookings. Our 24/7 emergency service gets your property guest-ready fast.',
    },
    {
      title: 'Pre-Guest Inspections',
      description: 'Proactive plumbing checks before new guests arrive prevent mid-stay emergencies and negative reviews.',
    },
    {
      title: 'Water Heater Services',
      description: 'Reliable hot water is non-negotiable for Airbnb guests. We repair, maintain, and replace water heaters with minimal property downtime.',
    },
    {
      title: 'Drain Cleaning & Maintenance',
      description: 'High guest turnover means higher drain usage. Regular maintenance prevents clogs and keeps your reviews spotless.',
    },
    {
      title: 'Fixture Upgrades',
      description: 'Modern faucets, showerheads, and toilets improve guest experience and boost your property value.',
    },
    {
      title: 'Sewer Line & Main Line Service',
      description: 'Protect your investment with professional sewer inspections and rooter services to prevent catastrophic failures.',
    },
  ];

  const benefits = [
    'Priority scheduling - we work around your booking calendar',
    'VIP membership discounts on all plumbing services',
    'Annual plumbing inspection for each covered property',
    'Fast response times to minimize guest disruption',
    'Professional, courteous service that respects your guests',
    'Coordination with your property management schedule',
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
      <Header austinPhone={{ display: phoneConfig.display, tel: phoneConfig.tel }} />
      
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

        <section className="py-16 lg:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Comprehensive Plumbing Services for Rental Properties
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                From emergency repairs to preventive maintenance, we keep your Airbnb, VRBO, and rental properties in perfect condition.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {rentalServices.map((service, index) => (
                <Card key={index} className="p-6 hover-elevate" data-testid={`card-rental-service-${index}`}>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground">{service.description}</p>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg text-muted-foreground mb-6">
                Managing multiple rental properties? Our VIP membership covers all your properties in our service area with priority scheduling and discounted rates.
              </p>
              <Button
                size="lg"
                onClick={() => setLookupModalOpen(true)}
                data-testid="button-learn-more-vip"
              >
                Learn More About VIP Membership
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">
                  Why Rental Property Owners Choose Our VIP Program
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
              href={phoneConfig.tel}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover-elevate active-elevate-2"
              data-testid="button-call-for-info"
            >
              Call Now: {phoneConfig.display}
            </a>
          </div>
        </section>
      </main>

      <Footer />

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
