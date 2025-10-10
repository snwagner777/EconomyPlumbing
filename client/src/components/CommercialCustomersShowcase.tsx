import { useQuery } from "@tanstack/react-query";
import type { CommercialCustomer } from "@shared/schema";

export default function CommercialCustomersShowcase() {
  const { data: customers, isLoading } = useQuery<CommercialCustomer[]>({
    queryKey: ['/api/commercial-customers'],
  });

  if (isLoading) {
    return (
      <div className="py-12 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-sm text-white/60">Loading our trusted partners...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return null;
  }

  const activeCustomers = customers.filter(c => c.active);

  if (activeCustomers.length === 0) {
    return null;
  }

  // Duplicate the customers array for seamless infinite scroll
  const duplicatedCustomers = [...activeCustomers, ...activeCustomers];

  return (
    <div className="py-16 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-white">
            Trusted by Austin & Marble Falls Businesses
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Join these local businesses who trust Economy Plumbing Services for their commercial plumbing needs
          </p>
        </div>
      </div>

      {/* Scrolling Logos Container */}
      <div className="relative">
        {/* Gradient Overlays - Responsive widths for mobile */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-20 md:w-32 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
        
        {/* Scrolling Track */}
        <div className="flex animate-scroll pause-animation">
          {duplicatedCustomers.map((customer, index) => (
            <div
              key={`${customer.id}-${index}`}
              className="flex-shrink-0 px-8 flex items-center justify-center"
              data-testid={`customer-logo-${customer.id}-${index}`}
            >
              {customer.websiteUrl ? (
                <a
                  href={customer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group transition-all duration-300 hover:scale-110 hover:brightness-110"
                  aria-label={`Visit ${customer.name} website`}
                  data-testid={`link-customer-${customer.id}-${index}`}
                >
                  <img
                    src={customer.logoUrl}
                    alt={`${customer.name} logo`}
                    className="h-20 w-auto object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                    data-testid={`img-logo-${customer.id}-${index}`}
                  />
                </a>
              ) : (
                <div className="block group transition-all duration-300 hover:scale-110">
                  <img
                    src={customer.logoUrl}
                    alt={`${customer.name} logo`}
                    className="h-20 w-auto object-contain brightness-0 invert opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    loading="lazy"
                    data-testid={`img-logo-${customer.id}-${index}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mt-12">
        <p className="text-sm text-white/60">
          Serving Austin and Marble Falls businesses since 2012
        </p>
      </div>
    </div>
  );
}
