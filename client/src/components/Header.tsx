import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/Economy Plumbing Services logo_1759801055079.jpg";

interface HeaderProps {
  onScheduleClick?: () => void;
}

export default function Header({ onScheduleClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [location] = useLocation();

  const services = [
    { name: "Water Heater Services", path: "/water-heater-services" },
    { name: "Drain Cleaning", path: "/drain-cleaning" },
    { name: "Leak Repair", path: "/leak-repair" },
    { name: "Toilet & Faucet", path: "/toilet-faucet" },
    { name: "Gas Services", path: "/gas-services" },
    { name: "Backflow Services", path: "/backflow" },
    { name: "Commercial Plumbing", path: "/commercial-plumbing" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <img 
              src={logoImage} 
              alt="Economy Plumbing Services logo" 
              className="h-12 w-auto"
              data-testid="logo-image"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              href="/" 
              className={`text-sm font-medium hover-elevate px-3 py-2 rounded-md ${location === "/" ? "text-primary" : "text-foreground"}`}
              data-testid="link-home"
            >
              Home
            </Link>
            
            <div className="relative">
              <button
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
                data-testid="button-services-menu"
              >
                Services
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {servicesOpen && (
                <div
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                  className="absolute top-full left-0 mt-1 w-64 bg-card border border-card-border rounded-md shadow-lg py-2"
                >
                  {services.map((service) => (
                    <Link
                      key={service.path}
                      href={service.path}
                      className="block px-4 py-2 text-sm hover-elevate"
                      data-testid={`link-service-${service.path.slice(1)}`}
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <Link 
              href="/service-area" 
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
              data-testid="link-service-areas"
            >
              Service Areas
            </Link>
            <Link 
              href="/blog" 
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
              data-testid="link-blog"
            >
              Blog
            </Link>
            <Link 
              href="/store" 
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
              data-testid="link-store"
            >
              Store
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
              data-testid="link-about"
            >
              About
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <a 
                href="tel:5126492811" 
                className="flex items-center gap-2 text-primary font-poppins font-bold text-lg hover-elevate px-2 py-1 rounded-md"
                data-testid="link-phone-austin"
              >
                <Phone className="w-5 h-5" />
                (512) 649-2811
              </a>
              <p className="text-xs text-muted-foreground">Austin Area</p>
            </div>
            <Button 
              onClick={onScheduleClick}
              className="bg-primary text-primary-foreground"
              data-testid="button-schedule-header"
            >
              Schedule Service
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-card">
          <div className="px-4 py-4 space-y-3">
            <Link href="/" className="block py-2 text-sm font-medium" data-testid="mobile-link-home">
              Home
            </Link>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Services</p>
              {services.map((service) => (
                <Link
                  key={service.path}
                  href={service.path}
                  className="block py-2 pl-4 text-sm"
                  data-testid={`mobile-link-${service.path.slice(1)}`}
                >
                  {service.name}
                </Link>
              ))}
            </div>
            <Link href="/service-area" className="block py-2 text-sm font-medium" data-testid="mobile-link-service-areas">
              Service Areas
            </Link>
            <Link href="/blog" className="block py-2 text-sm font-medium" data-testid="mobile-link-blog">
              Blog
            </Link>
            <Link href="/store" className="block py-2 text-sm font-medium" data-testid="mobile-link-store">
              Store
            </Link>
            <Link href="/about" className="block py-2 text-sm font-medium" data-testid="mobile-link-about">
              About
            </Link>
            <div className="pt-4 space-y-3">
              <a 
                href="tel:5126492811" 
                className="flex items-center gap-2 text-primary font-poppins font-bold text-lg"
                data-testid="mobile-phone-austin"
              >
                <Phone className="w-5 h-5" />
                (512) 649-2811 <span className="text-sm font-normal">Austin</span>
              </a>
              <a 
                href="tel:8304603565" 
                className="flex items-center gap-2 text-primary font-poppins font-bold text-lg"
                data-testid="mobile-phone-marble-falls"
              >
                <Phone className="w-5 h-5" />
                (830) 460-3565 <span className="text-sm font-normal">Marble Falls</span>
              </a>
              <Button onClick={onScheduleClick} className="w-full bg-primary" data-testid="mobile-button-schedule">
                Schedule Service
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
