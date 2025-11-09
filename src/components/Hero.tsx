'use client';

import { Button } from "@/components/ui/button";
import { Phone, CheckCircle } from "lucide-react";
import Image from "next/image";
import heroImage from "@assets/optimized/modern_luxury_bathro_0f267931.webp";
import { openScheduler } from "@/lib/scheduler";

interface HeroProps {
  austinPhone?: { display: string; tel: string };
}

export default function Hero({ austinPhone }: HeroProps) {
  // Use server-provided phone (required - pulled from admin panel tracking numbers)
  const phone = austinPhone || { display: 'Loading...', tel: '#' };
  
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
      <div className="absolute inset-0">
        <Image
          src={heroImage}
          alt="Modern luxury bathroom with professional plumbing fixtures - Economy Plumbing Services serving Austin, Cedar Park, Leander, Round Rock, Georgetown, Marble Falls TX"
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
            Economy Plumbing Services
          </h1>
          <p className="text-xl lg:text-2xl text-white/90 mb-4">
            Austin & Marble Falls
          </p>
          <p className="text-lg text-white/80 mb-8 max-w-2xl">
            Central Texas' Best Little Plumbing Company Since 2012. Licensed, insured, and committed to our community with water heater services, drain cleaning, and all your plumbing needs.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Button 
              size="lg" 
              onClick={() => openScheduler()}
              className="bg-primary text-primary-foreground text-lg px-8"
              data-testid="button-schedule-hero"
            >
              Schedule Service
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-white border-white bg-white/10 backdrop-blur-sm hover:bg-white/20 text-lg"
              asChild
              data-testid="button-call-hero"
            >
              <a href={phone.tel} className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {phone.display}
              </a>
            </Button>
          </div>

          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-medium">Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-medium">Free Estimates</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span className="font-medium">Same-Day Service</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
