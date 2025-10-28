/**
 * Service Area Detail Page
 * 
 * SEO-optimized page for each service area
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

async function getServiceArea(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ''}/api/service-areas/${slug}`,
    { next: { revalidate: 3600 } }
  );
  
  if (!res.ok) {
    return null;
  }
  
  const data = await res.json();
  return data.serviceArea;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = await getServiceArea(slug);
  
  if (!area) {
    return {
      title: 'Service Area Not Found',
    };
  }

  const description = area.metaDescription || `Professional plumbing services in ${area.cityName}, ${area.region}. Licensed plumbers, 24/7 emergency service. Call now for a free quote!`;
  
  return {
    title: `Plumbing Services in ${area.cityName} | Economy Plumbing`,
    description,
    openGraph: {
      title: `Plumbing Services in ${area.cityName}`,
      description, // Always provide fallback
    },
  };
}

export default async function ServiceAreaPage({ params }: Props) {
  const { slug } = await params;
  const area = await getServiceArea(slug);

  if (!area) {
    notFound();
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">
            Plumbing Services in {area.cityName}, {area.region}
          </h1>

          <div className="prose max-w-none mb-12">
            <p className="text-xl text-muted-foreground">{area.introContent}</p>
          </div>

          {/* Service Info */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">Our Services in {area.cityName}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                'Emergency Plumbing',
                'Drain Cleaning',
                'Water Heater Service',
                'Leak Detection',
                'Pipe Repair',
                'Fixture Installation',
              ].map((service) => (
                <div key={service} className="flex items-center gap-3">
                  <span className="text-primary">✓</span>
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Neighborhoods */}
          {area.neighborhoods && area.neighborhoods.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">
                Neighborhoods We Serve in {area.cityName}
              </h2>
              <div className="grid md:grid-cols-3 gap-3">
                {area.neighborhoods.map((n: string) => (
                  <div key={n} className="text-muted-foreground">• {n}</div>
                ))}
              </div>
            </section>
          )}

          {/* Landmarks */}
          {area.landmarks && area.landmarks.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Near Popular Locations</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {area.landmarks.map((l: string) => (
                  <div key={l} className="text-muted-foreground">• {l}</div>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <section className="bg-primary text-primary-foreground p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">
              Need Plumbing Service in {area.cityName}?
            </h2>
            <p className="mb-6">
              Call us now for fast, reliable service from licensed plumbers in your area.
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="tel:555-555-5555"
                className="bg-background text-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Call Now: (555) 555-5555
              </a>
              <a 
                href="/contact"
                className="bg-accent text-accent-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
              >
                Request Free Quote
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
