import { useState } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchedulerModal from "@/components/SchedulerModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Shield, Clock, Phone } from "lucide-react";
import { Helmet } from "react-helmet";

export default function MembershipBenefits() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  const benefits = [
    {
      icon: Star,
      title: "Priority Scheduling",
      description: "VIP members get priority scheduling for all service calls. You'll never wait long for the service you need."
    },
    {
      icon: Shield,
      title: "Discounted Rates",
      description: "Save 15-20% on all plumbing repairs and installations. Membership pays for itself with just one major repair."
    },
    {
      icon: Clock,
      title: "Annual Maintenance",
      description: "Complimentary annual plumbing inspection and water heater maintenance included with membership."
    },
    {
      icon: Phone,
      title: "24/7 VIP Support",
      description: "Dedicated VIP support line for emergency service. Members get faster response times for urgent issues."
    }
  ];

  const membershipTiers = [
    {
      name: "Silver VIP",
      price: "$199/year",
      description: "Essential coverage for homeowners",
      features: [
        "15% discount on all services",
        "Priority scheduling",
        "Annual plumbing inspection",
        "Water heater flush & check",
        "No trip charges",
        "Extended warranty on parts"
      ],
      popular: false
    },
    {
      name: "Platinum VIP",
      price: "$349/year",
      description: "Comprehensive protection & savings",
      features: [
        "20% discount on all services",
        "Priority emergency response",
        "Two annual plumbing inspections",
        "Water heater maintenance (2x/year)",
        "Drain cleaning included",
        "No trip or diagnostic fees",
        "Transferable membership",
        "Extended warranties on all work"
      ],
      popular: true
    },
    {
      name: "Commercial VIP",
      price: "Custom Pricing",
      description: "Tailored for businesses",
      features: [
        "20% discount on all services",
        "Priority commercial response",
        "Quarterly inspections",
        "Backflow testing included",
        "Preventive maintenance plans",
        "After-hours service availability",
        "Dedicated account manager",
        "Custom service agreements"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>VIP Membership Benefits | Economy Plumbing Services TX</title>
        <meta name="description" content="Join our VIP membership program for priority service, discounted rates, annual maintenance, and more. Save on all plumbing services in Austin & Marble Falls." />
        <meta property="og:title" content="VIP Membership Benefits | Economy Plumbing" />
        <meta property="og:description" content="Get priority service and exclusive savings with our VIP membership program." />
      </Helmet>

      <SchedulerModal open={schedulerOpen} onOpenChange={setSchedulerOpen} />
      <Header onScheduleClick={() => setSchedulerOpen(true)} />

      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">VIP Membership Benefits</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Protect your home, save money, and get priority service with our exclusive VIP membership program
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join Our VIP Program?</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              VIP members enjoy exclusive benefits designed to save money and provide peace of mind
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx} className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              );
            })}
          </div>

          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Membership Level</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Select the plan that best fits your needs and start saving today
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {membershipTiers.map((tier, idx) => (
              <Card key={idx} className={`p-8 relative ${tier.popular ? 'border-primary border-2' : ''}`}>
                {tier.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary">Most Popular</Badge>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-3xl font-poppins font-bold text-primary mb-2">{tier.price}</p>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIdx) => (
                    <li key={featureIdx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  asChild 
                  className="w-full"
                  variant={tier.popular ? "default" : "outline"}
                >
                  <Link href="/store">Learn More</Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Become a VIP Member?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join today and start enjoying priority service, exclusive discounts, and peace of mind protection for your home.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              asChild
              size="lg"
            >
              <Link href="/store">View Membership Plans</Link>
            </Button>
            <Button 
              asChild
              size="lg"
              variant="outline"
            >
              <a href="tel:5126492811" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call to Enroll
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
