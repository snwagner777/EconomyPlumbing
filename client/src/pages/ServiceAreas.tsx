import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Clock, Users, Award, Home as HomeIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { openScheduler } from "@/lib/scheduler";
import { SEOHead } from "@/components/SEO/SEOHead";

const cities = [
  {
    name: "Austin",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Serving all Austin neighborhoods including Downtown, South Austin, East Austin, and West Austin.",
    neighborhoods: ["Downtown Austin", "South Congress (SoCo)", "East Austin", "Hyde Park", "Mueller", "Zilker", "Tarrytown", "Clarksville"],
    zipCodes: "78701-78799",
    path: "/plumber-austin"
  },
  {
    name: "Cedar Park",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Complete plumbing services for Cedar Park residents and businesses.",
    neighborhoods: ["Buttercup Creek", "Cedar Park Center", "Lakeline", "Whitestone", "Vista Oaks", "Cypress Creek"],
    zipCodes: "78613, 78630",
    path: "/plumber-in-cedar-park--tx"
  },
  {
    name: "Leander",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Trusted plumbing services throughout Leander and surrounding areas.",
    neighborhoods: ["Crystal Falls", "Travisso", "Mason Hills", "Northline", "Summerlyn", "Lakeline Ranch"],
    zipCodes: "78641, 78645",
    path: "/plumber-leander"
  },
  {
    name: "Round Rock",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Professional plumbing services for all Round Rock communities.",
    neighborhoods: ["Teravista", "Forest Creek", "Stone Canyon", "Walsh Ranch", "Brushy Creek", "Cat Hollow"],
    zipCodes: "78664, 78665, 78681",
    path: "/round-rock-plumber"
  },
  {
    name: "Georgetown",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Serving Georgetown's historic downtown and modern developments.",
    neighborhoods: ["Sun City", "Wolf Ranch", "Berry Creek", "Downtown Georgetown", "Georgetown Village", "Westlake"],
    zipCodes: "78626, 78628, 78633",
    path: "/plumber-georgetown"
  },
  {
    name: "Pflugerville",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Complete plumbing solutions for Pflugerville homes and businesses.",
    neighborhoods: ["Falcon Pointe", "Blackhawk", "Springbrook Centre", "Wilshire", "Park at Blackhawk", "Cambridge Heights"],
    zipCodes: "78660",
    path: "/plumber-pflugerville"
  },
  {
    name: "Liberty Hill",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Reliable plumbing services for Liberty Hill and surrounding rural areas.",
    neighborhoods: ["Rancho Sienna", "Sweetwater", "Liberty Hill ISD Area", "Rural Liberty Hill", "Heritage Oaks", "Old Town"],
    zipCodes: "78642",
    path: "/plumber-liberty-hill"
  },
  {
    name: "Buda",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Professional plumbing services for Buda's growing community.",
    neighborhoods: ["Garlic Creek", "Bradshaw Crossing", "Buda Mill & Grain", "Elm Grove", "Sunfield", "Green Meadows"],
    zipCodes: "78610",
    path: "/plumber-buda"
  },
  {
    name: "Kyle",
    phone: "(512) 368-9159",
    phoneLink: "5123689159",
    description: "Trusted plumbing solutions for Kyle residents and businesses.",
    neighborhoods: ["Plum Creek", "Hometown Kyle", "Waterleaf", "Kyle Crossing", "Meridian", "The Greens"],
    zipCodes: "78640",
    path: "/plumber-kyle"
  },
  {
    name: "Marble Falls",
    phone: "(830) 460-3565",
    phoneLink: "8304603565",
    description: "Serving the Highland Lakes area with quality plumbing services.",
    neighborhoods: ["Downtown Marble Falls", "Meadowlakes", "Granite Shoals", "Horseshoe Bay", "Cottonwood Shores", "Blue Lake Estates"],
    zipCodes: "78654, 78657, 78639",
    path: "/plumber-marble-falls"
  }
];

