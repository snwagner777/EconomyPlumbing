import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Droplets, 
  Wind, 
  Wrench, 
  Bath, 
  Building2, 
  Flame, 
  Shield,
  Phone,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";
import { openScheduler } from "@/lib/scheduler";
import ReviewsSection from "@/components/ReviewsSection";

const serviceCategories = [
  {
    title: "Water Heaters",
    icon: Droplets,
    services: [
      { name: "Water Heater Installation", path: "/water-heater-services" },
      { name: "Water Heater Repair", path: "/water-heater-services" },
      { name: "Tankless Water Heaters", path: "/water-heater-services" },
      { name: "Water Heater Buying Guide", path: "/water-heater-guide" }
    ]
  },
  {
    title: "Drain & Sewer",
    icon: Wind,
    services: [
      { name: "Drain Cleaning", path: "/drain-cleaning" },
      { name: "Hydro Jetting", path: "/hydro-jetting-services" },
      { name: "Rooter Services", path: "/rooter-services" },
      { name: "Drainage Solutions", path: "/drainage-solutions" }
    ]
  },
  {
    title: "Repairs & Installation",
    icon: Wrench,
    services: [
      { name: "Leak Repair", path: "/leak-repair" },
      { name: "Faucet Installation", path: "/faucet-installation" },
      { name: "Toilet Repair", path: "/toilet-faucet" },
      { name: "Garbage Disposal", path: "/garbage-disposal-repair" }
    ]
  },
  {
    title: "Gas Services",
    icon: Flame,
    services: [
      { name: "Gas Line Installation", path: "/gas-services" },
      { name: "Gas Leak Detection", path: "/gas-leak-detection" },
      { name: "Gas Line Repair", path: "/gas-services" },
      { name: "Appliance Hookups", path: "/gas-services" }
    ]
  },
  {
    title: "Specialty Services",
    icon: Shield,
    services: [
      { name: "Backflow Testing", path: "/backflow-testing" },
      { name: "Backflow Prevention", path: "/backflow" },
      { name: "Water Pressure Solutions", path: "/water-pressure-solutions" },
      { name: "Permit Resolution", path: "/permit-resolution-services" }
    ]
  },
  {
    title: "Pumps & Systems",
    icon: Bath,
    services: [
      { name: "Sump Pump Installation", path: "/sewage-pump-services" },
      { name: "Sewage Pump Services", path: "/sewage-pump-services" },
      { name: "Pump Repair", path: "/sewage-pump-services" },
      { name: "Emergency Pump Service", path: "/sewage-pump-services" }
    ]
  },
  {
    title: "Commercial",
    icon: Building2,
    services: [
      { name: "Commercial Plumbing", path: "/commercial-plumbing" },
      { name: "Restaurant Plumbing", path: "/commercial-plumbing" },
      { name: "Backflow Certification", path: "/backflow-testing" }
    ]
  }
];

export default function Services() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Plumbing Services | Complete Plumbing Solutions Austin & Marble Falls TX"
        description="Austin & Marble Falls plumbing: water heaters, drain cleaning, leak repair, gas lines, backflow testing. Licensed plumbers 24/7. Call (512) 368-9159."
        canonical="https://plumbersthatcare.com/services"
      />

      <Header />

      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="heading-main">
            Our Plumbing Services
          </h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
            Complete plumbing solutions for homes and businesses in Austin and Marble Falls, Texas. Licensed, insured, and ready to serve you.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              onClick={openScheduler}
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              data-testid="button-schedule"
            >
              Schedule Service
            </Button>
            <Button 
              asChild 
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              data-testid="button-call"
            >
              <a href="tel:+15123689159" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                (512) 368-9159
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {serviceCategories.map((category, idx) => {
              const Icon = category.icon;
              return (
                <Card key={idx} className="p-6" data-testid={`card-category-${category.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">{category.title}</h2>
                  </div>
                  <ul className="space-y-3">
                    {category.services.map((service, serviceIdx) => (
                      <li key={serviceIdx}>
                        <Link 
                          href={service.path}
                          className="flex items-center gap-2 text-muted-foreground hover:text-primary hover-elevate px-2 py-1 rounded-md transition-colors"
                          data-testid={`link-${service.path.slice(1)}`}
                        >
                          <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>{service.name}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Why Choose Economy Plumbing?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-8">
            <div>
              <h3 className="text-xl font-bold mb-2">Licensed & Insured</h3>
              <p className="text-muted-foreground">Fully licensed plumbers with comprehensive insurance for your protection and peace of mind.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">12+ Years Experience</h3>
              <p className="text-muted-foreground">Over a decade serving Central Texas with expert plumbing solutions and exceptional service.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">24/7 Emergency Service</h3>
              <p className="text-muted-foreground">Round-the-clock emergency plumbing service when you need it most.</p>
            </div>
          </div>
          <Button 
            asChild
            size="lg"
            data-testid="button-contact"
          >
            <Link href="/service-area" className="inline-flex items-center gap-2">
              View Service Areas
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>

      <ReviewsSection 
        title="Trusted by Central Texas Homeowners"
        maxReviews={3}
        minRating={4}
      />

      <Footer />
    </div>
  );
}
