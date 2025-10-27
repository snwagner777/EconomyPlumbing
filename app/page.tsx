import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import WhyChooseCard from "@/components/WhyChooseCard";
import ServiceAreaCard from "@/components/ServiceAreaCard";
import ReviewsSection from "@/components/ReviewsSection";
import ContactFormSection from "@/components/ContactFormSection";
import Footer from "@/components/Footer";
import SMSOptInWidget from "@/components/SMSOptInWidget";
import AIChatbot from "@/components/AIChatbot";
import {
  Droplets,
  Wind,
  Wrench,
  Bath,
  Building2,
  Flame,
  Shield,
  ArrowRight,
  DollarSign,
  BadgeCheck,
  Award,
  Users,
  CheckCircle,
  Truck,
} from "lucide-react";
import waterHeaterImage from "@assets/optimized/Tankless_water_heater_closeup_7279af49.webp";
import drainImage from "@assets/optimized/Drain_cleaning_professional_service_e8a953c5.webp";
import leakImage from "@assets/optimized/Leak_repair_service_work_cb3145cc.webp";
import toiletImage from "@assets/optimized/Toilet_and_faucet_installation_18dec30d.webp";
import commercialImage from "@assets/optimized/Commercial_plumbing_services_bd7b6306.webp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Script from "next/script";
import {
  localBusinessSchema,
  createFAQSchema,
  createMarbleFallsLocationSchema,
  createOrganizationSchema,
} from "@/components/SEO/JsonLd";
import type { Metadata } from "next";
import { Link } from "@/lib/routing";

const INTERNAL_URL = process.env.NEXT_INTERNAL_URL || "http://localhost:5000";

// Hardcoded fallback phone numbers (DO NOT USE - these are just for build/SSR defaults)
const DEFAULT_PHONE_CONFIG = { display: "(512) 368-9159", tel: "tel:+15123689159" };
const DEFAULT_MF_PHONE_CONFIG = { display: "(830) 265-7383", tel: "tel:+18302657383" };

export const metadata: Metadata = {
  title: "Economy Plumbing Austin TX | Licensed Experts Since 2005",
  description: "Trusted Austin plumbing experts since 2005. Water heater specialists, drain cleaning & emergency service. Licensed, insured, same-day. Call (512) 368-9159.",
  openGraph: {
    title: "Economy Plumbing Austin TX | Licensed Experts Since 2005",
    description: "Trusted Austin plumbing experts since 2005. Water heater specialists, drain cleaning & emergency service. Licensed, insured, same-day. Call (512) 368-9159.",
    url: "https://www.plumbersthatcare.com/",
    type: "website",
  },
};

export const revalidate = 60;

async function fetchPhoneConfig() {
  try {
    const response = await fetch(`${INTERNAL_URL}/api/tracking-numbers`, {
      next: { revalidate: 60 },
      cache: 'no-store'
    });
    if (response.ok) {
      const data = await response.json();
      if (data.austin && data.marbleFalls) {
        return { austin: data.austin, marbleFalls: data.marbleFalls };
      }
    }
  } catch (error) {
    console.error("Failed to fetch phone config:", error);
  }
  return { austin: DEFAULT_PHONE_CONFIG, marbleFalls: DEFAULT_MF_PHONE_CONFIG };
}

