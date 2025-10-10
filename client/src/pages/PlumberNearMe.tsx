import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Phone, Clock, Shield, Award, MapPin, Star, CheckCircle2, Wrench, Droplet, Flame } from "lucide-react";
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

export default function PlumberNearMe() {
  const phoneConfig = usePhoneConfig();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // LocalBusiness Schema for SEO
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": "Economy Plumbing Services",
    "image": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "description": "Licensed and insured plumbing services in Austin and Marble Falls, Texas. 24/7 emergency plumber available. Water heater repair, drain cleaning, leak repair, and more.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 30.2672,
      "longitude": -97.7431
    },
    "telephone": phoneConfig.tel,
    "priceRange": "$$",
    "openingHours": "Mo-Su 00:00-24:00",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "150"
    },
    "areaServed": [
      {
        "@type": "City",
        "name": "Austin",
        "containedInPlace": {
          "@type": "State",
          "name": "Texas"
        }
      },
      {
        "@type": "City",
        "name": "Marble Falls",
        "containedInPlace": {
          "@type": "State",
          "name": "Texas"
        }
      },
      {
        "@type": "City",
        "name": "Cedar Park"
      },
      {
        "@type": "City",
        "name": "Round Rock"
      },
      {
        "@type": "City",
        "name": "Georgetown"
      },
      {
        "@type": "City",
        "name": "Leander"
      },
      {
        "@type": "City",
        "name": "Pflugerville"
      },
      {
        "@type": "City",
        "name": "Liberty Hill"
      },
      {
        "@type": "City",
        "name": "Buda"
      },
      {
        "@type": "City",
        "name": "Kyle"
      },
      {
        "@type": "City",
        "name": "Burnet"
      },
      {
        "@type": "City",
        "name": "Horseshoe Bay"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Plumbing Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Emergency Plumbing",
            "description": "24/7 emergency plumbing services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Water Heater Repair",
            "description": "Water heater installation, repair, and replacement"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Drain Cleaning",
            "description": "Professional drain cleaning and unclogging"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Leak Repair",
            "description": "Fast leak detection and repair"
          }
        }
      ]
    }
  };

  const serviceAreas = [
    { name: "Austin", path: "/plumber-austin" },
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
    { name: "Buda", path: "/plumber-buda" },
    { name: "Kyle", path: "/plumber-kyle" },
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" }
  ];

  const emergencyServices = [
    { icon: Droplet, title: "Burst Pipes", description: "Emergency pipe repair and replacement" },
    { icon: Wrench, title: "Water Heater Failure", description: "Same-day water heater service" },
    { icon: Flame, title: "Gas Leaks", description: "Immediate gas leak detection and repair" },
    { icon: Clock, title: "Drain Blockages", description: "24/7 drain cleaning available" }
  ];

  const whyChooseUs = [
    { icon: Shield, title: "Licensed & Insured", description: "Fully licensed, bonded, and insured plumbers" },
    { icon: Clock, title: "24/7 Availability", description: "Emergency service available around the clock" },
    { icon: Award, title: "Experienced Team", description: "Decades of combined plumbing experience" },
    { icon: Star, title: "Top-Rated", description: "4.9-star average rating from 150+ reviews" },
    { icon: CheckCircle2, title: "Guaranteed Work", description: "100% satisfaction guarantee on all services" },
    { icon: MapPin, title: "Local Experts", description: "Serving Austin and surrounding areas since 1999" }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Plumber Near Me Austin TX | 24/7 Emergency Plumbing"
        description="Looking for a plumber near you in Austin or Marble Falls? Economy Plumbing offers 24/7 emergency service, water heater repair, drain cleaning & more. Call now!"
        canonical="https://www.plumbersthatcare.com/plumber-near-me"
        schema={localBusinessSchema}
      />

      <Header />

      <main className="flex-1">
        {/* Hero Section with Sticky CTA */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-white py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-white/20 text-white border-white/30" data-testid="badge-availability">
                  <Clock className="w-3 h-3 mr-1" />
                  Available 24/7
                </Badge>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6" data-testid="text-hero-title">
                  Need a Plumber? We're Here to Help
                </h1>
                
                <p className="text-xl lg:text-2xl text-white/90 mb-8" data-testid="text-hero-subtitle">
                  Licensed plumbing experts serving Austin, Marble Falls, and surrounding areas with fast, reliable service
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-primary border-white text-lg px-8 py-6 h-auto"
                    asChild
                    data-testid="button-call-now"
                  >
                    <a href={`tel:${phoneConfig.tel}`}>
                      <Phone className="w-5 h-5 mr-2" />
                      {phoneConfig.display}
                    </a>
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent text-white border-white text-lg px-8 py-6 h-auto"
                    onClick={openScheduler}
                    data-testid="button-schedule"
                  >
                    Schedule Service
                  </Button>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.9 Rating</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Licensed & Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Same-Day Service</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 border border-white/20">
                  <h3 className="text-2xl font-bold mb-6">Emergency? We're Available 24/7</h3>
                  <ul className="space-y-4">
                    {emergencyServices.map((service, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <service.icon className="w-6 h-6 mt-1 flex-shrink-0" />
                        <div>
                          <div className="font-semibold">{service.title}</div>
                          <div className="text-sm text-white/80">{service.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Signals */}
        <section className="py-8 bg-accent/5 border-y">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {whyChooseUs.map((item, index) => (
                <div key={index} className="text-center" data-testid={`trust-item-${index}`}>
                  <item.icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-semibold text-sm mb-1">{item.title}</div>
                  <div className="text-xs text-muted-foreground hidden md:block">{item.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="text-service-areas-title">
                Serving Your Neighborhood
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Local plumbing experts proudly serving Austin, Marble Falls, and surrounding communities
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
              {serviceAreas.map((area) => (
                <Button
                  key={area.path}
                  variant="outline"
                  className="justify-start"
                  asChild
                  data-testid={`button-area-${area.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <a href={area.path}>
                    <MapPin className="w-4 h-4 mr-2" />
                    {area.name}
                  </a>
                </Button>
              ))}
            </div>

            {/* Embedded Map */}
            <div className="rounded-lg overflow-hidden border shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d440894.67457634!2d-98.0698!3d30.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8644b599a0cc032f%3A0x5d9b464bd469d57a!2sAustin%2C%20TX!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Economy Plumbing service area map"
                data-testid="map-service-area"
              />
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-16 lg:py-20 bg-accent/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Complete Plumbing Services</h2>
              <p className="text-xl text-muted-foreground">From emergency repairs to routine maintenance, we do it all</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover-elevate" data-testid="card-water-heater">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    Water Heater Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Installation, repair, and replacement of all water heater types including tankless and traditional models.
                  </p>
                  <a href="/water-heater-services" className="text-primary hover:underline font-medium">Learn More →</a>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-drain-cleaning">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-primary" />
                    Drain Cleaning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Professional drain cleaning and hydro jetting to clear stubborn clogs and keep your drains flowing.
                  </p>
                  <a href="/drain-cleaning" className="text-primary hover:underline font-medium">Learn More →</a>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-leak-repair">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    Leak Detection & Repair
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Advanced leak detection technology to find and fix leaks quickly, saving you money on water bills.
                  </p>
                  <a href="/leak-repair" className="text-primary hover:underline font-medium">Learn More →</a>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-emergency">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Emergency Plumbing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    24/7 emergency plumbing service for urgent issues like burst pipes, gas leaks, and major water leaks.
                  </p>
                  <a href="/emergency-plumbing" className="text-primary hover:underline font-medium">Learn More →</a>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-gas">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="w-5 h-5 text-primary" />
                    Gas Line Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Safe gas line installation, repair, and leak detection for your home or business.
                  </p>
                  <a href="/gas-services" className="text-primary hover:underline font-medium">Learn More →</a>
                </CardContent>
              </Card>

              <Card className="hover-elevate" data-testid="card-commercial">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    Commercial Plumbing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Comprehensive plumbing solutions for businesses, restaurants, and commercial properties.
                  </p>
                  <a href="/commercial-plumbing" className="text-primary hover:underline font-medium">Learn More →</a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-20 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Fix Your Plumbing Issue?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Call now for fast, reliable service from Austin's trusted plumbing experts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-primary border-white text-lg px-8 py-6 h-auto"
                asChild
                data-testid="button-cta-call"
              >
                <a href={`tel:${phoneConfig.tel}`}>
                  <Phone className="w-5 h-5 mr-2" />
                  Call {phoneConfig.display}
                </a>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent text-white border-white text-lg px-8 py-6 h-auto"
                onClick={openScheduler}
                data-testid="button-cta-schedule"
              >
                Schedule Online
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
