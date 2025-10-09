import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { SEOHead } from "@/components/SEO/SEOHead";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, CheckCircle, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactFormSection from "@/components/ContactFormSection";
import FAQSection from "@/components/FAQSection";
import ReviewsSection from "@/components/ReviewsSection";
import { JsonLd, createFAQSchema } from "@/components/SEO/JsonLd";
import { openScheduler } from "@/lib/scheduler";
import type { ServiceArea } from "@shared/schema";
import { getCoordinates } from "@shared/serviceAreaCoordinates";
import heroImage from "@assets/optimized/professional_plumber_49e7ef9b.webp";

const SERVICES = [
  { name: "Water Heater Services", path: "/water-heater-services" },
  { name: "Drain Cleaning", path: "/drain-cleaning" },
  { name: "Leak Repair", path: "/leak-repair" },
  { name: "Toilet & Faucet Services", path: "/toilet-faucet" },
  { name: "Gas Services", path: "/gas-services" },
  { name: "Backflow Services", path: "/backflow" },
  { name: "Commercial Plumbing", path: "/commercial-plumbing" },
];

export default function ServiceAreaPage() {
  const { slug } = useParams();
  
  const { data: serviceArea, isLoading, error } = useQuery<ServiceArea>({
    queryKey: [`/api/service-areas/${slug}`],
  });

  const nearbyCities = [
    { name: "Cedar Park", path: "/service-area/cedar-park" },
    { name: "Round Rock", path: "/service-area/round-rock" },
    { name: "Pflugerville", path: "/service-area/pflugerville" },
    { name: "Buda", path: "/service-area/buda" },
    { name: "Kyle", path: "/service-area/kyle" },
    { name: "Leander", path: "/service-area/leander" },
    { name: "Georgetown", path: "/service-area/georgetown" },
    { name: "Liberty Hill", path: "/service-area/liberty-hill" },
  ];

  const phone = serviceArea?.region === "marble-falls" ? "(830) 460-3565" : "(512) 368-9159";
  const phoneLink = serviceArea?.region === "marble-falls" ? "8304603565" : "5123689159";
  const cityName = serviceArea?.cityName || "Central Texas";

  const faqs = serviceArea?.uniqueFaqs 
    ? serviceArea.uniqueFaqs.map(faqStr => JSON.parse(faqStr)) 
    : [];

  const coordinates = slug ? getCoordinates(slug) : null;

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
    "telephone": `+1${phoneLink}`,
    "geo": coordinates ? {
      "@type": "GeoCoordinates",
      "latitude": coordinates.latitude,
      "longitude": coordinates.longitude
    } : undefined,
    "areaServed": {
      "@type": "City",
      "name": cityName,
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    "url": `https://www.plumbersthatcare.com/service-area/${slug}`,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-24">
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !serviceArea) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center py-24">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Service Area Not Found</h1>
            <p className="text-muted-foreground mb-6">We couldn't find information for this service area.</p>
            <Button asChild>
              <Link href="/service-area">View All Service Areas</Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`${cityName} Plumber | Water Heater Repair & Plumbing Services`}
        description={serviceArea.metaDescription}
        canonical={`https://www.plumbersthatcare.com/service-area/${slug}`}
      />

      <JsonLd data={localBusinessSchema} />
      {faqs.length > 0 && <JsonLd data={createFAQSchema(faqs)} />}

      <Header />

      <section className="relative min-h-[400px] lg:min-h-[500px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={`Professional plumbing services in ${cityName}, Texas`}
            width="1920"
            height="1080"
            fetchpriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/60" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-6 h-6 text-white" />
              <span className="text-white/90 text-lg" data-testid="text-area-name">
                {cityName} Metro Area
              </span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4" data-testid="heading-main">
              Expert Plumbing Services in {cityName}, TX
            </h1>
            
            <p className="text-xl text-white/90 mb-8" data-testid="text-intro">
              {serviceArea.introContent}
            </p>

            <div className="flex flex-wrap gap-4">
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
                className="bg-transparent border-white text-white hover:bg-white/10"
                data-testid="button-call"
              >
                <a href={`tel:+1${phoneLink}`} className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  {phone}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-center">
            Our Plumbing Services in {cityName}
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            Comprehensive plumbing solutions for homes and businesses throughout the {cityName} area.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((service, idx) => (
              <Card key={idx} className="p-6 hover-elevate" data-testid={`card-service-${idx}`}>
                <CheckCircle className="w-8 h-8 text-primary mb-3" />
                <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                <Button asChild variant="ghost" className="p-0 h-auto justify-start" data-testid={`link-service-${idx}`}>
                  <Link href={service.path} aria-label={`Learn more about ${service.name}`}>
                    Learn More →
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {serviceArea.neighborhoods && serviceArea.neighborhoods.length > 0 && (
        <section className="py-16 lg:py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-center">
              Neighborhoods We Serve in {cityName}
            </h2>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {serviceArea.neighborhoods.map((neighborhood, idx) => (
                <Badge key={idx} variant="secondary" className="text-base py-2 px-4" data-testid={`badge-neighborhood-${idx}`}>
                  <Home className="w-4 h-4 mr-2" />
                  {neighborhood}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      <ReviewsSection 
        title={`What ${cityName} Customers Say`}
        maxReviews={3}
        minRating={4}
      />

      {faqs.length > 0 && (
        <FAQSection faqs={faqs} title={`Common Plumbing Questions in ${cityName}`} />
      )}

      <ContactFormSection 
        title={`Get a Free Estimate in ${cityName}`}
        defaultLocation={cityName}
      />

      <section className="py-12 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Nearby Service Areas
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
            {nearbyCities.filter(city => city.name !== cityName).map((city, idx) => (
              <Button 
                key={idx}
                asChild 
                variant="outline"
                data-testid={`button-nearby-${idx}`}
              >
                <Link href={city.path}>
                  <MapPin className="w-4 h-4 mr-2" />
                  {city.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
