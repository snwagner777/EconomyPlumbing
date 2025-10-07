import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone, CheckCircle, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactFormSection from "@/components/ContactFormSection";
import { SEOHead } from "@/components/SEO/SEOHead";
import { createFAQSchema, createServiceSchema } from "@/components/SEO/JsonLd";

declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
  }
}

interface FAQ {
  question: string;
  answer: string;
}

interface ServiceFeature {
  title: string;
  description: string;
}

interface RelatedService {
  title: string;
  path: string;
}

interface ServicePageProps {
  title: string;
  metaDescription: string;
  canonical: string;
  heroImage: string;
  heroImageAlt: string;
  heroTitle: string;
  heroSubtitle: string;
  overviewTitle: string;
  overviewDescription: string;
  benefits: string[];
  featuresTitle: string;
  features: ServiceFeature[];
  faqs: FAQ[];
  relatedServices: RelatedService[];
}

export default function ServicePage({
  title,
  metaDescription,
  canonical,
  heroImage,
  heroImageAlt,
  heroTitle,
  heroSubtitle,
  overviewTitle,
  overviewDescription,
  benefits,
  featuresTitle,
  features,
  faqs,
  relatedServices,
}: ServicePageProps) {
  const serviceSchema = createServiceSchema(heroTitle, metaDescription, canonical);
  const schemas = faqs.length > 0 ? [serviceSchema, createFAQSchema(faqs)] : [serviceSchema];

  return (
    <div className="min-h-screen">
      <SEOHead
        title={title}
        description={metaDescription}
        canonical={canonical}
        schema={schemas}
      />

      <Header />

      <section className="relative min-h-[400px] lg:min-h-[500px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={heroImageAlt}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              {heroTitle}
            </h1>
            <p className="text-xl text-white/90 mb-8">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                onClick={() => window.STWidgetManager && window.STWidgetManager("ws-open")}
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
                <a href="tel:5123689159" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call Now: (512) 368-9159
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">{overviewTitle}</h2>
            <p className="text-lg text-muted-foreground">
              {overviewDescription}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <p className="text-foreground">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            {featuresTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="p-6">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} data-testid={`accordion-item-${index}`}>
                <AccordionTrigger data-testid={`accordion-trigger-${index}`}>
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent data-testid={`accordion-content-${index}`}>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Contact Economy Plumbing Services today for reliable, professional service in Austin and Marble Falls.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              size="lg" 
              variant="outline"
              className="text-primary bg-white border-white hover:bg-white/90"
              asChild
              data-testid="button-call-austin-cta"
            >
              <a href="tel:5123689159" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Austin: (512) 368-9159
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-primary bg-white border-white hover:bg-white/90"
              asChild
              data-testid="button-call-marble-falls-cta"
            >
              <a href="tel:8304603565" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Marble Falls: (830) 460-3565
              </a>
            </Button>
          </div>

          <Button 
            size="lg"
            onClick={() => window.STWidgetManager && window.STWidgetManager("ws-open")}
            className="bg-white text-primary hover:bg-white/90"
            data-testid="button-schedule-cta"
          >
            Schedule Service Online
          </Button>
        </div>
      </section>

      <ContactFormSection 
        title="Request Your Free Estimate"
        description="Fill out the form below and we'll contact you within 1 hour during business hours to discuss your plumbing needs."
        pageContext={`${heroTitle} - Service Page`}
        className="py-16 lg:py-24 bg-muted/30"
      />

      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Related Services
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedServices.map((service) => (
              <Link key={service.path} href={service.path}>
                <Card className="p-6 hover-elevate cursor-pointer h-full" data-testid={`link-related-${service.path.slice(1)}`}>
                  <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                  <div className="flex items-center text-primary mt-4">
                    <span className="text-sm">Learn More</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
