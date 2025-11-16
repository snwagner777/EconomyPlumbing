/**
 * Menu Configuration - Single Source of Truth
 * 
 * This module contains all menu configurations used across desktop and mobile navigation.
 * Desktop and mobile use the same data, just formatted differently.
 * 
 * To update menus: Edit this file and both desktop AND mobile will update automatically.
 */

export interface MenuItem {
  name: string;
  path: string;
  featured?: boolean;
  section?: string | boolean;
  indent?: boolean;
  region?: string;
  muted?: boolean;
}

// Contact menu items
export const contactItems: MenuItem[] = [
  { name: "Contact Form", path: "/contact" },
  { name: "Schedule Appointment", path: "/schedule-appointment" },
  { name: "FAQ", path: "/faq" },
];

// About menu items (includes service areas at bottom)
export const aboutItems: MenuItem[] = [
  { name: "About Us", path: "/about" },
  { name: "Success Stories", path: "/success-stories" },
  { name: "Blog", path: "/blog" },
  { name: "VIP Membership", path: "/membership-benefits" },
  { name: "Customer Portal", path: "/customer-portal" },
  { name: "divider", path: "" },
  { name: "Service Areas", path: "", section: true },
];

// Portal/Store menu items
export const portalItems: MenuItem[] = [
  { name: "Customer Portal", path: "/customer-portal" },
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
  { name: "Terms of Service", path: "/terms-of-service", muted: true },
  { name: "Refund & Returns", path: "/refund_returns", muted: true },
];

// Services menu items
export const servicesItems: MenuItem[] = [
  { name: "All Services", path: "/services", featured: true },
  { name: "Emergency Plumbing", path: "/emergency", featured: true },
  { name: "Water Heater Services", path: "/water-heater-services" },
  { name: "Water Heater Guide", path: "/water-heater-guide" },
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

// Service areas menu items
export const serviceAreasItems: MenuItem[] = [
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

// Combined menu configuration object
export const menuConfig = {
  contact: contactItems,
  about: aboutItems,
  services: servicesItems,
  serviceAreas: serviceAreasItems,
  portal: portalItems,
};
