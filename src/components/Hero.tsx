"use client";

import { Button } from "@/components/ui/button";
import { Phone, Calendar } from "lucide-react";
import { usePhoneConfig } from "@/contexts/PhoneConfigProvider";
import { openScheduler } from "@/lib/scheduler";

export default function Hero() {
  const phoneConfig = usePhoneConfig();

  return (
    <section className="relative bg-gradient-to-b from-primary/10 to-background py-20">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Professional Plumbing Services in Austin & Marble Falls
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            24/7 emergency service • Licensed & insured • Upfront pricing • Same-day service available
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-call-hero">
              <a href={phoneConfig.tel}>
                <Phone className="w-5 h-5 mr-2" />
                Call {phoneConfig.display}
              </a>
            </Button>
            
            <Button 
              size="lg" 
              variant="outline"
              onClick={openScheduler}
              data-testid="button-schedule"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Online
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
