import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactFormSection from "@/components/ContactFormSection";
import { SEOHead } from "@/components/SEO/SEOHead";
import { JsonLd } from "@/components/SEO/JsonLd";
import { getCoordinates } from "@shared/serviceAreaCoordinates";
import defaultHeroImage from "@assets/optimized/plumber_working_resi_a03913c7.webp";
import { openScheduler } from "@/lib/scheduler";
import type { PhoneConfig } from "@/server/lib/phoneNumbers";

interface NearbyCity {
  name: string;
  path: string;
}

interface ServiceAreaPageProps {
  city: string;
  state: string;
  slug: string;
  metaDescription: string;
  canonical: string;
  area: "austin" | "marble-falls";
  nearbyCities: NearbyCity[];
  heroImage?: string;
  heroSubtitle?: string;
  cityHighlight?: string;
  phoneConfig?: PhoneConfig;
  marbleFallsPhoneConfig?: PhoneConfig;
}

const SERVICES = [
  { name: "Water Heater Services", path: "/water-heater-services" },
  { name: "Drain Cleaning", path: "/drain-cleaning" },
  { name: "Leak Repair", path: "/leak-repair" },
  { name: "Toilet & Faucet Services", path: "/toilet-faucet" },
  { name: "Gas Services", path: "/gas-line-services" },
  { name: "Backflow Services", path: "/backflow" },
  { name: "Commercial Plumbing", path: "/commercial-plumbing" },
];

export default function ServiceAreaPage({
  city,
  state,
  slug,
  metaDescription,
  canonical,
  area,
  nearbyCities,
  heroImage,
  heroSubtitle,
  cityHighlight,
  phoneConfig: phoneConfigProp,
  marbleFallsPhoneConfig: marbleFallsPhoneConfigProp,
}: ServiceAreaPageProps) {
  // Phone configs must be passed from server-side (SSR)
  if (!phoneConfigProp || !marbleFallsPhoneConfigProp) {
    throw new Error('ServiceAreaPage requires phoneConfig and marbleFallsPhoneConfig props for SSR');
  }
  const austinPhoneConfig = phoneConfigProp;
  const marbleFallsPhoneConfig = marbleFallsPhoneConfigProp;
  const phone = area === "austin" ? austinPhoneConfig.display : marbleFallsPhoneConfig.display;
  const phoneLink = area === "austin" ? austinPhoneConfig.tel : marbleFallsPhoneConfig.tel;
  const areaName = area === "austin" ? "Austin Metro" : "Marble Falls";
  const displayHeroImage = heroImage || defaultHeroImage.src;
  const displaySubtitle = heroSubtitle || `Expert plumbing services for ${city} residents. Same-day service, upfront pricing, and 100% satisfaction guaranteed.`;

  const coordinates = getCoordinates(slug);
  const schemaPhone = area === "austin" ? austinPhoneConfig.tel.replace('tel:', '') : marbleFallsPhoneConfig.tel.replace('tel:', '');

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": `Economy Plumbing Services - ${city}`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city,
      "addressRegion": state,
      "addressCountry": "US"
    },
    "telephone": schemaPhone,
    "geo": coordinates ? {
      "@type": "GeoCoordinates",
      "latitude": coordinates.latitude,
      "longitude": coordinates.longitude
    } : undefined,
    "areaServed": {
      "@type": "City",
      "name": city,
      "containedIn": { "@type": "State", "name": "Texas" }
    },
    "url": `https://www.plumbersthatcare.com/service-areas/${slug}`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.3",
      "reviewCount": "495",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title={`Professional Plumber in ${city}, ${state} | Economy Plumbing`}
        description={metaDescription}
        canonical={canonical}
      />

      <JsonLd data={localBusinessSchema} />

      <Header />

      <section className="relative min-h-[400px] lg:min-h-[500px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={displayHeroImage}
            alt={`Professional plumbing services in ${city}, Texas`}
            width="1920"
            height="1080"
            fetchPriority="high"
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
                {areaName} Area
              </span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4" data-testid="heading-city">
              Professional Plumber in {city}, {state}
            </h1>
            <p className="text-xl text-white/90 mb-8" data-testid="text-hero-subtitle">
              {displaySubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={openScheduler}
                className="bg-primary text-primary-foreground"
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
                <a href={phoneLink} className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call Now: {phone}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-services">
              Plumbing Services in {city}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Economy Plumbing Services provides comprehensive plumbing solutions to {city} homeowners and businesses.
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

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6" data-testid="heading-why-choose">
                Why Choose Economy Plumbing in {city}?
              </h2>
              {cityHighlight && (
                <p className="text-lg text-muted-foreground mb-6" data-testid="text-city-highlight">
                  {cityHighlight}
                </p>
              )}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">Licensed & insured plumbers with extensive experience</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">Same-day service available for {city} residents</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">Upfront pricing with no hidden fees</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">100% satisfaction guarantee on all work</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">Emergency plumbing services available</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-foreground">Fully stocked service vehicles for faster repairs</p>
                </div>
              </div>
            </div>

            <Card className="p-8 bg-primary/5">
              <h3 className="text-2xl font-bold mb-6" data-testid="heading-contact">Contact Us in {city}</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Call us today</p>
                  <a 
                    href={phoneLink}
                    className="flex items-center gap-2 text-foreground font-poppins font-bold text-2xl hover-elevate px-2 py-1 rounded-md w-fit"
                    data-testid="link-phone-contact"
                  >
                    <Phone className="w-6 h-6" />
                    {phone}
                  </a>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Service area</p>
                  <p className="text-foreground font-medium">{city} and surrounding areas</p>
                </div>
                <Button 
                  onClick={openScheduler}
                  className="w-full bg-primary"
                  size="lg"
                  data-testid="button-schedule-contact"
                >
                  Schedule Service Online
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

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
            Need a Plumber in {city}?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Contact Economy Plumbing Services today for fast, reliable service in {city}, {state}.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              variant="outline"
              className="text-primary bg-white border-white hover:bg-white/90"
              asChild
              data-testid="button-call-cta"
            >
              <a href={phoneLink} className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Call: {phone}
              </a>
            </Button>
          </div>

          <Button 
            size="lg"
            onClick={openScheduler}
            className="bg-white text-primary hover:bg-white/90"
            data-testid="button-schedule-cta"
          >
            Schedule Service Online
          </Button>
        </div>
      </section>

      <ContactFormSection 
        title={`Request Service in ${city}`}
        description={`Fill out the form and we'll contact you within 1 hour to discuss your plumbing needs in ${city}.`}
        defaultLocation={city}
        pageContext={`${city} Service Area Page`}
        phoneNumber={phone}
        phoneLabel={areaName}
        phoneTel={phoneLink}
        className="py-16 lg:py-24"
      />

      <Footer />
    </div>
  );
}