export default async function HomePage() {
  const phoneData = await fetchPhoneConfig();
  const marbleFallsSchemaData = createMarbleFallsLocationSchema();
  const organizationSchemaData = createOrganizationSchema();
  const faqSchemaData = createFAQSchema([
    {
      question: "What areas do you serve in Texas?",
      answer: "We serve Austin, Cedar Park, Leander, Round Rock, Georgetown, Pflugerville, Liberty Hill, Buda, Kyle, Marble Falls, Burnet, Horseshoe Bay, Kingsland, Granite Shoals, Bertram, and Spicewood.",
    },
    {
      question: "Do you offer emergency plumbing services?",
      answer: "Yes, we offer 24/7 emergency plumbing services throughout Central Texas. Call us anytime for urgent plumbing issues.",
    },
    {
      question: "Are your plumbers licensed and insured?",
      answer: "Absolutely. All our plumbers are fully licensed and insured to protect you and your property.",
    },
    {
      question: "Do you provide upfront pricing?",
      answer: "Yes, we believe in transparent pricing. We provide upfront estimates with no hidden fees before we begin any work.",
    },
  ]);

  const services = [
    {
      icon: Droplets,
      title: "Water Heater Services",
      description: "Installation, repair, and maintenance of traditional and tankless water heaters.",
      features: ["Same-day service", "All brands serviced", "Energy-efficient options"],
      link: "/water-heater-services",
      image: waterHeaterImage.src,
    },
    {
      icon: Wind,
      title: "Drain Cleaning",
      description: "Professional drain cleaning and sewer line services to keep your pipes flowing.",
      features: ["Video inspection", "Hydro jetting", "Root removal"],
      link: "/drain-cleaning",
      image: drainImage.src,
    },
    {
      icon: Wrench,
      title: "Leak Repair Services",
      description: "Professional leak repair services to fix all types of leaks and protect your property.",
      features: ["Fast leak repair", "Permanent solutions", "Insurance claims help"],
      link: "/leak-repair",
      image: leakImage.src,
    },
    {
      icon: Bath,
      title: "Toilet & Faucet Services",
      description: "Complete toilet and faucet installation, repair, and replacement services.",
      features: ["Modern fixtures", "Water-saving options", "Quick repairs"],
      link: "/toilet-faucet",
      image: toiletImage.src,
    },
    {
      icon: Building2,
      title: "Commercial Plumbing",
      description: "Comprehensive commercial plumbing services for businesses and properties.",
      features: ["Scheduled maintenance", "Emergency response", "Code compliance"],
      link: "/commercial-plumbing",
      image: commercialImage.src,
    },
    {
      icon: Flame,
      title: "Gas Services",
      description: "Professional gas line installation, repair, and safety inspections.",
      features: ["Licensed gas technicians", "Safety inspections", "New installations"],
      link: "/gas-line-services",
    },
    {
      icon: Shield,
      title: "Backflow Services",
      description: "Backflow prevention testing, repair, and certification services.",
      features: ["Annual testing", "Certified technicians", "City compliance"],
      link: "/backflow",
    },
  ];

  const whyChoose = [
    {
      icon: DollarSign,
      title: "Free Estimates",
      description: "Get honest, upfront pricing with no obligation. We provide detailed estimates before any work begins.",
    },
    {
      icon: BadgeCheck,
      title: "Licensed & Insured",
      description: "Fully licensed plumbers with comprehensive insurance coverage for your peace of mind.",
    },
    {
      icon: Award,
      title: "Upfront Pricing",
      description: "No hidden fees or surprises. We provide clear, honest pricing before any work begins.",
    },
    {
      icon: Users,
      title: "Expert Technicians",
      description: "Our experienced plumbers are trained on the latest techniques and equipment for quality results.",
    },
    {
      icon: CheckCircle,
      title: "Satisfaction Guarantee",
      description: "We stand behind our work with a 100% satisfaction guarantee on all services.",
    },
    {
      icon: Truck,
      title: "Fully Stocked Trucks",
      description: "Our service vehicles carry extensive inventory to complete most repairs on the first visit.",
    },
  ];

  return (
    <>
      {/* Inject phone config into window for client components */}
      <Script
        id="phone-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.__PHONE_CONFIG__ = ${JSON.stringify(phoneData)};`,
        }}
      />
      
      {/* ServiceTitan scheduler widget */}
      <Script
        id="servicetitan-widget"
        src="https://st-titan-api-prod-us-east-1.titan-us-east-1.aws.stg-titan.com/js-api/v1/client/st-widgets.js?id=3ce4a586-8427-4716-9ac6-46cb8bf7ac4f"
        strategy="afterInteractive"
      />

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marbleFallsSchemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }}
      />

      <div className="min-h-screen">
        <Header />
        <Hero />

        {/* Our Plumbing Services Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Our Plumbing Services
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                From routine maintenance to emergency repairs, we provide comprehensive plumbing solutions for homes and businesses throughout Central Texas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <ServiceCard key={service.title} {...service} />
              ))}
              
              <Card className="p-6 hover:shadow-xl transition-shadow border border-card-border bg-primary/5">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white mb-4">
                  <ArrowRight className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">View All Our Services</h3>
                <p className="text-muted-foreground mb-4">
                  Explore our complete range of plumbing services for your home or business.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Gas Line Services</span>
                  </li>
                  <li className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Backflow Prevention</span>
                  </li>
                  <li className="text-sm flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Emergency Plumbing</span>
                  </li>
                </ul>
                <Link 
                  href="/services" 
                  className="inline-flex items-center gap-2 text-foreground font-medium hover-elevate px-2 py-1 rounded-md"
                  data-testid="link-view-all-services"
                >
                  View All Services
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Why Choose Our Plumbing Services?
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                With decades of combined experience serving Central Texas, we deliver reliable plumbing solutions you can trust.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {whyChoose.map((item) => (
                <WhyChooseCard key={item.title} {...item} />
              ))}
            </div>

            <div className="text-center mt-12">
              <h3 className="text-2xl font-bold mb-6">Ready to Get Started?</h3>
              <p className="text-lg text-muted-foreground mb-6">
                Contact us today for your free estimate and reliable plumbing services in Austin and Marble Falls areas.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary"
                  data-testid="button-call-austin-cta"
                >
                  <a href={phoneData.austin.tel}>Call Austin: {phoneData.austin.display}</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  data-testid="button-call-marble-falls-cta"
                >
                  <a href={phoneData.marbleFalls.tel}>Call Marble Falls: {phoneData.marbleFalls.display}</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <ReviewsSection />

        {/* Service Areas Section */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Our Service Areas
              </h2>
              <p className="text-lg text-muted-foreground">
                Economy Plumbing Services proudly serves homeowners across Burnet, Williamson, and Travis Counties with two convenient locations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <ServiceAreaCard
                title="Austin Metro Area"
                address="701 Tillery St #12, Austin, TX 78702"
                phone={phoneData.austin.display}
                cities={[
                  "Austin",
                  "Cedar Park",
                  "Leander",
                  "Round Rock",
                  "Georgetown",
                  "Pflugerville",
                  "Liberty Hill",
                  "Buda",
                  "Kyle",
                ]}
              />
              <ServiceAreaCard
                title="Marble Falls Area"
                address="2409 Commerce Street, Marble Falls, TX 78654"
                phone={phoneData.marbleFalls.display}
                cities={[
                  "Marble Falls",
                  "Burnet",
                  "Horseshoe Bay",
                  "Kingsland",
                  "Granite Shoals",
                  "Bertram",
                  "Spicewood",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <ContactFormSection />
        
        {/* SMS Opt-In Widget */}
        <SMSOptInWidget />
        
        {/* AI Chatbot */}
        <AIChatbot />

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
