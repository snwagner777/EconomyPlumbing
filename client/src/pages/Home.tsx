import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ServiceCard from "@/components/ServiceCard";
import WhyChooseCard from "@/components/WhyChooseCard";
import ServiceAreaCard from "@/components/ServiceAreaCard";
import ReviewsSection from "@/components/ReviewsSection";
import ContactForm from "@/components/ContactForm";
import Footer from "@/components/Footer";
import {
  Droplets,
  Wind,
  Wrench,
  Bath,
  Building2,
  Flame,
  Shield,
  ArrowRight,
} from "lucide-react";
import {
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
import testimonial1 from "@assets/generated_images/Customer_testimonial_portrait_f033b456.png";
import testimonial2 from "@assets/generated_images/Female_customer_testimonial_f29d918d.png";
import testimonial3 from "@assets/generated_images/Senior_customer_testimonial_027f5302.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/SEO/SEOHead";
import { openScheduler } from "@/lib/scheduler";
import {
  localBusinessSchema,
  createFAQSchema,
} from "@/components/SEO/JsonLd";

export default function Home() {
  const faqSchema = createFAQSchema([
    {
      question: "What areas do you serve in Texas?",
      answer:
        "We serve Austin, Cedar Park, Leander, Round Rock, Georgetown, Pflugerville, Liberty Hill, Buda, Kyle, Marble Falls, Burnet, Horseshoe Bay, Kingsland, Granite Shoals, Bertram, and Spicewood.",
    },
    {
      question: "Do you offer emergency plumbing services?",
      answer:
        "Yes, we offer 24/7 emergency plumbing services throughout Central Texas. Call us anytime for urgent plumbing issues.",
    },
    {
      question: "Are your plumbers licensed and insured?",
      answer:
        "Absolutely. All our plumbers are fully licensed and insured to protect you and your property.",
    },
    {
      question: "Do you provide upfront pricing?",
      answer:
        "Yes, we believe in transparent pricing. We provide upfront estimates with no hidden fees before we begin any work.",
    },
  ]);

  const services = [
    {
      icon: Droplets,
      title: "Water Heater Services",
      description:
        "Installation, repair, and maintenance of traditional and tankless water heaters.",
      features: [
        "Same-day service",
        "All brands serviced",
        "Energy-efficient options",
      ],
      link: "/water-heater-services",
      image: waterHeaterImage,
    },
    {
      icon: Wind,
      title: "Drain Cleaning",
      description:
        "Professional drain cleaning and sewer line services to keep your pipes flowing.",
      features: ["Video inspection", "Hydro jetting", "Root removal"],
      link: "/drain-cleaning",
      image: drainImage,
    },
    {
      icon: Wrench,
      title: "Leak Repair Services",
      description:
        "Professional leak repair services to fix all types of leaks and protect your property.",
      features: [
        "Fast leak repair",
        "Permanent solutions",
        "Insurance claims help",
      ],
      link: "/leak-repair",
      image: leakImage,
    },
    {
      icon: Bath,
      title: "Toilet & Faucet Services",
      description:
        "Complete toilet and faucet installation, repair, and replacement services.",
      features: ["Modern fixtures", "Water-saving options", "Quick repairs"],
      link: "/toilet-faucet",
      image: toiletImage,
    },
    {
      icon: Building2,
      title: "Commercial Plumbing",
      description:
        "Comprehensive commercial plumbing services for businesses and properties.",
      features: [
        "Scheduled maintenance",
        "Emergency response",
        "Code compliance",
      ],
      link: "/commercial-plumbing",
      image: commercialImage,
    },
    {
      icon: Flame,
      title: "Gas Services",
      description:
        "Professional gas line installation, repair, and safety inspections.",
      features: [
        "Licensed gas technicians",
        "Safety inspections",
        "New installations",
      ],
      link: "/gas-services",
    },
    {
      icon: Shield,
      title: "Backflow Services",
      description:
        "Backflow prevention testing, repair, and certification services.",
      features: ["Annual testing", "Certified technicians", "City compliance"],
      link: "/backflow",
    },
  ];

  const whyChoose = [
    {
      icon: DollarSign,
      title: "Free Estimates",
      description:
        "Get honest, upfront pricing with no obligation. We provide detailed estimates before any work begins.",
    },
    {
      icon: BadgeCheck,
      title: "Licensed & Insured",
      description:
        "Fully licensed plumbers with comprehensive insurance coverage for your peace of mind.",
    },
    {
      icon: Award,
      title: "Upfront Pricing",
      description:
        "No hidden fees or surprises. We provide clear, honest pricing before any work begins.",
    },
    {
      icon: Users,
      title: "Expert Technicians",
      description:
        "Our experienced plumbers are trained on the latest techniques and equipment for quality results.",
    },
    {
      icon: CheckCircle,
      title: "Satisfaction Guarantee",
      description:
        "We stand behind our work with a 100% satisfaction guarantee on all services.",
    },
    {
      icon: Truck,
      title: "Fully Stocked Trucks",
      description:
        "Our service vehicles carry extensive inventory to complete most repairs on the first visit.",
    },
  ];

  const testimonials = [
    {
      name: "Sean McCorkle",
      location: "Austin, TX",
      service: "Water Heater Repair",
      rating: 5,
      testimonial:
        "Sean was honest, communicated well and helped me understand the problem and solutions. Thanks Sean.",
      image: testimonial1,
    },
    {
      name: "Bill Farrior",
      location: "Austin, TX",
      service: "Emergency Service",
      rating: 5,
      testimonial:
        "I've always been happy with Sean's work. He earned my trust about 7 years ago when he showed up on a holiday to fix a backed up drain, and I've been using Economy Plumbing ever since!",
      image: testimonial1,
    },
    {
      name: "Jen Wall",
      location: "Austin, TX",
      service: "Water Heater Service",
      rating: 5,
      testimonial:
        "Sean from Economy Plumbing was quick, efficient, and very helpful. He serviced my tankless water heater and did a routine checkup, found a small issue and was able to repair it same day.",
      image: testimonial2,
    },
    {
      name: "Georgia Coleman",
      location: "Austin, TX",
      service: "Plumbing Repair",
      rating: 5,
      testimonial:
        "Great customer service from start to finish. Reasonable prices and great work.",
      image: testimonial2,
    },
    {
      name: "Glenn Prescott",
      location: "Austin, TX",
      service: "Emergency Repair",
      rating: 5,
      testimonial:
        "Stayed very late in order to Finish Job which helped my wife out big time! She needed to leave next morning. Just a fantastic job!!",
      image: testimonial3,
    },
    {
      name: "Krista Pettengill",
      location: "Austin, TX",
      service: "Plumbing Service",
      rating: 5,
      testimonial: "Great service and very knowledgeable!",
      image: testimonial2,
    },
  ];

  return (
    <>
      <SEOHead
        title="Economy Plumbing Services | Austin & Marble Falls Plumbers | Water Heater Experts"
        description="Austin & Marble Falls plumber. Water heater repair, drain cleaning, leak repair, emergency plumbing. Licensed experts. Same-day service. (512) 368-9159."
        canonical="https://plumbersthatcare.com/"
        schema={[localBusinessSchema, faqSchema]}
      />

      <div className="min-h-screen">
        <Header />
        <Hero />

        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Our Plumbing Services
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                From routine maintenance to emergency repairs, we provide
                comprehensive plumbing solutions for homes and businesses
                throughout Central Texas.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.slice(0, 5).map((service) => (
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
                <a 
                  href="#footer-services" 
                  className="inline-flex items-center gap-2 text-primary font-medium hover-elevate px-2 py-1 rounded-md"
                  data-testid="link-view-all-services"
                  onClick={(e) => {
                    e.preventDefault();
                    document.querySelector('footer')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View All Services
                  <ArrowRight className="w-4 h-4" />
                </a>
              </Card>
            </div>

            <div className="text-center mt-12">
              <Button
                onClick={openScheduler}
                size="lg"
                className="bg-primary"
                data-testid="button-schedule-services"
              >
                Schedule Service Today
              </Button>
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
                With decades of combined experience serving Central Texas, we
                deliver reliable plumbing solutions you can trust.
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
                Contact us today for your free estimate and reliable plumbing
                services in Austin and Marble Falls areas.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-primary"
                  data-testid="button-call-austin-cta"
                >
                  <a href="tel:+15123689159">Call Austin: (512) 368-9159</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  data-testid="button-call-marble-falls-cta"
                >
                  <a href="tel:+18304603565">Call Marble Falls: (830) 460-3565</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Our Service Areas
              </h2>
              <p className="text-lg text-muted-foreground">
                Economy Plumbing Services proudly serves homeowners across
                Burnet, Williamson, and Travis Counties with two convenient
                locations.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <ServiceAreaCard
                title="Austin Metro Area"
                address="701 Tillery St #12, Austin, TX 78702"
                phone="(512) 368-9159"
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
                phone="(830) 460-3565"
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

        <ReviewsSection 
          title="What Our Customers Say"
          maxReviews={3}
          minRating={4}
        />

        <ContactForm />
        <Footer />
      </div>
    </>
  );
}
