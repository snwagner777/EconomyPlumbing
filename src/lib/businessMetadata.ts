/**
 * Shared Business Metadata Constants
 * Single source of truth for NAP (Name, Address, Phone) data
 * Used across all JSON-LD schemas, metadata, and site content
 */

export const BUSINESS_INFO = {
  name: "Economy Plumbing Services",
  email: "hello@mail.plumbersthatcare.com",
  url: "https://plumbersthatcare.com",
  logo: "https://plumbersthatcare.com/attached_assets/Economy%20Plumbing%20Services%20logo_1759801055079.jpg",
  priceRange: "$$",
  description: "Professional plumbing services in Austin, Marble Falls, and Central Texas. Water heater repair & replacement, drain cleaning, leak repair, and emergency plumbing services.",
} as const;

export const AUSTIN_LOCATION = {
  name: "Economy Plumbing Services",
  telephone: "+15123689159",
  phoneDisplay: "(512) 368-9159",
  address: {
    streetAddress: "701 Tillery St #12",
    addressLocality: "Austin",
    addressRegion: "TX",
    postalCode: "78702",
    addressCountry: "US",
  },
  geo: {
    latitude: "30.2672",
    longitude: "-97.7431",
  },
  hasMap: "https://maps.google.com/?q=701+Tillery+St+%2312+Austin+TX+78702",
} as const;

export const MARBLE_FALLS_LOCATION = {
  name: "Economy Plumbing Services - Marble Falls",
  telephone: "+18304603565",
  phoneDisplay: "(830) 460-3565",
  address: {
    streetAddress: "2409 Commerce Street",
    addressLocality: "Marble Falls",
    addressRegion: "TX",
    postalCode: "78654",
    addressCountry: "US",
  },
  geo: {
    latitude: "30.5744",
    longitude: "-98.2734",
  },
  hasMap: "https://maps.google.com/?q=2409+Commerce+Street+Marble+Falls+TX+78654",
} as const;

export const BUSINESS_HOURS = [
  {
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "08:00",
    closes: "17:00",
  },
  {
    dayOfWeek: "Saturday",
    opens: "09:00",
    closes: "15:00",
  },
] as const;

export const SERVICE_AREAS = [
  { name: "Austin, TX" },
  { name: "Cedar Park, TX" },
  { name: "Leander, TX" },
  { name: "Round Rock, TX" },
  { name: "Georgetown, TX" },
  { name: "Pflugerville, TX" },
  { name: "Marble Falls, TX" },
  { name: "Burnet, TX" },
  { name: "Horseshoe Bay, TX" },
  { name: "Kingsland, TX" },
  { name: "Liberty Hill, TX" },
  { name: "Buda, TX" },
  { name: "Kyle, TX" },
] as const;

export const SOCIAL_PROFILES = [
  "https://www.facebook.com/econoplumbing",
  "https://www.instagram.com/plumbersthatcare_atx",
  "https://www.yelp.com/biz/economy-plumbing-services-austin-3",
  "https://www.nextdoor.com/agency-detail/tx/austin/economy-plumbing-services/",
] as const;
