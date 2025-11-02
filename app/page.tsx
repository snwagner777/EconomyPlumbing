import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import { storage } from '@/server/storage';
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import ServiceAreaCard from "@/components/ServiceAreaCard";
import ReviewsSection from "@/components/ReviewsSection";
import ContactForm from "@/components/ContactForm";
import { ServiceCardSSR } from '@/components/ServiceCardSSR';
import { WhyChooseCardSSR } from '@/components/WhyChooseCardSSR';
import { PhoneLink } from '@/components/PhoneLink';
import { SchedulerButton } from '@/components/SchedulerButton';
import Link from "next/link";
import {
  Droplets,
  Wind,
  Wrench,
  Bath,
  Building2,
  Shield,
  ArrowRight,
  DollarSign,
  BadgeCheck,
  Award,
  Users,
  CheckCircle,
  Truck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  createLocalBusinessSchema,
  createFAQSchema,
  createMarbleFallsLocationSchema,
  createOrganizationSchema,
} from "@/components/SEO/JsonLd";

/**
 * Homepage - Server Component with Database-Driven Metadata
 * 
 * Metadata managed through admin panel at /admin/metadata
 * Phone numbers server-rendered for SEO, upgraded client-side for tracking
 */

interface HomePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const metadata = await getPageMetadata('/', {
    title: 'Professional Plumbing Services in Austin & Central Texas | Economy Plumbing',
    description: 'Expert plumbing services in Austin, Cedar Park, Leander, Round Rock, Georgetown, Pflugerville, Marble Falls & surrounding areas. 24/7 emergency service, licensed & insured. Call now for fast, reliable plumbing solutions.',
    ogImage: 'https://plumbersthatcare.com/attached_assets/logo.jpg',
    ogType: 'website',
  });
  
  // Metadata system already provides canonical URL, Open Graph, and Twitter tags
  return metadata;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Await searchParams (Next.js 15 requirement)
  const params = await searchParams;
  
  // Convert to URLSearchParams for phone number resolution
  const urlParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      const stringValue = Array.isArray(value) ? value[0] : value;
      if (stringValue) urlParams.set(key, stringValue);
    }
  });
  
  // Fetch phone numbers server-side with UTM-based tracking for SEO
  // Crawlers will see the correct tracking number in the HTML!
  const { austin, marbleFalls } = await getPhoneNumbers(urlParams);
  
  // Fetch recent 5-star reviews for enhanced SEO
  let reviews: any[] = [];
  try {
    const allReviews = await storage.getGoogleReviews();
    reviews = allReviews
      .filter(r => r.rating >= 4 && r.text && r.text.trim().length > 0)
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 10);
  } catch (error) {
    console.error('[Homepage] Error fetching reviews for SEO:', error);
  }
  
  const services = [
    {
      icon: Droplets,
      title: "Water Heater Services",
      description: "Installation, repair, and maintenance of traditional and tankless water heaters.",
      features: ["Same-day service", "All brands serviced", "Energy-efficient options"],
      link: "/water-heater-services",
      image: "/attached_assets/optimized/Tankless_water_heater_closeup_7279af49.webp",
    },
    {
      icon: Wind,
      title: "Drain Cleaning",
      description: "Professional drain cleaning and sewer line services to keep your pipes flowing.",
      features: ["Video inspection", "Hydro jetting", "Root removal"],
      link: "/drain-cleaning",
      image: "/attached_assets/optimized/Drain_cleaning_professional_service_e8a953c5.webp",
    },
    {
      icon: Wrench,
      title: "Leak Repair Services",
      description: "Professional leak repair services to fix all types of leaks and protect your property.",
      features: ["Fast leak repair", "Permanent solutions", "Insurance claims help"],
      link: "/leak-repair",
      image: "/attached_assets/optimized/Leak_repair_service_work_cb3145cc.webp",
    },
    {
      icon: Bath,
      title: "Toilet & Faucet Services",
      description: "Complete toilet and faucet installation, repair, and replacement services.",
      features: ["Modern fixtures", "Water-saving options", "Quick repairs"],
      link: "/toilet-faucet",
      image: "/attached_assets/optimized/Toilet_and_faucet_installation_18dec30d.webp",
    },
    {
      icon: Building2,
      title: "Commercial Plumbing",
      description: "Specialized commercial plumbing services for businesses and property managers.",
      features: ["Preventive maintenance", "24/7 emergency response", "Minimal business disruption"],
      link: "/commercial-plumbing",
      image: "/attached_assets/optimized/Commercial_plumbing_services_bd7b6306.webp",
    },
  ];

  const whyChoose = [
    {
      icon: Shield,
      title: "Licensed & Insured",
      description: "All our plumbers are fully licensed and insured. We meet and exceed all state requirements.",
    },
    {
      icon: Award,
      title: "Quality Workmanship",
      description: "We take pride in delivering top-quality workmanship on every job, big or small.",
    },
    {
      icon: DollarSign,
      title: "Transparent Pricing",
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

  // Prepare JSON-LD schemas for SEO with real reviews
  const schemas = [
    createLocalBusinessSchema(undefined, reviews.slice(0, 5)),
    createMarbleFallsLocationSchema(),
    createOrganizationSchema(),
    createFAQSchema([
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
    ]),
  ];

  return (
    <div className="min-h-screen">
      {/* JSON-LD Structured Data for SEO */}
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      
      <Header austinPhone={austin} marbleFallsPhone={marbleFalls} />
      <Hero austinPhone={austin} />

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
            {services.slice(0, 5).map((service) => (
              <ServiceCardSSR key={service.title} {...service} />
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

          <div className="text-center mt-12">
            <SchedulerButton
              size="lg"
              className="bg-primary"
              data-testid="button-schedule-services"
            >
              Schedule Service Today
            </SchedulerButton>
          </div>
        </div>
      </section>

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
              <WhyChooseCardSSR key={item.title} {...item} />
            ))}
          </div>

          <div className="text-center mt-12">
            <h3 className="text-2xl font-bold mb-6">Ready to Get Started?</h3>
            <p className="text-lg text-muted-foreground mb-6">
              Contact us today for your free estimate and reliable plumbing services in Austin and Marble Falls areas.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <PhoneLink
                location="austin"
                size="lg"
                className="bg-primary"
                data-testid="button-call-austin-cta"
                initialDisplay={austin.display}
                initialTel={austin.tel}
              />
              <PhoneLink
                location="marble-falls"
                size="lg"
                variant="outline"
                data-testid="button-call-marble-falls-cta"
                initialDisplay={marbleFalls.display}
                initialTel={marbleFalls.tel}
              />
            </div>
          </div>
        </div>
      </section>

      <ReviewsSection 
        title="What Our Customers Say"
        maxReviews={3}
        minRating={4}
      />

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
              phone={austin.display}
              cities={["Austin", "Cedar Park", "Leander", "Round Rock", "Georgetown", "Pflugerville", "Liberty Hill", "Buda", "Kyle"]}
            />
            <ServiceAreaCard
              title="Marble Falls Area"
              address="2409 Commerce Street, Marble Falls, TX 78654"
              phone={marbleFalls.display}
              cities={["Marble Falls", "Burnet", "Horseshoe Bay", "Kingsland", "Granite Shoals", "Bertram", "Spicewood"]}
            />
          </div>

          <div className="text-center mt-12">
            <Link
              href="/service-areas"
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
              data-testid="link-view-all-service-areas"
            >
              View All Service Areas
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Get In Touch
            </h2>
            <p className="text-lg text-muted-foreground">
              Have a plumbing question or need a quote? Fill out the form below and we'll get back to you promptly.
            </p>
          </div>

          <ContactForm austinPhone={austin} marbleFallsPhone={marbleFalls} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
