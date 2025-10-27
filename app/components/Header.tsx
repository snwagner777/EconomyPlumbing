"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, ChevronDown, LogOut } from "lucide-react";
import { Button } from "./Button";
import Image from "next/image";
import logoImage from "@assets/optimized/Economy_Plumbing_Services_logo_1759801055079.webp";

declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
    __PHONE_CONFIG__: { display: string; tel: string };
  }
}

function openScheduler() {
  if (typeof window !== "undefined" && window.STWidgetManager) {
    window.STWidgetManager("open");
  }
}

interface HeaderProps {
  isPortalAuthenticated?: boolean;
  onPortalLogout?: () => void;
}

export default function Header({ isPortalAuthenticated = false, onPortalLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [serviceAreasOpen, setServiceAreasOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileAreasOpen, setMobileAreasOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileStoreOpen, setMobileStoreOpen] = useState(false);
  
  const pathname = usePathname();
  
  const phoneConfig = typeof window !== "undefined" && window.__PHONE_CONFIG__ 
    ? window.__PHONE_CONFIG__ 
    : { display: "(512) 368-9159", tel: "tel:+15123689159" };

  const marbleFallsPhoneConfig = { display: "(830) 265-7383", tel: "tel:+18302657383" };

  const services = [
    { name: "All Services", path: "/services", featured: true },
    { name: "Water Heater Services", path: "/water-heater-services" },
    { name: "Drain Cleaning", path: "/drain-cleaning" },
    { name: "Leak Repair", path: "/leak-repair" },
    { name: "Toilet & Faucet", path: "/toilet-faucet" },
    { name: "Gas Line Services", path: "/gas-line-services" },
    { name: "Backflow Testing", path: "/backflow" },
  ];

  const serviceAreas = [
    { name: "All Service Areas", path: "/service-area", featured: true },
    { name: "Austin", path: "/plumber-austin" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx" },
    { name: "Leander", path: "/plumber-leander" },
    { name: "Marble Falls", path: "/plumber-marble-falls" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <Image 
              src={logoImage} 
              alt="Economy Plumbing Services logo" 
              width={85}
              height={48}
              className="h-12 w-auto"
              data-testid="logo-image"
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-2 xl:gap-4">
            <Link 
              href="/" 
              className={`text-sm font-medium hover-elevate px-2 py-2 rounded-md ${pathname === "/" ? "bg-accent text-accent-foreground" : "text-foreground"}`}
              data-testid="link-home"
            >
              Home
            </Link>
            
            <div className="relative">
              <button
                onMouseEnter={() => setContactOpen(true)}
                onMouseLeave={() => setContactOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                data-testid="button-contact-menu"
              >
                Contact
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {contactOpen && (
                <div
                  onMouseEnter={() => setContactOpen(true)}
                  onMouseLeave={() => setContactOpen(false)}
                  className="absolute top-full left-0 pt-2 w-56"
                >
                  <div className="bg-card border border-card-border rounded-md shadow-lg py-2">
                    <Link href="/contact" className="block px-4 py-2 text-sm hover-elevate" data-testid="link-contact">
                      Contact Form
                    </Link>
                    <Link href="/schedule-appointment" className="block px-4 py-2 text-sm hover-elevate" data-testid="link-schedule">
                      Schedule Appointment
                    </Link>
                    <Link href="/faq" className="block px-4 py-2 text-sm hover-elevate" data-testid="link-faq-contact">
                      FAQ
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onMouseEnter={() => setAboutOpen(true)}
                onMouseLeave={() => setAboutOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                data-testid="button-about-menu"
              >
                About
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {aboutOpen && (
                <div
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}
                  className="absolute top-full left-0 pt-2 w-56"
                >
                  <div className="bg-card border border-card-border rounded-md shadow-lg py-2">
                    <Link href="/about" className="block px-4 py-2 text-sm hover-elevate" data-testid="link-about">
                      About Us
                    </Link>
                    <Link href="/blog" className="block px-4 py-2 text-sm hover-elevate" data-testid="link-blog">
                      Blog
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                data-testid="button-services-menu"
              >
                Services
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {servicesOpen && (
                <div
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                  className="absolute top-full left-0 pt-2 w-72"
                >
                  <div className="bg-card border border-card-border rounded-md shadow-lg py-2 max-h-[80vh] overflow-y-auto">
                    {services.map((service) => (
                      <Link
                        key={service.path}
                        href={service.path}
                        className={`block py-2 text-sm hover-elevate ${
                          service.featured ? 'font-semibold border-b border-border mb-1 px-4' : 'px-4'
                        }`}
                        data-testid={`link-service-${service.path.slice(1)}`}
                      >
                        {service.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onMouseEnter={() => setServiceAreasOpen(true)}
                onMouseLeave={() => setServiceAreasOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                data-testid="button-service-areas-menu"
              >
                Areas
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {serviceAreasOpen && (
                <div
                  onMouseEnter={() => setServiceAreasOpen(true)}
                  onMouseLeave={() => setServiceAreasOpen(false)}
                  className="absolute top-full left-0 pt-2 w-64"
                >
                  <div className="bg-card border border-card-border rounded-md shadow-lg py-2 max-h-[80vh] overflow-y-auto">
                    {serviceAreas.map((area) => (
                      <Link
                        key={area.path}
                        href={area.path}
                        className={`block px-4 py-2 text-sm hover-elevate ${area.featured ? 'font-semibold border-b border-border mb-1' : ''}`}
                        data-testid={`link-area-${area.path.slice(1)}`}
                      >
                        {area.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <a 
              href={phoneConfig.tel} 
              className="flex items-center gap-1.5 text-foreground font-poppins font-bold text-base xl:text-lg hover-elevate px-2 py-1 rounded-md whitespace-nowrap"
              data-testid="link-phone-austin"
            >
              <Phone className="w-4 h-4 xl:w-5 xl:h-5" />
              <span className="hidden xl:inline">{phoneConfig.display}</span>
              <span className="xl:hidden">{phoneConfig.display.replace(/\s/g, '')}</span>
            </a>
            <Button 
              onClick={openScheduler}
              className="bg-primary text-primary-foreground whitespace-nowrap"
              size="sm"
              data-testid="button-schedule-header"
            >
              <span className="hidden xl:inline">Schedule Service</span>
              <span className="xl:hidden">Schedule</span>
            </Button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2"
            aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
            aria-expanded={mobileMenuOpen}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-card">
          <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto">
            <Link href="/" className="block py-3 text-sm font-medium border-b border-border" data-testid="mobile-link-home" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>

            <div className="border-b border-border">
              <button
                onClick={() => setMobileContactOpen(!mobileContactOpen)}
                className="flex items-center justify-between w-full py-3 text-sm font-medium"
                data-testid="mobile-button-contact"
              >
                Contact Us
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileContactOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileContactOpen && (
                <div className="pb-2 space-y-1">
                  <Link href="/contact" className="block py-2 pl-4 text-sm" data-testid="mobile-link-contact" onClick={() => setMobileMenuOpen(false)}>
                    Contact Form
                  </Link>
                  <Link href="/blog" className="block py-2 pl-4 text-sm" data-testid="mobile-link-blog" onClick={() => setMobileMenuOpen(false)}>
                    Blog
                  </Link>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => {
                  openScheduler();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-primary text-primary-foreground"
                data-testid="mobile-button-schedule"
              >
                Schedule Service
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
