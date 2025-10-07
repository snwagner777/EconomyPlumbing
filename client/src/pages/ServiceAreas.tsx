import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchedulerModal from "@/components/SchedulerModal";

export default function ServiceAreas() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);

  const austinMetroCities = [
    { name: "Austin", path: "/service-areas/austin" },
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Leander", path: "/service-areas/leander" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Pflugerville", path: "/service-areas/pflugerville" },
    { name: "Liberty Hill", path: "/service-areas/liberty-hill" },
    { name: "Buda", path: "/service-areas/buda" },
    { name: "Kyle", path: "/service-areas/kyle" },
  ];

  const marbleFallsCities = [
    { name: "Marble Falls", path: "/service-areas/marble-falls" },
    { name: "Burnet", path: "/service-areas/burnet" },
    { name: "Horseshoe Bay", path: "/service-areas/horseshoe-bay" },
    { name: "Kingsland", path: "/service-areas/kingsland" },
    { name: "Granite Shoals", path: "/service-areas/granite-shoals" },
    { name: "Bertram", path: "/service-areas/bertram" },
    { name: "Spicewood", path: "/service-areas/spicewood" },
  ];

  return (
    <div className="min-h-screen">
      <title>Service Areas | Economy Plumbing Services in Central Texas</title>
      <meta name="description" content="Economy Plumbing Services proudly serves Austin Metro, Marble Falls, and surrounding areas in Central Texas. Find your city and schedule expert plumbing services today." />

      <SchedulerModal open={schedulerOpen} onOpenChange={setSchedulerOpen} />
      <Header onScheduleClick={() => setSchedulerOpen(true)} />

      <section className="relative min-h-[400px] lg:min-h-[500px] flex items-center bg-primary">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-4" data-testid="heading-main">
              Our Service Areas
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8" data-testid="text-hero-subtitle">
              Proudly serving Central Texas communities with expert plumbing services since 2012
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-overview">
              Two Locations Serving Central Texas
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Economy Plumbing Services operates from two convenient locations to better serve you across Burnet, Williamson, and Travis Counties.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <Card className="p-8 bg-primary/5">
              <div className="flex items-start gap-3 mb-6">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold mb-2" data-testid="heading-austin-metro">Austin Metro Area</h3>
                  <p className="text-muted-foreground">701 Tillery St #12, Austin, TX 78702</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-lg">Cities We Serve:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {austinMetroCities.map((city) => (
                    <Link key={city.path} href={city.path}>
                      <Badge 
                        variant="secondary" 
                        className="w-full justify-start text-sm px-3 py-2 hover-elevate cursor-pointer"
                        data-testid={`link-austin-${city.path.split('/').pop()}`}
                      >
                        {city.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <a 
                href="tel:5126492811"
                className="flex items-center gap-2 text-primary font-poppins font-bold text-xl hover-elevate px-2 py-1 rounded-md w-fit"
                data-testid="link-phone-austin"
              >
                <Phone className="w-5 h-5" />
                (512) 649-2811
              </a>
            </Card>

            <Card className="p-8 bg-primary/5">
              <div className="flex items-start gap-3 mb-6">
                <MapPin className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold mb-2" data-testid="heading-marble-falls">Marble Falls Area</h3>
                  <p className="text-muted-foreground">2409 Commerce Street, Marble Falls, TX 78654</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-lg">Cities We Serve:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {marbleFallsCities.map((city) => (
                    <Link key={city.path} href={city.path}>
                      <Badge 
                        variant="secondary" 
                        className="w-full justify-start text-sm px-3 py-2 hover-elevate cursor-pointer"
                        data-testid={`link-marble-falls-${city.path.split('/').pop()}`}
                      >
                        {city.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>

              <a 
                href="tel:8304603565"
                className="flex items-center gap-2 text-primary font-poppins font-bold text-xl hover-elevate px-2 py-1 rounded-md w-fit"
                data-testid="link-phone-marble-falls"
              >
                <Phone className="w-5 h-5" />
                (830) 460-3565
              </a>
            </Card>
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-6" data-testid="heading-contact">Don't See Your City?</h3>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              We may still be able to help! Contact us to see if we can provide service in your area.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => setSchedulerOpen(true)}
                size="lg" 
                className="bg-primary"
                data-testid="button-schedule-main"
              >
                Schedule Service
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline"
                data-testid="button-call-austin-main"
              >
                <a href="tel:5126492811" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Austin: (512) 649-2811
                </a>
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline"
                data-testid="button-call-marble-falls-main"
              >
                <a href="tel:8304603565" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Marble Falls: (830) 460-3565
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-services">
              Services Available in All Areas
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              No matter which city you're in, we provide the same high-quality plumbing services throughout our service areas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Water Heater Services</h3>
              <p className="text-sm text-muted-foreground">Installation, repair & maintenance</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Drain Cleaning</h3>
              <p className="text-sm text-muted-foreground">Professional drain & sewer services</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Leak Repair</h3>
              <p className="text-sm text-muted-foreground">Fast & permanent leak solutions</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Toilet & Faucet</h3>
              <p className="text-sm text-muted-foreground">Installation & repair services</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Gas Services</h3>
              <p className="text-sm text-muted-foreground">Gas line installation & safety</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Backflow Services</h3>
              <p className="text-sm text-muted-foreground">Testing & certification</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Commercial Plumbing</h3>
              <p className="text-sm text-muted-foreground">Business & property services</p>
            </Card>
            <Card className="p-6">
              <h3 className="font-semibold mb-2">Emergency Services</h3>
              <p className="text-sm text-muted-foreground">Fast response when needed</p>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
