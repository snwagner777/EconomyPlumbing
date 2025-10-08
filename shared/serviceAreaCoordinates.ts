// GPS coordinates for service area cities in Central Texas
// Used for LocalBusiness schema markup to improve local SEO

export interface CityCoordinates {
  latitude: number;
  longitude: number;
}

export const serviceAreaCoordinates: Record<string, CityCoordinates> = {
  austin: {
    latitude: 30.2672,
    longitude: -97.7431,
  },
  'cedar-park': {
    latitude: 30.5052,
    longitude: -97.8203,
  },
  leander: {
    latitude: 30.5788,
    longitude: -97.8531,
  },
  'round-rock': {
    latitude: 30.5083,
    longitude: -97.6789,
  },
  georgetown: {
    latitude: 30.6327,
    longitude: -97.6772,
  },
  pflugerville: {
    latitude: 30.4461,
    longitude: -97.6240,
  },
  'liberty-hill': {
    latitude: 30.6649,
    longitude: -97.9225,
  },
  buda: {
    latitude: 30.0852,
    longitude: -97.8403,
  },
  kyle: {
    latitude: 29.9891,
    longitude: -97.8772,
  },
  'marble-falls': {
    latitude: 30.5782,
    longitude: -98.2728,
  },
  burnet: {
    latitude: 30.7582,
    longitude: -98.2284,
  },
  'horseshoe-bay': {
    latitude: 30.5443,
    longitude: -98.3739,
  },
  kingsland: {
    latitude: 30.6582,
    longitude: -98.4406,
  },
  'granite-shoals': {
    latitude: 30.5891,
    longitude: -98.3839,
  },
  bertram: {
    latitude: 30.7438,
    longitude: -98.0556,
  },
  spicewood: {
    latitude: 30.4720,
    longitude: -98.1538,
  },
};

export function getCoordinates(slug: string): CityCoordinates | null {
  return serviceAreaCoordinates[slug] || null;
}
