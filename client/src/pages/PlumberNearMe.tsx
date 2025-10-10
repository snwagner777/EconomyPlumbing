import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOHead } from "@/components/SEO/SEOHead";
import { 
  Phone, Clock, Shield, Award, MapPin, Star, CheckCircle2, 
  Wrench, Droplet, Flame, DollarSign, ThumbsUp, AlertCircle,
  Calendar, Users, TrendingUp
} from "lucide-react";
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

export default function PlumberNearMe() {
  const phoneConfig = usePhoneConfig();
  const [slotsRemaining, setSlotsRemaining] = useState(3);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Simulate limited slots (resets daily)
    const today = new Date().toDateString();
    const stored = localStorage.getItem('plumber-slots-date');
    if (stored !== today) {
      localStorage.setItem('plumber-slots-date', today);
      localStorage.setItem('plumber-slots-remaining', '3');
      setSlotsRemaining(3);
    } else {
      const remaining = parseInt(localStorage.getItem('plumber-slots-remaining') || '3');
      setSlotsRemaining(Math.max(1, remaining));
    }
  }, []);

  const handleCtaClick = () => {
    // Decrement slots when CTA is clicked to show scarcity
    const newSlots = Math.max(1, slotsRemaining - 1);
    setSlotsRemaining(newSlots);
    localStorage.setItem('plumber-slots-remaining', newSlots.toString());
  };

  // LocalBusiness Schema for SEO
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "Plumber",
    "name": "Economy Plumbing Services",
    "image": "https://www.plumbersthatcare.com/attached_assets/logo.jpg",
    "description": "Licensed and insured plumbing services in Austin and Marble Falls, Texas. 24/7 emergency plumber available. Water heater repair, drain cleaning, leak repair, and more.",
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
      {
        "@type": "City",
        "name": "Austin",
        "containedInPlace": {
          "@type": "State",
          "name": "Texas"
        }
      },
      {
        "@type": "City",
        "name": "Marble Falls",
        "containedInPlace": {
          "@type": "State",
          "name": "Texas"
        }
      },
      {
        "@type": "City",
        "name": "Cedar Park"
      },
      {
        "@type": "City",
        "name": "Round Rock"
      },
      {
        "@type": "City",
        "name": "Georgetown"
      },
      {
        "@type": "City",
        "name": "Leander"
      },
      {
        "@type": "City",
        "name": "Pflugerville"
      },
      {
        "@type": "City",
        "name": "Liberty Hill"
      },
      {
        "@type": "City",
        "name": "Buda"
      },
      {
        "@type": "City",
        "name": "Kyle"
      },
      {
        "@type": "City",
        "name": "Burnet"
      },
      {
        "@type": "City",
        "name": "Horseshoe Bay"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Plumbing Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Emergency Plumbing",
            "description": "24/7 emergency plumbing services"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Water Heater Repair",
            "description": "Water heater installation, repair, and replacement"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Drain Cleaning",
            "description": "Professional drain cleaning and unclogging"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Leak Repair",
            "description": "Fast leak detection and repair"
          }
        }
      ]
    }
  };

  const serviceAreas = [
    { name: "Austin", path: "/plumber-austin" },
    { name: "Marble Falls", path: "/plumber-marble-falls" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Round Rock", path: "/round-rock-plumber" },
    { name: "Georgetown", path: "/plumber-georgetown" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Pflugerville", path: "/plumber-pflugerville" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill" },
    { name: "Buda", path: "/plumber-buda" },
    { name: "Kyle", path: "/plumber-kyle" },
    { name: "Burnet", path: "/plumber-burnet" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay" }
  ];

  const howItWorks = [
    {
      step: 1,
      icon: Phone,
      title: "Call or Book Online",
      description: "Reach us 24/7 by phone or schedule online in 60 seconds"
    },
    {
      step: 2,
      icon: Users,
      title: "We Arrive Fast",
      description: "Same-day service available - typically within 90 minutes"
    },
    {
      step: 3,
      icon: Wrench,
      title: "Get It Fixed Right",
      description: "Expert diagnosis and repair with upfront pricing"
    },
    {
      step: 4,
      icon: ThumbsUp,
      title: "Guaranteed Results",
      description: "100% satisfaction guarantee on all work"
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      location: "Austin, TX",
      rating: 5,
      text: "Called at 7 PM with a burst pipe emergency. They arrived in 45 minutes and had it fixed within 2 hours. Saved our hardwood floors!",
      service: "Emergency Repair"
    },
    {
      name: "James T.",
      location: "Round Rock, TX",
      rating: 5,
      text: "Best plumber I've used in 20 years. Upfront pricing, no surprises. Water heater installed same day for $400 less than competitors quoted.",
      service: "Water Heater Installation"
    },
    {
      name: "Lisa R.",
      location: "Cedar Park, TX",
      rating: 5,
      text: "Professional, courteous, and incredibly fast. Fixed our backed-up drains and explained everything clearly. Will use them for all future plumbing needs.",
      service: "Drain Cleaning"
    }
  ];

  const faqs = [
    {
      question: "Do you offer same-day service?",
      answer: "Yes! We offer same-day service for most plumbing issues, typically arriving within 90 minutes of your call. For emergencies, we can often arrive even faster."
    },
    {
      question: "How much do your services cost?",
      answer: "We provide upfront, transparent pricing before we start any work. Our rates are competitive and we never charge hidden fees. Most drain cleanings start at $150, water heater repairs from $200, and emergency service calls from $100."
    },
    {
      question: "Are your plumbers licensed and insured?",
      answer: "Absolutely. All our plumbers are fully licensed, bonded, and insured. We've been serving Austin and surrounding areas since 1999 with a spotless safety record."
    },
    {
      question: "Do you offer a warranty on your work?",
      answer: "Yes! All our work comes with a 100% satisfaction guarantee. We also offer warranties on parts and labor - typically 1 year on repairs and up to 10 years on installations."
    },
    {
      question: "What areas do you serve?",
      answer: "We proudly serve Austin, Marble Falls, and all surrounding communities including Cedar Park, Round Rock, Georgetown, Leander, and more. If you're in the greater Austin area, we can help!"
    },
    {
      question: "Do you charge extra for after-hours or weekend service?",
      answer: "We offer competitive pricing 24/7. While there is a small premium for emergency after-hours service, we always provide the price upfront so there are no surprises."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Plumber Near Me Austin TX | 24/7 Emergency Plumbing"
        description="Looking for a plumber near you in Austin or Marble Falls? Economy Plumbing offers 24/7 emergency service, water heater repair, drain cleaning & more. Call now!"
        canonical="https://www.plumbersthatcare.com/plumber-near-me"
        schema={localBusinessSchema}
      />

      <Header />

      <main className="flex-1">
        {/* Hero Section with Urgency */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 text-white py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                {slotsRemaining <= 3 && (
                  <Badge className="mb-4 bg-orange-500/90 text-white border-orange-400 animate-pulse" data-testid="badge-urgency">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Only {slotsRemaining} Same-Day Slots Left Today!
                  </Badge>
                )}
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold mb-6" data-testid="text-hero-title">
                  Need a Plumber? We're Here to Help
                </h1>
                
                <p className="text-xl lg:text-2xl text-white/90 mb-8" data-testid="text-hero-subtitle">
                  Licensed plumbing experts serving Austin, Marble Falls, and surrounding areas with fast, reliable service
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white text-primary border-white text-lg px-8 py-6 h-auto"
                    asChild
                    data-testid="button-call-now"
                  >
                    <a href={`tel:${phoneConfig.tel}`} onClick={handleCtaClick}>
                      <Phone className="w-5 h-5 mr-2" />
                      {phoneConfig.display}
                    </a>
                  </Button>
                  
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent text-white border-white text-lg px-8 py-6 h-auto"
                    onClick={() => { handleCtaClick(); openScheduler(); }}
                    data-testid="button-schedule"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Book Online (60 Seconds)
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">4.9/5 Stars (150+ Reviews)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Licensed & Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Same-Day Service</span>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Why Choose Economy Plumbing?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-white/90">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span><strong>Upfront Pricing:</strong> No hidden fees, ever</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span><strong>Fast Response:</strong> Typically arrive in 90 minutes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span><strong>24/7 Availability:</strong> Emergencies don't wait</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        <span><strong>Satisfaction Guaranteed:</strong> 100% money-back</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-8 bg-accent/5 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">25+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">4.9</div>
                <div className="text-sm text-muted-foreground">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Emergency Service</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">90min</div>
                <div className="text-sm text-muted-foreground">Average Response</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-xl text-muted-foreground">Getting expert plumbing help is easier than ever</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((step) => (
                <Card key={step.step} className="text-center hover-elevate" data-testid={`how-it-works-${step.step}`}>
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <step.icon className="w-8 h-8 text-primary" />
                    </div>
                    <Badge className="mx-auto mb-2">Step {step.step}</Badge>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Transparency */}
        <section className="py-16 lg:py-20 bg-accent/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Transparent, Upfront Pricing</h2>
              <p className="text-xl text-muted-foreground">No hidden fees. No surprises. Just honest pricing.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="hover-elevate">
                <CardHeader>
                  <DollarSign className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Drain Cleaning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">From $150</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Professional drain cleaning and clog removal
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Main line clearing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Hydro jetting available
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Video inspection
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover-elevate border-primary/50">
                <CardHeader>
                  <Badge className="mb-2 w-fit">Most Popular</Badge>
                  <Wrench className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Water Heater Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">From $200</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Repair, installation, or replacement
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      All brands serviced
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Tankless options
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      10-year warranties
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="hover-elevate">
                <CardHeader>
                  <AlertCircle className="w-8 h-8 text-primary mb-2" />
                  <CardTitle>Emergency Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">From $100</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    24/7 emergency plumbing repairs
                  </p>
                  <ul className="text-sm space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Fast response time
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Available 24/7
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      No overtime gouging
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">All prices quoted before work begins • Financing available • Military & senior discounts</p>
              <Button size="lg" onClick={() => { handleCtaClick(); openScheduler(); }} data-testid="button-get-quote">
                <Phone className="w-5 h-5 mr-2" />
                Get Free Quote
              </Button>
            </div>
          </div>
        </section>

        {/* Customer Testimonials */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">What Our Customers Say</h2>
              <p className="text-xl text-muted-foreground">Real reviews from real Austin-area customers</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="hover-elevate" data-testid={`testimonial-${index}`}>
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <CardTitle className="text-base">{testimonial.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">"{testimonial.text}"</p>
                    <Badge variant="secondary">{testimonial.service}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-lg text-muted-foreground mb-4">Join 10,000+ satisfied customers in the Austin area</p>
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-semibold">150+ 5-star reviews on Google</span>
              </div>
            </div>
          </div>
        </section>

        {/* Service Areas */}
        <section className="py-16 lg:py-20 bg-accent/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="text-service-areas-title">
                Proudly Serving Your Community
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Local plumbing experts you can trust, serving Austin, Marble Falls, and all surrounding areas
              </p>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
              {serviceAreas.map((area) => (
                <Button
                  key={area.path}
                  variant="outline"
                  className="justify-start"
                  asChild
                  data-testid={`button-area-${area.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <a href={area.path}>
                    <MapPin className="w-4 h-4 mr-2" />
                    {area.name}
                  </a>
                </Button>
              ))}
            </div>

            <div className="rounded-lg overflow-hidden border shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d440894.67457634!2d-98.0698!3d30.2672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8644b599a0cc032f%3A0x5d9b464bd469d57a!2sAustin%2C%20TX!5e0!3m2!1sen!2sus!4v1234567890"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Economy Plumbing service area map"
                data-testid="map-service-area"
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 lg:py-20 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-muted-foreground">Got questions? We've got answers.</p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover-elevate" data-testid={`faq-${index}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Guarantee Section */}
        <section className="py-16 lg:py-20 bg-primary text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Shield className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Our 100% Satisfaction Guarantee
            </h2>
            <p className="text-xl text-white/90 mb-8">
              If you're not completely satisfied with our work, we'll make it right or refund your money. No questions asked. That's our promise to you.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div>
                <Award className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Licensed & Certified</h3>
                <p className="text-sm text-white/80">All plumbers fully licensed and background checked</p>
              </div>
              <div>
                <Shield className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Fully Insured</h3>
                <p className="text-sm text-white/80">Comprehensive liability and workers comp coverage</p>
              </div>
              <div>
                <ThumbsUp className="w-10 h-10 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Warranty Protected</h3>
                <p className="text-sm text-white/80">Up to 10-year warranties on installations</p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA with Urgency */}
        <section className="py-16 lg:py-20 bg-accent/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {slotsRemaining <= 3 && (
              <Badge className="mb-6 bg-orange-500 text-white text-base px-4 py-2 animate-pulse" data-testid="badge-final-urgency">
                <Clock className="w-4 h-4 mr-2" />
                Act Now - Only {slotsRemaining} Same-Day Appointments Left!
              </Badge>
            )}
            
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Fix Your Plumbing Issue?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Don't wait for a small problem to become a big one. Call now for fast, professional service you can trust.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                size="lg"
                className="text-lg px-8 py-6 h-auto"
                asChild
                data-testid="button-cta-call"
              >
                <a href={`tel:${phoneConfig.tel}`} onClick={handleCtaClick}>
                  <Phone className="w-5 h-5 mr-2" />
                  Call {phoneConfig.display} Now
                </a>
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 h-auto"
                onClick={() => { handleCtaClick(); openScheduler(); }}
                data-testid="button-cta-schedule"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Book Online in 60 Seconds
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Or call {phoneConfig.display} for immediate assistance • Available 24/7
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
