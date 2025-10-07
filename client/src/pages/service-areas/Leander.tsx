import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, CheckCircle, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SchedulerModal from "@/components/SchedulerModal";
import ContactFormSection from "@/components/ContactFormSection";
import FAQSection from "@/components/FAQSection";
import { JsonLd, createFAQSchema } from "@/components/SEO/JsonLd";
import type { ServiceArea } from "@shared/schema";

const SERVICES = [
  { name: "Water Heater Services", path: "/water-heater-services" },
  { name: "Drain Cleaning", path: "/drain-cleaning" },
  { name: "Leak Repair", path: "/leak-repair" },
  { name: "Toilet & Faucet Services", path: "/toilet-faucet" },
  { name: "Gas Services", path: "/gas-services" },
  { name: "Backflow Services", path: "/backflow" },
  { name: "Commercial Plumbing", path: "/commercial-plumbing" },
  { name: "Emergency Services", path: "/emergency" },
];

export default function LeanderServiceArea() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  const slug = "leander";
  
  const { data: serviceArea, isLoading } = useQuery<ServiceArea>({
    queryKey: [`/api/service-areas/${slug}`],
  });

  const nearbyCities = [
    { name: "Cedar Park", path: "/service-areas/cedar-park" },
    { name: "Liberty Hill", path: "/service-areas/liberty-hill" },
    { name: "Georgetown", path: "/service-areas/georgetown" },
    { name: "Round Rock", path: "/service-areas/round-rock" },
    { name: "Austin", path: "/service-areas/austin" },
  ];

  const phone = "(512) 649-2811";
  const phoneLink = "5126492811";
  const cityName = serviceArea?.cityName || "Leander";

  const faqs = serviceArea?.uniqueFaqs 
    ? serviceArea.uniqueFaqs.map(faqStr => JSON.parse(faqStr)) 
    : [];

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": `Economy Plumbing Services - ${cityName}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": "TX",
      "addressCountry": "US"
    },
    "telephone": "+15126492811",
    "areaServed": {
      "@type": "City",
      "name": cityName,
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    "url": `https://economyplumbingservices.com/service-areas/${slug}`,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header onScheduleClick={() => setSchedulerOpen(true)} />
        <div className="flex items-center justify-center py-24">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>{cityName} Plumber | Water Heater Repair & Plumbing Services</title>
        <meta name="description" content={serviceArea?.metaDescription || `Expert plumbing services in ${cityName}, TX. Water heater repair, drain cleaning, leak repair, and emergency plumbing.`} />
        <meta property="og:title" content={`${cityName} Plumber | Economy Plumbing Services`} />
        <meta property="og:description" content={serviceArea?.metaDescription || `Expert plumbing services in ${cityName}, TX.`} />
        <meta property="og:type" content="website" />
      </Helmet>

      <JsonLd data={localBusinessSchema} />
      {faqs.length > 0 && <JsonLd data={createFAQSchema(faqs)} />}

      <SchedulerModal open={schedulerOpen} onOpenChange={setSchedulerOpen} />
      <Header onScheduleClick={() => setSchedulerOpen(true)} />

      <section className="relative min-h-[400px] lg:min-h-[500px] flex items-center bg-primary">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-primary-foreground" />
              <span className="text-primary-foreground/90 text-lg" data-testid="text-area-name">
                Austin Metro Area
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-4" data-testid="heading-city">
              Professional Plumber in {cityName}, TX
            </h1>
            <p className="text-xl text-primary-foreground/90 mb-8" data-testid="text-hero-subtitle">
              {serviceArea?.introContent || `Expert plumbing services for ${cityName} residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed.`}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={() => setSchedulerOpen(true)}
                className="bg-white text-primary hover:bg-white/90"
                data-testid="button-schedule-hero"
              >
                Schedule Service
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white bg-white/10 backdrop-blur-sm hover:bg-white/20"
                asChild
                data-testid="button-call-hero"
              >
                <a href={`tel:${phoneLink}`} className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call Now: {phone}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {serviceArea?.neighborhoods && serviceArea.neighborhoods.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8" data-testid="heading-neighborhoods">
              Neighborhoods We Serve in {cityName}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {serviceArea.neighborhoods.map((neighborhood, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-background rounded-lg" data-testid={`neighborhood-${index}`}>
                  <Home className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{neighborhood}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-services">
              Plumbing Services in {cityName}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Economy Plumbing Services provides comprehensive plumbing solutions to {cityName} homeowners and businesses.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {SERVICES.map((service) => (
              <Card key={service.path} className="p-6 hover-elevate">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <Link href={service.path}>
                      <span className="text-base font-semibold hover:text-primary cursor-pointer" data-testid={`link-service-${service.path.slice(1)}`}>
                        {service.name}
                      </span>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {serviceArea?.localPainPoints && serviceArea.localPainPoints.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12" data-testid="heading-pain-points">
              Common Plumbing Issues in {cityName}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceArea.localPainPoints.map((painPoint, index) => (
                <Card key={index} className="p-6" data-testid={`pain-point-${index}`}>
                  <p className="text-foreground">{painPoint}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {serviceArea?.seasonalIssues && serviceArea.seasonalIssues.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12" data-testid="heading-seasonal">
              Seasonal Plumbing Considerations in {cityName}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {serviceArea.seasonalIssues.map((issue, index) => (
                <Card key={index} className="p-6" data-testid={`seasonal-issue-${index}`}>
                  <p className="text-foreground">{issue}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {(serviceArea?.population || (serviceArea?.zipCodes && serviceArea.zipCodes.length > 0)) && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8" data-testid="heading-about">
                About {cityName}
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {serviceArea?.population && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-2">Population</h3>
                    <p className="text-2xl font-bold text-primary" data-testid="text-population">{serviceArea.population}</p>
                  </Card>
                )}
                {serviceArea?.zipCodes && serviceArea.zipCodes.length > 0 && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-2">Zip Codes Served</h3>
                    <p className="text-muted-foreground" data-testid="text-zip-codes">{serviceArea.zipCodes.join(", ")}</p>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <FAQSection 
          title={`Frequently Asked Questions - ${cityName} Plumbing`}
          faqs={faqs}
          className="py-16 lg:py-24"
        />
      )}

      <ContactFormSection 
        title={`Get a Free Estimate in ${cityName}`}
        description={`Contact us today for expert plumbing services in ${cityName}. We'll respond within 1 hour during business hours.`}
        defaultLocation={cityName}
        className="py-16 lg:py-24 bg-muted/30"
      />

      {nearbyCities.length > 0 && (
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8" data-testid="heading-nearby">
              We Also Serve Nearby Cities
            </h2>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {nearbyCities.map((nearbyCity) => (
                <Link 
                  key={nearbyCity.path} 
                  href={nearbyCity.path}
                >
                  <Badge 
                    variant="outline" 
                    className="text-base px-4 py-2 hover-elevate cursor-pointer"
                    data-testid={`link-city-${nearbyCity.path.split('/').pop()}`}
                  >
                    {nearbyCity.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6" data-testid="heading-cta">
            Need a Plumber in {cityName}?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Contact Economy Plumbing Services today for fast, reliable service in {cityName}, TX.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              variant="outline"
              className="text-primary bg-white border-white hover:bg-white/90"
              asChild
              data-testid="button-call-cta"
            >
              <a href={`tel:${phoneLink}`} className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call: {phone}
              </a>
            </Button>
          </div>

          <Button 
            size="lg"
            onClick={() => setSchedulerOpen(true)}
            className="bg-white text-primary hover:bg-white/90"
            data-testid="button-schedule-cta"
          >
            Schedule Service Online
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
