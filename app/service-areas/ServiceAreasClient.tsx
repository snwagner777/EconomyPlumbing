'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { openScheduler } from "@/lib/scheduler";

interface CityData {
  name: string;
  phone: string;
  phoneLink: string;
  description: string;
  neighborhoods: string[];
  zipCodes: string;
  path: string;
}

interface PhoneConfig {
  display: string;
  tel: string;
}

interface ServiceAreasClientProps {
  cities: CityData[];
  austinPhone: PhoneConfig;
  marbleFallsPhone: PhoneConfig;
  emergencyAreas: string[];
}

export default function ServiceAreasClient({ cities, austinPhone, marbleFallsPhone, emergencyAreas }: ServiceAreasClientProps) {
  const [expandedNeighborhoods, setExpandedNeighborhoods] = useState<{ [key: string]: boolean }>({});

  const toggleNeighborhoods = (cityName: string) => {
    setExpandedNeighborhoods(prev => ({
      ...prev,
      [cityName]: !prev[cityName]
    }));
  };

  return (
    <div className="min-h-screen">
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
                className="bg-primary text-primary-foreground"
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
                <a href={austinPhone.tel} className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call {austinPhone.display}
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
                <a href={austinPhone.tel} className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Austin Area: {austinPhone.display}
                </a>
              </Button>
              <Button 
                asChild 
                size="lg"
                data-testid="button-call-marble-falls-emergency"
              >
                <a href={marbleFallsPhone.tel} className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Marble Falls: {marbleFallsPhone.display}
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
