import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Shield, Clock, Phone } from "lucide-react";
import { Helmet } from "react-helmet";
import type { Product } from "@shared/schema";

export default function MembershipBenefits() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const memberships = products?.filter(p => p.category === 'membership') || [];

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

  const membershipTiers = memberships.map((membership) => {
    const isPlatinum = membership.name.toLowerCase().includes('platinum');
    const priceDisplay = isPlatinum 
      ? `$${(membership.price / 100).toFixed(2)} / 3 years`
      : `$${(membership.price / 100).toFixed(2)} / year`;
    
    return {
      name: membership.name,
      slug: membership.slug,
      price: priceDisplay,
      description: membership.description,
      features: membership.features || [],
      image: membership.image,
      popular: isPlatinum && membership.name.toLowerCase().includes('tank')
    };
  });

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Membership Benefits | Economy Plumbing Services TX</title>
        <meta name="description" content="Join our VIP membership program for priority service, discounted rates, annual maintenance, and more. Save on all plumbing services in Austin & Marble Falls." />
        <meta property="og:title" content="Membership Benefits | Economy Plumbing" />
        <meta property="og:description" content="Get priority service and exclusive savings with our VIP membership program." />
      </Helmet>

      <Header />

      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Membership Benefits</h1>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {membershipTiers.map((tier, idx) => (
              <Card key={idx} className={`p-8 relative flex flex-col ${tier.popular ? 'border-primary border-2' : ''}`}>
                {tier.popular && (
                  <Badge className="absolute top-4 right-4 bg-primary">Most Popular</Badge>
                )}
                {tier.image && (
                  <div className="mb-4 flex justify-center">
                    <img 
                      src={tier.image} 
                      alt={tier.name}
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-3xl font-poppins font-bold text-primary mb-2">{tier.price}</p>
                  <p className="text-muted-foreground text-sm">{tier.description}</p>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
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
                  <Link href={`/store/checkout/${tier.slug}`}>Purchase Now</Link>
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
