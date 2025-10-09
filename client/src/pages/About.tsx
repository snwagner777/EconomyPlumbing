import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Users, Award, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openScheduler } from "@/lib/scheduler";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Link } from "wouter";

export default function About() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Economy Plumbing Services",
    "url": "https://www.plumbersthatcare.com",
    "logo": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "description": "Central Texas's trusted water heater experts since 2005. Specializing in tankless water heater installation, water heater repair & replacement. Licensed plumbers serving Austin to Marble Falls.",
    "foundingDate": "2005",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "701 Tillery St #12",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "postalCode": "78702",
      "addressCountry": "US"
    },
    "telephone": ["+15123689159", "+18304603565"],
    "areaServed": [
      { "@type": "City", "name": "Austin", "containedIn": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Marble Falls", "containedIn": { "@type": "State", "name": "Texas" } }
    ],
    "knowsAbout": ["Plumbing", "Water Heater Installation", "Water Heater Repair", "Drain Cleaning", "Emergency Plumbing"],
    "slogan": "Serving Central Texas with excellence, integrity, and expert plumbing solutions since 2005"
  };

  const values = [
    {
      icon: Shield,
      title: "Honest & Transparent",
      description: "No hidden fees, no surprises. We believe in upfront pricing and honest communication."
    },
    {
      icon: Award,
      title: "Expert Craftsmanship",
      description: "Our licensed plumbers bring years of experience and expertise to every job."
    },
    {
      icon: Clock,
      title: "24/7 Emergency Service",
      description: "Plumbing emergencies don't wait, and neither do we. We're here when you need us."
    },
    {
      icon: Users,
      title: "Customer-First Approach",
      description: "Your satisfaction is our priority. We're not done until you're 100% happy."
    }
  ];

  const serviceAreas = [
    { name: "Austin", slug: "austin" },
    { name: "Cedar Park", slug: "cedar-park" },
    { name: "Leander", slug: "leander" },
    { name: "Round Rock", slug: "round-rock" },
    { name: "Georgetown", slug: "georgetown" },
    { name: "Pflugerville", slug: "pflugerville" },
    { name: "Liberty Hill", slug: "liberty-hill" },
    { name: "Buda", slug: "buda" },
    { name: "Kyle", slug: "kyle" },
    { name: "Marble Falls", slug: "marble-falls" },
    { name: "Burnet", slug: "burnet" },
    { name: "Horseshoe Bay", slug: "horseshoe-bay" },
    { name: "Kingsland", slug: "kingsland" },
    { name: "Granite Shoals", slug: "granite-shoals" },
    { name: "Bertram", slug: "bertram" },
    { name: "Spicewood", slug: "spicewood" }
  ];

  return (
    <>
      <SEOHead
        title="About Economy Plumbing Services | Water Heater Experts | Austin & Marble Falls"
        description="Central Texas's trusted water heater experts since 2005. Specializing in tankless water heater installation, water heater repair & replacement. Licensed plumbers. 24/7 emergency service. Serving Austin to Marble Falls."
        canonical="https://www.plumbersthatcare.com/about"
        schema={organizationSchema}
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-primary/5 py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">About Economy Plumbing Services</h1>
                <p className="text-xl text-muted-foreground">
                  Serving Central Texas with excellence, integrity, and expert plumbing solutions since 2005
                </p>
              </div>
            </div>
          </section>

          {/* Our Story */}
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Economy Plumbing Services was founded with a simple mission: to provide honest, reliable plumbing services at fair prices to homeowners and businesses across Central Texas.
                    </p>
                    <p>
                      What started as a small team serving Austin has grown into a trusted name across the region, from Cedar Park to Marble Falls. But despite our growth, we've never lost sight of what matters most - treating every customer like family.
                    </p>
                    <p>
                      Our team of licensed, experienced plumbers brings decades of combined expertise to every job. We're particularly known as Central Texas's water heater experts, specializing in tankless water heater installation, water heater repair, and water heater replacement. Whether it's a simple faucet repair or a complete water heater system upgrade, we approach each project with the same commitment to quality and customer satisfaction.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-6 text-center" data-testid="card-stat-years">
                    <div className="text-4xl font-bold text-primary mb-2">18+</div>
                    <div className="text-sm text-muted-foreground">Years of Service</div>
                  </Card>
                  <Card className="p-6 text-center" data-testid="card-stat-customers">
                    <div className="text-4xl font-bold text-primary mb-2">10k+</div>
                    <div className="text-sm text-muted-foreground">Happy Customers</div>
                  </Card>
                  <Card className="p-6 text-center" data-testid="card-stat-areas">
                    <div className="text-4xl font-bold text-primary mb-2">16</div>
                    <div className="text-sm text-muted-foreground">Service Areas</div>
                  </Card>
                  <Card className="p-6 text-center" data-testid="card-stat-availability">
                    <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                    <div className="text-sm text-muted-foreground">Emergency Service</div>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* Our Values */}
          <section className="py-16 lg:py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">What Sets Us Apart</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Our commitment to these core values has made us Central Texas's trusted plumbing partner
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <Card key={index} className="p-6" data-testid={`card-value-${index}`}>
                    <value.icon className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Service Areas */}
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">We Serve Central Texas</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  From Austin to Marble Falls and everywhere in between
                </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3">
                {serviceAreas.map((area) => (
                  <Link 
                    key={area.slug} 
                    href={`/service-area/${area.slug}`}
                    className="px-4 py-2 bg-primary/10 rounded-full text-sm font-medium hover-elevate active-elevate-2 transition-all"
                    data-testid={`link-area-${area.slug}`}
                  >
                    {area.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Why Choose Us */}
          <section className="py-16 lg:py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center">Why Choose Economy Plumbing?</h2>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Licensed & Insured</h3>
                      <p className="text-muted-foreground">Fully licensed plumbers with comprehensive insurance for your peace of mind</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Upfront Pricing</h3>
                      <p className="text-muted-foreground">No hidden fees or surprise charges - you'll know the cost before we start</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Quality Guaranteed</h3>
                      <p className="text-muted-foreground">We stand behind our work with solid warranties and guarantees</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Same-Day Service Available</h3>
                      <p className="text-muted-foreground">We understand urgency - most jobs can be completed the same day</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Clean & Professional</h3>
                      <p className="text-muted-foreground">We respect your property and leave your home cleaner than we found it</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="p-8 md:p-12 bg-primary/5 border-primary/20">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Experience the Economy Plumbing Difference</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Join thousands of satisfied customers who trust us for all their plumbing needs
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="bg-primary"
                      onClick={openScheduler}
                      data-testid="button-schedule-service"
                    >
                      Schedule Service
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      asChild
                      data-testid="button-view-services"
                    >
                      <a href="/water-heater-services">View Our Services</a>
                    </Button>
                  </div>
                  <div className="mt-8 pt-8 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-2">Call us today for a free estimate</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-lg font-semibold">
                      <a href="tel:+15123689159" className="hover:text-primary" data-testid="link-phone-austin">
                        Austin: (512) 368-9159
                      </a>
                      <span className="hidden sm:inline text-muted-foreground">|</span>
                      <a href="tel:+18304603565" className="hover:text-primary" data-testid="link-phone-marble-falls">
                        Marble Falls: (830) 460-3565
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
