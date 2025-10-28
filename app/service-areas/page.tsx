/**
 * Service Areas Page
 * 
 * Lists all service areas for SEO
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Service Areas | Economy Plumbing Services',
  description: 'Professional plumbing services across multiple cities and neighborhoods. Find out if we serve your area.',
};

async function getServiceAreas() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/service-areas`, {
    next: { revalidate: 3600 },
  });
  
  if (!res.ok) {
    return { serviceAreas: [] };
  }
  
  return res.json();
}

export default async function ServiceAreasPage() {
  const { serviceAreas } = await getServiceAreas();

  // Group by region
  const byRegion = serviceAreas.reduce((acc: any, area: any) => {
    if (!acc[area.region]) {
      acc[area.region] = [];
    }
    acc[area.region].push(area);
    return acc;
  }, {});

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-6">Our Service Areas</h1>
        <p className="text-xl text-muted-foreground mb-12">
          We proudly serve customers across multiple cities and communities. 
          Click on your area to learn more about our services in your location.
        </p>

        {Object.entries(byRegion).map(([region, areas]: [string, any]) => (
          <div key={region} className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{region}</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
              {areas.map((area: any) => (
                <Link
                  key={area.id}
                  href={`/service-areas/${area.slug}`}
                  className="block p-4 bg-card hover:bg-accent rounded-lg transition"
                >
                  <h3 className="font-semibold">{area.cityName}</h3>
                  {area.population && (
                    <p className="text-sm text-muted-foreground">Pop: {area.population}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {serviceAreas.length === 0 && (
          <p className="text-center text-muted-foreground">
            Service areas will be listed here soon.
          </p>
        )}
      </div>
    </div>
  );
}
