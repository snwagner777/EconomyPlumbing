import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Droplets, Wind, Wrench, Bath } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Droplets,
    title: "Water Heater Services",
    description: "Installation, repair, and maintenance of traditional and tankless water heaters.",
    link: "/water-heater-services",
  },
  {
    icon: Wind,
    title: "Drain Cleaning",
    description: "Professional drain cleaning and sewer line services to keep your pipes flowing.",
    link: "/drain-cleaning",
  },
  {
    icon: Wrench,
    title: "Leak Repair",
    description: "Expert leak detection and repair to protect your property from water damage.",
    link: "/leak-repair",
  },
  {
    icon: Bath,
    title: "Toilet & Faucet Services",
    description: "Complete installation, repair, and replacement of toilets and faucets.",
    link: "/toilet-faucet",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <Hero />
      
      <main className="flex-1">
        {/* Services Section */}
        <section className="py-16 bg-muted/40">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Services</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Comprehensive plumbing solutions for residential and commercial properties
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Card key={service.title} className="p-6 hover-elevate">
                    <Icon className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                    <p className="text-muted-foreground mb-4">{service.description}</p>
                    <Button variant="link" asChild className="p-0">
                      <Link href={service.link}>Learn More →</Link>
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Migration Status */}
        <section className="py-16">
          <div className="container">
            <Card className="p-8 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Next.js Migration in Progress</h2>
              <p className="text-muted-foreground">
                Phase 1: Foundation complete ✓<br />
                Phase 2: Public pages (Homepage built) ✓<br />
                Next: Building blog, services, and area pages...
              </p>
            </Card>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