const emergencyAreas = [
  "Austin Metro Area",
  "Cedar Park",
  "Leander",
  "Round Rock",
  "Georgetown",
  "Pflugerville",
  "Liberty Hill",
  "Buda",
  "Kyle",
  "Marble Falls",
  "Burnet",
  "Bertram",
  "Lago Vista",
  "Point Venture",
  "Jonestown"
];

export default function ServiceAreas() {
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState<{ [key: string]: boolean }>({});

  const toggleNeighborhoods = (cityName: string) => {
    setExpandedNeighborhoods(prev => ({
      ...prev,
      [cityName]: !prev[cityName]
    }));
  };

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Our Service Area | Economy Plumbing Services Central Texas"
        description="Central Texas plumber serving Austin, Cedar Park, Leander, Round Rock, Georgetown, Pflugerville, Marble Falls & more. Same-day service. (512) 368-9159."
        canonical="https://plumbersthatcare.com/service-area"
      />

      <Header />

      <section className="py-16 lg:py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="heading-main">
              Our Service Area
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Economy Plumbing Services proudly serves Central Texas communities with reliable, professional plumbing solutions. From Austin to the Highland Lakes, we're your local plumbing experts.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={openScheduler}
                size="lg"
                data-testid="button-schedule-hero"
              >
                Schedule Service
              </Button>
              <Button 
                asChild 
                size="lg" 
                variant="outline"
                data-testid="button-call-hero"
              >
                <a href="tel:+15123689159" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call (512) 368-9159
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-cities">
              Cities We Serve
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We provide comprehensive plumbing services throughout Central Texas, with local expertise in each community we serve.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {cities.map((city) => {
              const isExpanded = expandedNeighborhoods[city.name];
              const displayNeighborhoods = isExpanded ? city.neighborhoods : city.neighborhoods.slice(0, 4);
              const hasMore = city.neighborhoods.length > 4;
              const moreCount = city.neighborhoods.length - 4;

              const citySlug = city.name.toLowerCase().replace(/\s+/g, '-');
              
              return (
                <Card key={city.name} className="p-4" data-testid={`card-city-${city.path.split('/').pop()}`}>
                  <h3 className="text-lg font-bold mb-1" data-testid={`heading-city-${citySlug}`}>
                    {city.name}
                  </h3>
                  <a 
                    href={`tel:${city.phoneLink}`}
                    className="text-foreground font-poppins font-bold text-sm mb-2 inline-block hover-elevate px-2 py-1 rounded-md"
                    data-testid={`link-phone-${citySlug}`}
                  >
                    {city.phone}
                  </a>
                  <p className="text-muted-foreground text-xs mb-2">
                    {city.description}
                  </p>
                  
                  <div className="mb-2">
                    <h4 className="font-semibold text-xs mb-1">Neighborhoods Served:</h4>
                    <div className="flex flex-wrap gap-1">
                      {displayNeighborhoods.map((neighborhood, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary"
                          className="text-xs py-0"
                          data-testid={`badge-neighborhood-${citySlug}-${idx}`}
                        >
                          {neighborhood}
                        </Badge>
                      ))}
                      {hasMore && !isExpanded && (
                        <Badge 
                          variant="outline"
                          className="text-xs cursor-pointer hover-elevate py-0"
                          onClick={() => toggleNeighborhoods(city.name)}
                          data-testid={`badge-show-more-${citySlug}`}
                        >
                          +{moreCount} more
                        </Badge>
                      )}
                      {hasMore && isExpanded && (
                        <Badge 
                          variant="outline"
                          className="text-xs cursor-pointer hover-elevate py-0"
                          onClick={() => toggleNeighborhoods(city.name)}
                          data-testid={`badge-show-less-${citySlug}`}
                        >
                          Show less
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-2">
                    <span className="font-semibold">Zip Codes:</span> {city.zipCodes}
                  </p>

                  <Button 
                    asChild 
                    variant="outline"
                    size="sm"
                    data-testid={`button-learn-more-${citySlug}`}
                  >
                    <Link href={city.path}>
                      Plumbers in {city.name}
                    </Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-emergency">
              24/7 Emergency Service Areas
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              We provide round-the-clock emergency plumbing services to all our service areas. No matter where you are in Central Texas, help is just a phone call away.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto mb-8">
            {emergencyAreas.map((area, idx) => (
              <div 
                key={idx}
                className="bg-background p-3 rounded-lg text-center border hover-elevate"
                data-testid={`card-emergency-${area.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <p className="font-medium text-sm">{area}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">Emergency? Call Now!</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                asChild 
                size="lg"
                data-testid="button-call-austin-emergency"
              >
                <a href="tel:+15123689159" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Austin Area: (512) 368-9159
                </a>
              </Button>
              <Button 
                asChild 
                size="lg"
                data-testid="button-call-marble-falls-emergency"
              >
                <a href="tel:+18304603565" className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Marble Falls: (830) 460-3565
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-coverage">
              Our Coverage Area
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              See our complete service area across Central Texas
            </p>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border shadow-sm">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d890000!2d-98.2!3d30.55!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1696358715235!5m2!1sen!2sus"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Economy Plumbing Services Coverage Area - Travis, Williamson & Burnet Counties"
                data-testid="map-coverage-area"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-why-local">
              Why Choose Local Plumbing Experts?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              As your local Central Texas plumbing company, we understand the unique challenges of our area.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 text-center" data-testid="card-benefit-knowledge">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Local Knowledge</h3>
              <p className="text-muted-foreground">
                We understand Central Texas water conditions, soil types, and local building codes.
              </p>
            </Card>

            <Card className="p-6 text-center" data-testid="card-benefit-response">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Fast Response</h3>
              <p className="text-muted-foreground">
                Being local means faster response times for emergencies and service calls.
              </p>
            </Card>

            <Card className="p-6 text-center" data-testid="card-benefit-community">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Community Focused</h3>
              <p className="text-muted-foreground">
                We're invested in our community and build lasting relationships with our neighbors.
              </p>
            </Card>

            <Card className="p-6 text-center" data-testid="card-benefit-reputation">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Trusted Reputation</h3>
              <p className="text-muted-foreground">
                Over 12 years serving Central Texas with hundreds of satisfied customers.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4" data-testid="heading-ready">
              Ready to Experience Local Service Excellence?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Contact Economy Plumbing Services today for all your plumbing needs throughout Central Texas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-office-austin">
              <div className="flex items-start gap-3 mb-4">
                <HomeIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Austin Area Office</h3>
                  <p className="opacity-90 mb-4">701 Tillery St #12, Austin, TX 78702</p>
                  <a 
                    href="tel:+15123689159"
                    className="text-2xl font-poppins font-bold hover-elevate inline-block px-3 py-2 rounded-md"
                    data-testid="link-phone-office-austin"
                  >
                    (512) 368-9159
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20" data-testid="card-office-marble-falls">
              <div className="flex items-start gap-3 mb-4">
                <HomeIcon className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-2xl font-bold mb-2">Marble Falls Area Office</h3>
                  <p className="opacity-90 mb-4">2409 Commerce Street, Marble Falls, TX 78654</p>
                  <a 
                    href="tel:+18304603565"
                    className="text-2xl font-poppins font-bold hover-elevate inline-block px-3 py-2 rounded-md"
                    data-testid="link-phone-office-marble-falls"
                  >
                    (830) 460-3565
                  </a>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={openScheduler}
                size="lg"
                className="bg-white text-primary hover:bg-white/90"
                data-testid="button-schedule-footer"
              >
                Schedule Service Online
              </Button>
              <Button 
                asChild 
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                data-testid="button-call-footer"
              >
                <a href="tel:+15123689159" className="flex items-center gap-2">
                  Call Now
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
