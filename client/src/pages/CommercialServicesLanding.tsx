import { useEffect } from "react";
import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEO/SEOHead";
import { 
  Phone, Clock, Shield, Award, Building2, CheckCircle2, 
  Wrench, AlertCircle, DollarSign, Users, TrendingDown,
  Calendar, FileCheck, Zap, ThumbsUp, Star, MapPin
} from "lucide-react";
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

export default function CommercialServicesLanding() {
  const phoneConfig = usePhoneConfig();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // LocalBusiness Schema for SEO
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": "Economy Plumbing Services - Commercial Division",
    "image": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "description": "Commercial plumbing services for restaurants, offices, and businesses in Austin and Marble Falls. Emergency repairs, grease trap best practices, water heater service, preventive maintenance.",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Austin",
      "addressRegion": "TX",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 30.2672,
      "longitude": -97.7431
    },
    "telephone": phoneConfig.tel,
    "priceRange": "$$",
    "openingHours": "Mo-Su 00:00-24:00",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "150"
    },
    "areaServed": [
      { "@type": "City", "name": "Austin", "containedInPlace": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Marble Falls", "containedInPlace": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Round Rock", "containedInPlace": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Cedar Park", "containedInPlace": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Georgetown", "containedInPlace": { "@type": "State", "name": "Texas" } },
      { "@type": "City", "name": "Lakeway", "containedInPlace": { "@type": "State", "name": "Texas" } }
    ]
  };

  return (
    <>
      <SEOHead
        title="Commercial Plumbing Austin TX | Economy Plumbing Services"
        description="Austin & Marble Falls commercial plumber for restaurants, offices & businesses. 25% off first service for new customers. Same-day emergency repairs. (512) 368-9159."
        canonical="https://www.plumbersthatcare.com/commercial-services"
        schema={localBusinessSchema}
      />
      
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero Section with Special Offer */}
        <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-20">
          <div className="absolute inset-0 bg-black/20"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Special Offer Badge */}
              <div className="flex justify-center mb-6">
                <Badge 
                  className="bg-accent text-accent-foreground px-6 py-2 text-base font-semibold animate-pulse"
                  data-testid="badge-special-offer"
                >
                  <Award className="w-4 h-4 mr-2" />
                  NEW BUSINESS CUSTOMER SPECIAL: 25% OFF First Service
                </Badge>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-6" data-testid="text-hero-title">
                Stop Facility Downtime with Commercial Plumbing You Can Trust
              </h1>
              
              <p className="text-xl lg:text-2xl text-white/90 text-center mb-8" data-testid="text-hero-subtitle">
                Serving restaurants, offices, and businesses in Austin & Marble Falls with 24/7 emergency service, preventive maintenance, and health code compliance
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary border-white text-lg px-8 py-6 h-auto"
                  asChild
                  data-testid="button-call-now"
                >
                  <a href={`tel:${phoneConfig.tel}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Call {phoneConfig.display} Now
                  </a>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white text-lg px-8 py-6 h-auto"
                  onClick={openScheduler}
                  data-testid="button-schedule"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Service Online
                </Button>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.9/5 Stars</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>24/7 Emergency Service</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>Since 2012</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Welcome Message */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Thanks for Scanning Our Card!
              </h2>
              <p className="text-lg text-muted-foreground">
                We're excited to introduce ourselves and show you how we can help protect your business from plumbing emergencies. Economy Plumbing has been serving Austin and Marble Falls commercial properties since 2012, and we'd love the opportunity to earn your business with reliable, professional service you can count on.
              </p>
            </div>
          </div>
        </section>

        {/* Business Pain Points */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                We Understand Your Business Challenges
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                Plumbing issues cost you money every minute they're not fixed
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-2">
                  <CardHeader>
                    <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mb-4">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <CardTitle>Facility Downtime = Lost Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      A closed kitchen or bathroom costs thousands per hour. We provide fast emergency response with same-day repairs to get you back in business.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                      <FileCheck className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Health Code Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Failed inspections shut you down. Our licensed plumbers ensure all work meets city codes and keeps your facility compliant.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardHeader>
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                      <DollarSign className="w-6 h-6 text-accent" />
                    </div>
                    <CardTitle>Predictable Budgeting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      No hidden fees or surprise charges. Upfront pricing and maintenance contracts help you budget accurately and prevent costly emergencies.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Commercial Services */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Specialized Commercial Plumbing Services
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                Tailored solutions for restaurants, offices, retail, and multi-unit properties
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">Restaurant & Commercial Kitchen</CardTitle>
                        <p className="text-muted-foreground">
                          • Grease trap best practices & maintenance<br/>
                          • Drain line hydro jetting<br/>
                          • Water heater repair & replacement<br/>
                          • Emergency backflow prevention<br/>
                          • Health code compliance support
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">24/7 Emergency Response</CardTitle>
                        <p className="text-muted-foreground">
                          • Burst pipes & water leaks<br/>
                          • Sewer line backups<br/>
                          • Water heater failures<br/>
                          • Toilet & fixture emergencies<br/>
                          • Fast emergency response
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">Preventive Maintenance Plans</CardTitle>
                        <p className="text-muted-foreground">
                          • Monthly or quarterly service<br/>
                          • Video drain inspections<br/>
                          • Water heater tune-ups<br/>
                          • Backflow testing & certification<br/>
                          • Priority emergency service
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="mb-2">Multi-Location Support</CardTitle>
                        <p className="text-muted-foreground">
                          • Consistent service across all sites<br/>
                          • Centralized billing & reporting<br/>
                          • Dedicated account manager<br/>
                          • Online service tracking<br/>
                          • Volume discounts available
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>

              <div className="text-center">
                <Button size="lg" onClick={openScheduler} data-testid="button-get-quote">
                  <Calendar className="w-5 h-5 mr-2" />
                  Get Free Facility Assessment
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Cost Savings / ROI Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Preventive Maintenance Saves You Money
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                Small investments in maintenance prevent expensive emergency repairs
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="text-center">
                  <CardHeader>
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingDown className="w-8 h-8 text-accent" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Save Up to 70%</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Proper drain line maintenance prevents $5K+ sewer backups. Regular preventive service costs just $200-400/month.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Zero Downtime</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Scheduled maintenance happens during off-hours. No disruption to business operations or customer service.
                    </p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardHeader>
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="w-8 h-8 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl mb-2">Avoid Violations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Stay compliant with city health codes. Our maintenance includes backflow testing, grease trap best practices, and inspection prep.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-12 p-8 bg-primary/5 rounded-lg border-2 border-primary/20">
                <h3 className="text-2xl font-bold text-center mb-6">
                  Commercial VIP Membership
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      VIP Benefits Include:
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Priority service for emergencies</li>
                      <li>• Membership savings on every service item</li>
                      <li>• Yearly plumbing inspection at no charge</li>
                      <li>• No auto-renewal - no obligation</li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-bold text-primary mb-2">$119</p>
                      <p className="text-muted-foreground mb-1">One-time annual fee</p>
                      <p className="text-sm text-muted-foreground mb-4">Save on every service call + free annual inspection</p>
                      <Button className="mt-4" asChild data-testid="button-vip-membership">
                        <Link href="/store/checkout/commercial-vip">
                          Enroll Your Business Today
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B2B Testimonials */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                Trusted by Local Businesses
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <CardTitle className="text-lg">Sarah Martinez</CardTitle>
                    <p className="text-sm text-muted-foreground">Restaurant Manager, Austin</p>
                    <Badge variant="outline" className="w-fit mt-2">Restaurant</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      "Our kitchen drains were backing up weekly. Economy helped us implement proper maintenance practices and we haven't had a single issue in 8 months. Saved us at least $5,000 in emergency calls."
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <CardTitle className="text-lg">David Chen</CardTitle>
                    <p className="text-sm text-muted-foreground">Facility Manager, Round Rock</p>
                    <Badge variant="outline" className="w-fit mt-2">Office Building</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      "Water heater failed on a Friday afternoon. They arrived in 45 minutes, had it replaced by end of day. No weekend without hot water for our tenants. Excellent emergency response."
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <CardTitle className="text-lg">Michael Johnson</CardTitle>
                    <p className="text-sm text-muted-foreground">Property Owner, Marble Falls</p>
                    <Badge variant="outline" className="w-fit mt-2">Multi-Unit</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      "We use them for all 3 of our commercial properties. Consistent quality, great pricing, and they actually show up when scheduled. Rare to find that reliability."
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Common Questions from Business Owners
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                Everything you need to know about our commercial services
              </p>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    Do you offer same-day emergency service for businesses?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes, we provide 24/7 emergency service for commercial clients. We understand that plumbing downtime costs you money, so we prioritize business emergencies. Call {phoneConfig.display} anytime, day or night.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    What's included in the 25% off new customer offer?
                  </AccordionTrigger>
                  <AccordionContent>
                    New business customers receive 25% off their first service call, including labor and parts (maximum savings of $200). This applies to repairs, installations, or our initial facility assessment. Offer valid for commercial properties only. Cannot be combined with other discounts.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    Are you licensed and insured for commercial work?
                  </AccordionTrigger>
                  <AccordionContent>
                    Absolutely. We are fully licensed master plumbers in Texas with comprehensive commercial liability insurance and workers' comp coverage. We also carry all required city permits and certifications for commercial plumbing work, including backflow testing and grease trap maintenance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    Can you work during off-hours to avoid disrupting business?
                  </AccordionTrigger>
                  <AccordionContent>
                    Absolutely. We schedule preventive maintenance during your off-peak hours - early morning, late evening, or weekends. For restaurants, we can work before opening or after closing. For offices, we offer weekend service. Your business operations come first.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    How do you handle billing for commercial accounts?
                  </AccordionTrigger>
                  <AccordionContent>
                    Payment is required at the time of service. We accept all major credit cards, debit cards, checks, and cash. You'll receive detailed invoicing with line-item breakdowns for your records, and we can provide consolidated invoices for multiple properties.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Commercial Plumbing Service Areas
              </h2>
              <p className="text-xl text-muted-foreground text-center mb-12">
                Proudly serving businesses throughout Central Texas
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
                {[
                  "Austin", "Marble Falls", "Round Rock", "Cedar Park",
                  "Georgetown", "Lakeway", "Pflugerville", "Leander",
                  "Dripping Springs", "Bee Cave", "Kyle", "Buda"
                ].map((city) => (
                  <div key={city} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="font-medium">{city}</span>
                  </div>
                ))}
              </div>

              <div className="text-center text-muted-foreground">
                <p>Don't see your city? We also serve surrounding areas. Call to confirm service availability.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA with Special Offer */}
        <section className="py-20 bg-primary text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge 
                className="bg-accent text-accent-foreground px-6 py-2 text-base font-semibold mb-6"
                data-testid="badge-offer-reminder"
              >
                <Award className="w-4 h-4 mr-2" />
                Limited Time: 25% OFF for New Business Customers
              </Badge>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Protect Your Business from Plumbing Emergencies?
              </h2>
              
              <p className="text-xl text-white/90 mb-8">
                Join hundreds of local businesses who trust Economy Plumbing for reliable, code-compliant service
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-primary border-white text-lg px-8 py-6 h-auto"
                  asChild
                  data-testid="button-cta-call"
                >
                  <a href={`tel:${phoneConfig.tel}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Call {phoneConfig.display} Now
                  </a>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white text-lg px-8 py-6 h-auto"
                  onClick={openScheduler}
                  data-testid="button-cta-schedule"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule Free Assessment
                </Button>
              </div>
              
              <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No Obligation Quote</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Licensed & Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Same-Day Service Available</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
