import type { Metadata } from 'next';
import { getPageMetadata } from '@/server/lib/metadata';
import { getPhoneNumbers } from '@/server/lib/phoneNumbers';
import ServiceAreasClient from './ServiceAreasClient';

export async function generateMetadata(): Promise<Metadata> {
  return await getPageMetadata('/service-areas', {
    title: 'Service Areas - Plumbers Serving Central Texas | Economy Plumbing Services',
    description: 'Economy Plumbing Services proudly serves Austin, Cedar Park, Round Rock, Georgetown, Marble Falls, and surrounding Central Texas areas. Find your local plumber today.',
    ogType: 'website',
  });
}

function getCities(austinPhone: string, marbleFallsPhone: string) {
  return [
    {
      name: "Austin",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Serving all Austin neighborhoods including Downtown, South Austin, East Austin, and West Austin.",
      neighborhoods: ["Downtown Austin", "South Congress (SoCo)", "East Austin", "Hyde Park", "Mueller", "Zilker", "Tarrytown", "Clarksville"],
      zipCodes: "78701-78799",
      path: "/service-areas/austin"
    },
    {
      name: "Cedar Park",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Complete plumbing services for Cedar Park residents and businesses.",
      neighborhoods: ["Buttercup Creek", "Cedar Park Center", "Lakeline", "Whitestone", "Vista Oaks", "Cypress Creek"],
      zipCodes: "78613, 78630",
      path: "/service-areas/cedar-park"
    },
    {
      name: "Leander",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Trusted plumbing services throughout Leander and surrounding areas.",
      neighborhoods: ["Crystal Falls", "Travisso", "Mason Hills", "Northline", "Summerlyn", "Lakeline Ranch"],
      zipCodes: "78641, 78645",
      path: "/service-areas/leander"
    },
    {
      name: "Round Rock",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Professional plumbing services for all Round Rock communities.",
      neighborhoods: ["Teravista", "Forest Creek", "Stone Canyon", "Walsh Ranch", "Brushy Creek", "Cat Hollow"],
      zipCodes: "78664, 78665, 78681",
      path: "/service-areas/round-rock"
    },
    {
      name: "Georgetown",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Serving Georgetown's historic downtown and modern developments.",
      neighborhoods: ["Sun City", "Wolf Ranch", "Berry Creek", "Downtown Georgetown", "Georgetown Village", "Westlake"],
      zipCodes: "78626, 78628, 78633",
      path: "/service-areas/georgetown"
    },
    {
      name: "Pflugerville",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Complete plumbing solutions for Pflugerville homes and businesses.",
      neighborhoods: ["Falcon Pointe", "Blackhawk", "Springbrook Centre", "Wilshire", "Park at Blackhawk", "Cambridge Heights"],
      zipCodes: "78660",
      path: "/service-areas/pflugerville"
    },
    {
      name: "Liberty Hill",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Reliable plumbing services for Liberty Hill and surrounding rural areas.",
      neighborhoods: ["Rancho Sienna", "Sweetwater", "Liberty Hill ISD Area", "Rural Liberty Hill", "Heritage Oaks", "Old Town"],
      zipCodes: "78642",
      path: "/service-areas/liberty-hill"
    },
    {
      name: "Buda",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Professional plumbing services for Buda's growing community.",
      neighborhoods: ["Garlic Creek", "Bradshaw Crossing", "Buda Mill & Grain", "Elm Grove", "Sunfield", "Green Meadows"],
      zipCodes: "78610",
      path: "/service-areas/buda"
    },
    {
      name: "Kyle",
      phone: austinPhone,
      phoneLink: austinPhone.replace(/\D/g, ''),
      description: "Trusted plumbing solutions for Kyle residents and businesses.",
      neighborhoods: ["Plum Creek", "Hometown Kyle", "Waterleaf", "Kyle Crossing", "Meridian", "The Greens"],
      zipCodes: "78640",
      path: "/service-areas/kyle"
    },
    {
      name: "Marble Falls",
      phone: marbleFallsPhone,
      phoneLink: marbleFallsPhone.replace(/\D/g, ''),
      description: "Serving the Highland Lakes area with quality plumbing services.",
      neighborhoods: ["Downtown Marble Falls", "Meadowlakes", "Granite Shoals", "Horseshoe Bay", "Cottonwood Shores", "Blue Lake Estates"],
      zipCodes: "78654, 78657, 78639",
      path: "/service-areas/marble-falls"
    }
  ];
}

const emergencyAreas = [
  "Austin Metro Area",
  "Cedar Park",
  "Leander",
  "Round Rock",
  "Georgetown",
  "Pflugerville",
  "Liberty Hill",
  "Buda",
  "Kyle",
  "Marble Falls",
  "Burnet",
  "Bertram",
  "Lago Vista",
  "Point Venture",
  "Jonestown"
];

export default async function ServiceAreasPage() {
  const phoneNumbers = await getPhoneNumbers();
  const cities = getCities(phoneNumbers.austin.display, phoneNumbers.marbleFalls.display);

  // Generate LocalBusiness schema for each city
  const citySchemas = cities.map(city => ({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Economy Plumbing Services - ${city.name}`,
    "description": city.description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": city.name,
      "addressRegion": "TX",
      "postalCode": city.zipCodes.split(',')[0].trim(),
      "addressCountry": "US"
    },
    "telephone": city.phone,
    "url": `https://www.plumbersthatcare.com${city.path}`,
    "areaServed": {
      "@type": "City",
      "name": city.name,
      "containedIn": {
        "@type": "State",
        "name": "Texas"
      }
    },
    "priceRange": "$$",
    "openingHours": "Mo-Su 00:00-23:59",
    "serviceArea": city.neighborhoods.map(neighborhood => ({
      "@type": "Place",
      "name": neighborhood
    }))
  }));

  return (
    <>
      {/* JSON-LD Schema for all cities */}
      {citySchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <ServiceAreasClient 
        cities={cities}
        austinPhone={phoneNumbers.austin}
        marbleFallsPhone={phoneNumbers.marbleFalls}
        emergencyAreas={emergencyAreas}
      />
    </>
  );
}
