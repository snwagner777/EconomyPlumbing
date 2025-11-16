'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, ChevronDown, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoImageUrl from "@assets/optimized/Economy_Plumbing_Services_logo_1759801055079.webp";
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig } from "@/providers/PhoneConfigContext";
declare global {
  interface Window {
    STWidgetManager: (action: string) => void;
    __PHONE_CONFIG__: { display: string; tel: string };
  }
}

interface HeaderProps {
  isPortalAuthenticated?: boolean;
  onPortalLogout?: () => void;
  austinPhone?: { display: string; tel: string };
  marbleFallsPhone?: { display: string; tel: string };
}

export default function Header({ 
  isPortalAuthenticated = false, 
  onPortalLogout,
  austinPhone,
  marbleFallsPhone
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  
  // Mobile menu collapsible sections
  const [mobileContactOpen, setMobileContactOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const [mobileAboutOpen, setMobileAboutOpen] = useState(false);
  const [mobileStoreOpen, setMobileStoreOpen] = useState(false);
  
  const location = usePathname() || '/';
  
  // Get phone numbers from context (automatically fetched server-side with UTM tracking)
  // Props can still override for special cases, but context provides automatic defaults
  const contextPhoneConfig = usePhoneConfig();
  const phoneConfig = austinPhone || contextPhoneConfig.austin;
  const marbleFallsPhoneConfig = marbleFallsPhone || contextPhoneConfig.marbleFalls;

  const services = [
    { name: "All Services", path: "/services", featured: true },
    { name: "Emergency Plumbing", path: "/emergency", featured: true },
    { name: "Water Heater Services", path: "/water-heater-services" },
    { name: "Water Heater Guide", path: "/water-heater-guide" },
    { name: "Water Heater Calculator", path: "/water-heater-calculator" },
    { name: "Plumbing Cost Estimator", path: "/plumbing-cost-estimator" },
    { name: "Drain Cleaning", path: "/drain-cleaning" },
    { name: "Hydro Jetting", path: "/hydro-jetting-services" },
    { name: "Rooter Services", path: "/rooter-services" },
    { name: "Leak Repair", path: "/leak-repair" },
    { name: "Toilet & Faucet", path: "/toilet-faucet" },
    { name: "Faucet Installation", path: "/faucet-installation" },
    { name: "Garbage Disposal", path: "/garbage-disposal-repair" },
    { name: "Gas Line Services", path: "/gas-line-services" },
    { name: "Gas Leak Detection", path: "/gas-leak-detection" },
    { name: "Backflow Testing", path: "/backflow" },
    { name: "Drainage Solutions", path: "/drainage-solutions" },
    { name: "Sump & Sewage Pumps", path: "/sewage-pump-services" },
    { name: "Water Leak Repair", path: "/water-leak-repair" },
    { name: "Water Pressure Solutions", path: "/water-pressure-solutions" },
    { name: "Sewer Line Repair", path: "/sewer-line-repair" },
    { name: "Repiping Services", path: "/repiping" },
    { name: "Permit Resolution", path: "/permit-resolution-services" },
    { name: "Fixture Installation", path: "/fixture-installation" },
    { name: "Commercial Services", path: "/commercial-services", section: "Commercial" },
    { name: "Restaurant Plumbing", path: "/commercial/restaurants", section: "Commercial", indent: true },
    { name: "Retail Plumbing", path: "/commercial/retail", section: "Commercial", indent: true },
    { name: "Office Buildings", path: "/commercial/office-buildings", section: "Commercial", indent: true },
    { name: "Property Management", path: "/commercial/property-management", section: "Commercial", indent: true },
    { name: "Airbnb & Rental Properties", path: "/services/airbnb", section: "Commercial", indent: true },
    { name: "Winter Freeze Protection", path: "/winter-freeze-protection", section: "Seasonal" },
    { name: "Summer Plumbing Prep", path: "/summer-plumbing-prep", section: "Seasonal" },
  ];

  const serviceAreas = [
    { name: "All Service Areas", path: "/service-areas", featured: true },
    { name: "Austin", path: "/plumber-austin", region: "Austin Metro" },
    { name: "Cedar Park", path: "/plumber-in-cedar-park--tx", region: "Austin Metro" },
    { name: "Leander", path: "/plumber-leander", region: "Austin Metro" },
    { name: "Round Rock", path: "/round-rock-plumber", region: "Austin Metro" },
    { name: "Georgetown", path: "/plumber-georgetown", region: "Austin Metro" },
    { name: "Pflugerville", path: "/plumber-pflugerville", region: "Austin Metro" },
    { name: "Liberty Hill", path: "/plumber-liberty-hill", region: "Austin Metro" },
    { name: "Buda", path: "/plumber-buda", region: "Austin Metro" },
    { name: "Kyle", path: "/plumber-kyle", region: "Austin Metro" },
    { name: "Marble Falls", path: "/plumber-marble-falls", region: "Marble Falls Area" },
    { name: "Burnet", path: "/plumber-burnet", region: "Marble Falls Area" },
    { name: "Horseshoe Bay", path: "/plumber-horseshoe-bay", region: "Marble Falls Area" },
    { name: "Kingsland", path: "/plumber-kingsland", region: "Marble Falls Area" },
    { name: "Granite Shoals", path: "/plumber-granite-shoals", region: "Marble Falls Area" },
    { name: "Bertram", path: "/plumber-bertram", region: "Marble Falls Area" },
    { name: "Spicewood", path: "/plumber-spicewood", region: "Marble Falls Area" },
  ];

  // Single source of truth for ALL menus - desktop and mobile use the same data
  const menuConfig = {
    contact: [
      { name: "Contact Form", path: "/contact" },
      { name: "Schedule Appointment", path: "/schedule-appointment" },
      { name: "FAQ", path: "/faq" },
    ],
    about: [
      { name: "About Us", path: "/about" },
      { name: "Success Stories", path: "/success-stories" },
      { name: "Blog", path: "/blog" },
      { name: "Referral Program", path: "/refer-a-friend" },
      { name: "Plumbing Cost Estimator", path: "/plumbing-cost-estimator" },
      { name: "Water Heater Calculator", path: "/water-heater-calculator" },
      { name: "VIP Membership", path: "/membership-benefits" },
      { name: "Products", path: "/store" },
      { name: "divider", path: "" },
      { name: "Just For Fun", path: "", section: true },
      { name: "Dogs Doing Plumbing", path: "/dogs-plumbing" },
      { name: "Cats Doing Plumbing", path: "/cats-plumbing" },
      { name: "divider", path: "" },
      { name: "Privacy Policy", path: "/privacy-policy", muted: true },
      { name: "Refund & Returns", path: "/refund_returns", muted: true },
    ],
    portal: [
      { name: "Store", path: "/store" },
      { name: "Customer Portal", path: "/customer-portal" },
    ]
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <div className="relative h-12 w-[85px]">
              <Image 
                src={logoImageUrl}
                alt="Economy Plumbing Services logo" 
                width={85}
                height={48}
                priority={true}
                data-testid="logo-image"
              />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-2 xl:gap-4">
            <Link 
              href="/" 
              className={`text-sm font-medium hover-elevate px-2 py-2 rounded-md ${location === "/" ? "bg-accent text-accent-foreground" : "text-foreground"}`}
              data-testid="link-home"
            >
              Home
            </Link>
            
            <div className="relative">
              <button
                onMouseEnter={() => setContactOpen(true)}
                onMouseLeave={() => setContactOpen(false)}
                onClick={() => setContactOpen(!contactOpen)}
                onFocus={() => setContactOpen(true)}
                onBlur={() => setContactOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                aria-expanded={contactOpen}
                aria-haspopup="true"
                aria-label="Contact menu"
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
                    {menuConfig.contact.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="block px-4 py-2 text-sm hover-elevate"
                        data-testid={`link-${item.path.slice(1)}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onMouseEnter={() => setAboutOpen(true)}
                onMouseLeave={() => setAboutOpen(false)}
                onClick={() => setAboutOpen(!aboutOpen)}
                onFocus={() => setAboutOpen(true)}
                onBlur={() => setAboutOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                aria-expanded={aboutOpen}
                aria-haspopup="true"
                aria-label="About us menu"
                data-testid="button-about-menu"
              >
                About Us
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {aboutOpen && (
                <div
                  onMouseEnter={() => setAboutOpen(true)}
                  onMouseLeave={() => setAboutOpen(false)}
                  className="absolute top-full left-0 pt-2 w-64"
                >
                  <div className="bg-card border border-card-border rounded-md shadow-lg py-2 max-h-[80vh] overflow-y-auto">
                    {menuConfig.about.map((item, index) => {
                      if (item.name === "divider") {
                        return <div key={`divider-${index}`} className="border-t border-border my-2"></div>;
                      }
                      if (item.section) {
                        return (
                          <div key={item.name} className="px-4 py-1 text-xs font-semibold text-muted-foreground">
                            {item.name}
                          </div>
                        );
                      }
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          className={`block px-4 py-2 text-sm hover-elevate ${item.muted ? 'text-muted-foreground' : ''}`}
                          data-testid={`link-${item.path.slice(1)}`}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
                onClick={() => setServicesOpen(!servicesOpen)}
                onFocus={() => setServicesOpen(true)}
                onBlur={() => setServicesOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                aria-label="Services menu"
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
                    {services.map((service, index) => (
                      <Link
                        key={service.path}
                        href={service.path}
                        className={`block py-2 text-sm hover-elevate ${
                          service.featured ? 'font-semibold border-b border-border mb-1 px-4' : 
                          service.indent ? 'pl-8 pr-4 text-muted-foreground' : 'px-4'
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
                onMouseEnter={() => setStoreOpen(true)}
                onMouseLeave={() => setStoreOpen(false)}
                onClick={() => setStoreOpen(!storeOpen)}
                onFocus={() => setStoreOpen(true)}
                onBlur={() => setStoreOpen(false)}
                className="flex items-center gap-1 text-sm font-medium text-foreground hover-elevate px-2 py-2 rounded-md whitespace-nowrap"
                aria-expanded={storeOpen}
                aria-haspopup="true"
                aria-label="Customer portal menu"
                data-testid="button-store-menu"
              >
                Portal
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {storeOpen && (
                <div
                  onMouseEnter={() => setStoreOpen(true)}
                  onMouseLeave={() => setStoreOpen(false)}
                  className="absolute top-full left-0 pt-2 w-56"
                >
                  <div className="bg-card border border-card-border rounded-md shadow-lg py-2">
                    {menuConfig.portal.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className="block px-4 py-2 text-sm hover-elevate"
                        data-testid={`link-${item.path.slice(1)}`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="whitespace-nowrap"
              data-testid="button-call-now"
            >
              <a href={phoneConfig.tel}>
                <Phone className="w-4 h-4 xl:w-4 xl:h-4 mr-1.5" />
                <span className="hidden xl:inline">{phoneConfig.display}</span>
                <span className="xl:hidden">Call</span>
              </a>
            </Button>
            {isPortalAuthenticated && location === "/customer-portal" && (
              <Button 
                onClick={onPortalLogout}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-1.5" />
                <span className="hidden xl:inline">Sign Out</span>
                <span className="xl:hidden">Exit</span>
              </Button>
            )}
            <Button 
              onClick={() => openScheduler()}
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
            <Link 
              href="/" 
              className="block py-3 text-sm font-medium border-b border-border" 
              data-testid="mobile-link-home"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>

            <div className="border-b border-border">
              <button
                onClick={() => setMobileContactOpen(!mobileContactOpen)}
                className="flex items-center justify-between w-full py-3 text-sm font-medium"
                aria-expanded={mobileContactOpen}
                aria-label="Contact menu"
                data-testid="mobile-button-contact"
              >
                Contact Us
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileContactOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileContactOpen && (
                <div className="pb-2 space-y-1">
                  {menuConfig.contact.map((item) => (
                    <Link 
                      key={item.path}
                      href={item.path} 
                      className="block py-2 pl-4 text-sm" 
                      data-testid={`mobile-link-${item.path.slice(1)}`} 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-b border-border">
              <button
                onClick={() => setMobileAboutOpen(!mobileAboutOpen)}
                className="flex items-center justify-between w-full py-3 text-sm font-medium"
                aria-expanded={mobileAboutOpen}
                aria-label="About menu"
                data-testid="mobile-button-about"
              >
                About Us
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileAboutOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileAboutOpen && (
                <div className="pb-2 space-y-1">
                  {menuConfig.about.map((item, index) => {
                    if (item.name === "divider") {
                      return <div key={`divider-${index}`} className="border-t border-border my-2 mx-4"></div>;
                    }
                    if (item.section) {
                      return (
                        <div key={item.name} className="px-4 py-1 text-xs font-semibold text-muted-foreground">
                          {item.name}
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`block py-2 pl-4 text-sm ${item.muted ? 'text-muted-foreground' : ''}`}
                        data-testid={`mobile-link-${item.path.slice(1)}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-b border-border">
              <button
                onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                className="flex items-center justify-between w-full py-3 text-sm font-medium"
                aria-expanded={mobileServicesOpen}
                aria-label="Services menu"
                data-testid="mobile-button-services"
              >
                Services
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileServicesOpen && (
                <div className="pb-2 space-y-1">
                  {services.map((service) => (
                    <Link
                      key={service.path}
                      href={service.path}
                      className={`block py-2 pl-4 text-sm ${service.featured ? 'font-semibold' : ''}`}
                      data-testid={`mobile-link-${service.path.slice(1)}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {service.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-b border-border">
              <button
                onClick={() => setMobileStoreOpen(!mobileStoreOpen)}
                className="flex items-center justify-between w-full py-3 text-sm font-medium"
                aria-expanded={mobileStoreOpen}
                aria-label="Customer portal menu"
                data-testid="mobile-button-store"
              >
                Customer Portal
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileStoreOpen ? 'rotate-180' : ''}`} />
              </button>
              {mobileStoreOpen && (
                <div className="pb-2 space-y-1">
                  {menuConfig.portal.map((item) => (
                    <Link 
                      key={item.path}
                      href={item.path} 
                      className="block py-2 pl-4 text-sm" 
                      data-testid={`mobile-link-${item.path.slice(1)}`} 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 space-y-3">
              <a 
                href={phoneConfig.tel} 
                className="flex items-center gap-2 text-foreground font-poppins font-bold text-lg"
                data-testid="mobile-phone-austin"
              >
                <Phone className="w-5 h-5" />
                {phoneConfig.display} <span className="text-sm font-normal">Austin</span>
              </a>
              <a 
                href={marbleFallsPhoneConfig.tel}
                className="flex items-center gap-2 text-foreground font-poppins font-bold text-lg"
                data-testid="mobile-phone-marble-falls"
              >
                <Phone className="w-5 h-5" />
                {marbleFallsPhoneConfig.display} <span className="text-sm font-normal">Marble Falls</span>
              </a>
              <Button onClick={() => { openScheduler(); setMobileMenuOpen(false); }} className="w-full bg-primary" data-testid="mobile-button-schedule">
                Schedule Service
              </Button>
              {isPortalAuthenticated && location === "/customer-portal" && (
                <Button 
                  onClick={() => { onPortalLogout?.(); setMobileMenuOpen(false); }}
                  variant="outline"
                  className="w-full"
                  data-testid="mobile-button-logout"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
