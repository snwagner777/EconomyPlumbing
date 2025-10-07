import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImage from "@assets/Economy Plumbing Services logo_1759801055079.jpg";

interface HeaderProps {
  onScheduleClick?: () => void;
}

declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
  }
}

export default function Header({ onScheduleClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [location] = useLocation();

  const services = [
    { name: "All Services", path: "/services", featured: true },
    { name: "Water Heater Services", path: "/water-heater-services" },
    { name: "Water Heater Guide", path: "/water-heater-guide" },
    { name: "Drain Cleaning", path: "/drain-cleaning" },
    { name: "Hydro Jetting", path: "/hydro-jetting-services" },
    { name: "Rooter Services", path: "/rooter-services" },
    { name: "Leak Repair", path: "/leak-repair" },
    { name: "Toilet & Faucet", path: "/toilet-faucet" },
    { name: "Faucet Installation", path: "/faucet-installation" },
    { name: "Garbage Disposal", path: "/garbage-disposal-repair" },
    { name: "Gas Line Services", path: "/gas-services" },
    { name: "Gas Leak Detection", path: "/gas-leak-detection" },
    { name: "Backflow Testing", path: "/backflow-testing" },
    { name: "Drainage Solutions", path: "/drainage-solutions" },
    { name: "Sump & Sewage Pumps", path: "/sewage-pump-services" },
    { name: "Water Pressure Solutions", path: "/water-pressure-solutions" },
    { name: "Permit Resolution", path: "/permit-resolution-services" },
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
                  className="absolute top-full left-0 mt-1 w-72 bg-card border border-card-border rounded-md shadow-lg py-2 max-h-[80vh] overflow-y-auto"
                >
                  {services.map((service) => (
                    <Link
                      key={service.path}
                      href={service.path}
                      className={`block px-4 py-2 text-sm hover-elevate ${service.featured ? 'font-semibold text-primary border-b border-border mb-1' : ''}`}
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
              Service Area
            </Link>
            
            <div className="relative">
              <button
                onMouseEnter={() => setAboutOpen(true)}
                onMouseLeave={() => setAboutOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
                data-testid="button-about-menu"
              >
                About Us
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {aboutOpen && (
                <div
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}
                  className="absolute top-full left-0 mt-1 w-56 bg-card border border-card-border rounded-md shadow-lg py-2"
                >
                  <Link
                    href="/about"
                    className="block px-4 py-2 text-sm hover-elevate"
                    data-testid="link-about"
                  >
                    About Us
                  </Link>
                  <Link
                    href="/blog"
                    className="block px-4 py-2 text-sm hover-elevate"
                    data-testid="link-blog"
                  >
                    Blog
                  </Link>
                  <Link
                    href="/faq"
                    className="block px-4 py-2 text-sm hover-elevate"
                    data-testid="link-faq"
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/membership-benefits"
                    className="block px-4 py-2 text-sm hover-elevate"
                    data-testid="link-membership"
                  >
                    Membership Benefits
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onMouseEnter={() => setStoreOpen(true)}
                onMouseLeave={() => setStoreOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
                data-testid="button-store-menu"
              >
                Store
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {storeOpen && (
                <div
                  onMouseEnter={() => setStoreOpen(true)}
                  onMouseLeave={() => setStoreOpen(false)}
                  className="absolute top-full left-0 mt-1 w-56 bg-card border border-card-border rounded-md shadow-lg py-2"
                >
                  <Link
                    href="/store"
                    className="block px-4 py-2 text-sm hover-elevate"
                    data-testid="link-store"
                  >
                    Shop Products
                  </Link>
                  <Link
                    href="/privacy-policy"
                    className="block px-4 py-2 text-sm hover-elevate"
                    data-testid="link-privacy"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    href="/refund_returns"
                    className="block px-4 py-2 text-sm hover-elevate"
                    data-testid="link-refunds"
                  >
                    Refund & Returns
                  </Link>
                </div>
              )}
            </div>
            
            <Link 
              href="/contact" 
              className="text-sm font-medium text-foreground hover-elevate px-3 py-2 rounded-md"
              data-testid="link-contact"
            >
              Contact Us
            </Link>
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a 
              href="tel:5126492811" 
              className="flex items-center gap-2 text-primary font-poppins font-bold text-lg hover-elevate px-2 py-1 rounded-md"
              data-testid="link-phone-austin"
            >
              <Phone className="w-5 h-5" />
              (512) 649-2811
            </a>
            <Button 
              onClick={() => window.STWidgetManager && window.STWidgetManager("ws-open")}
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
          <div className="px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
            <Link href="/" className="block py-2 text-sm font-medium" data-testid="mobile-link-home">
              Home
            </Link>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Services</p>
              {services.map((service) => (
                <Link
                  key={service.path}
                  href={service.path}
                  className={`block py-2 pl-4 text-sm ${service.featured ? 'font-semibold text-primary' : ''}`}
                  data-testid={`mobile-link-${service.path.slice(1)}`}
                >
                  {service.name}
                </Link>
              ))}
            </div>
            <Link href="/service-area" className="block py-2 text-sm font-medium" data-testid="mobile-link-service-areas">
              Service Area
            </Link>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">About Us</p>
              <Link href="/about" className="block py-2 pl-4 text-sm" data-testid="mobile-link-about">
                About Us
              </Link>
              <Link href="/blog" className="block py-2 pl-4 text-sm" data-testid="mobile-link-blog">
                Blog
              </Link>
              <Link href="/faq" className="block py-2 pl-4 text-sm" data-testid="mobile-link-faq">
                FAQ
              </Link>
              <Link href="/membership-benefits" className="block py-2 pl-4 text-sm" data-testid="mobile-link-membership">
                Membership Benefits
              </Link>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Store</p>
              <Link href="/store" className="block py-2 pl-4 text-sm" data-testid="mobile-link-store">
                Shop Products
              </Link>
              <Link href="/privacy-policy" className="block py-2 pl-4 text-sm" data-testid="mobile-link-privacy">
                Privacy Policy
              </Link>
              <Link href="/refund_returns" className="block py-2 pl-4 text-sm" data-testid="mobile-link-refunds">
                Refund & Returns
              </Link>
            </div>
            
            <Link href="/contact" className="block py-2 text-sm font-medium" data-testid="mobile-link-contact">
              Contact Us
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
              <Button onClick={() => window.STWidgetManager && window.STWidgetManager("ws-open")} className="w-full bg-primary" data-testid="mobile-button-schedule">
                Schedule Service
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
