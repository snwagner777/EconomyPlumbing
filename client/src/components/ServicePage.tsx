import { Link } from "@/lib/routing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone, CheckCircle, ArrowRight, Home } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactFormSection from "@/components/ContactFormSection";
import ReviewsSection from "@/components/ReviewsSection";
import InlineBlogCard from "@/components/InlineBlogCard";
import RelatedBlogPosts from "@/components/RelatedBlogPosts";
import { SEOHead } from "@/components/SEO/SEOHead";
import { createFAQSchema, createServiceSchema, createBreadcrumbListSchema } from "@/components/SEO/JsonLd";
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig, useMarbleFallsPhone } from "@/hooks/usePhoneConfig";

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

interface SignItem {
  title: string;
  description: string;
}

interface MaintenanceTip {
  title: string;
  description: string;
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
  reviewsCategory?: string;
  reviewsTitle?: string;
  blogCategory?: string;
  signsTitle?: string;
  signs?: SignItem[];
  maintenanceTitle?: string;
  maintenanceTips?: MaintenanceTip[];
  additionalContent?: {
    title: string;
    content: string;
  };
  customSection?: React.ReactNode;
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
  reviewsCategory,
  reviewsTitle,
  blogCategory,
  signsTitle,
  signs,
  maintenanceTitle,
  maintenanceTips,
  additionalContent,
  customSection,
}: ServicePageProps) {
  const phoneConfig = usePhoneConfig();
  const marbleFallsPhoneConfig = useMarbleFallsPhone();
  const serviceSchema = createServiceSchema(heroTitle, metaDescription, canonical);
  const breadcrumbSchema = createBreadcrumbListSchema([
    { name: "Home", url: "https://www.plumbersthatcare.com" },
    { name: "Services", url: "https://www.plumbersthatcare.com/services" },
    { name: heroTitle, url: canonical }
  ]);
  const schemas = faqs.length > 0 
    ? [serviceSchema, createFAQSchema(faqs), breadcrumbSchema] 
    : [serviceSchema, breadcrumbSchema];

  return (
    <div className="min-h-screen">
      <SEOHead
        title={title}
        description={metaDescription}
        canonical={canonical}
        schema={schemas}
      />

      <Header />

      {/* Breadcrumbs */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground" data-testid="nav-breadcrumbs">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-foreground flex items-center gap-1" data-testid="link-breadcrumb-home">
                  <Home className="w-4 h-4" />
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/services" className="hover:text-foreground" data-testid="link-breadcrumb-services">
                  Services
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground" data-testid="text-breadcrumb-current">{heroTitle}</li>
            </ol>
          </nav>
        </div>
      </div>

      <section className="relative min-h-[400px] lg:min-h-[500px] flex items-center">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt={heroImageAlt}
            width="1920"
            height="1080"
            fetchpriority="high"
            decoding="async"
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
                <a href={phoneConfig.tel} className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call Now: {phoneConfig.display}
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

          {blogCategory && (
            <div className="max-w-5xl mx-auto mb-8">
              <InlineBlogCard category={blogCategory} />
            </div>
          )}

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

      {signs && signs.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
              {signsTitle || "Signs You Need Service"}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {signs.map((sign, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    {sign.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">{sign.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {additionalContent && (
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-8">
              {additionalContent.title}
            </h2>
            <div className="prose prose-lg max-w-none text-muted-foreground">
              {additionalContent.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {maintenanceTips && maintenanceTips.length > 0 && (
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
              {maintenanceTitle || "Maintenance Tips"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {maintenanceTips.map((tip, index) => (
                <Card key={index} className="p-6">
                  <h3 className="text-lg font-semibold mb-3">{tip.title}</h3>
                  <p className="text-muted-foreground">{tip.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {customSection && customSection}

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
              <a href={phoneConfig.tel} className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Austin: {phoneConfig.display}
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-primary bg-white border-white hover:bg-white/90"
              asChild
              data-testid="button-call-marble-falls-cta"
            >
              <a href={marbleFallsPhoneConfig.tel} className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Marble Falls: {marbleFallsPhoneConfig.display}
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

      {reviewsCategory && (
        <ReviewsSection 
          category={reviewsCategory}
          title={reviewsTitle || "Customer Reviews"}
          maxReviews={3}
          minRating={4}
        />
      )}

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
                    <span className="text-sm">Learn more about {service.title}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Related Blog Posts - adds internal links to blog posts for better SEO */}
      {blogCategory && (
        <RelatedBlogPosts category={blogCategory} limit={3} title="Helpful Articles & Tips" />
      )}

      <Footer />
    </div>
  );
}
