import { Button } from "@/components/ui/button";
import { Phone, CheckCircle } from "lucide-react";
import heroImage from "@assets/generated_images/Plumber_installing_water_heater_3f7d8a09.png";

interface HeroProps {
  onScheduleClick?: () => void;
}

export default function Hero({ onScheduleClick }: HeroProps) {
  return (
    <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Economy Plumbing professional plumber installing water heater in modern Austin home"
          className="w-full h-full object-cover"
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
              onClick={onScheduleClick}
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
              data-testid="button-call-austin-hero"
            >
              <a href="tel:5126492811" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Austin: (512) 649-2811
              </a>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-white border-white bg-white/10 backdrop-blur-sm hover:bg-white/20 text-lg"
              asChild
              data-testid="button-call-marble-falls-hero"
            >
              <a href="tel:8304603565" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Marble Falls: (830) 460-3565
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
