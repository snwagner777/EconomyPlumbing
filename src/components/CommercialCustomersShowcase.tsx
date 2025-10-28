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

  return (
    <div className="py-12 sm:py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 text-white">
            Trusted by Austin & Marble Falls Businesses
          </h2>
          <p className="text-sm text-white/70 max-w-2xl mx-auto">
            Join these local businesses who trust Economy Plumbing Services for their commercial plumbing needs
          </p>
        </div>

        {/* Modern Grid Layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-8 sm:gap-12 items-center justify-items-center">
          {activeCustomers.map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-center w-full"
              data-testid={`customer-logo-${customer.id}`}
            >
              {customer.websiteUrl ? (
                <a
                  href={customer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group transition-all duration-300"
                  aria-label={`Visit ${customer.name} website`}
                  data-testid={`link-customer-${customer.id}`}
                >
                  <img
                    src={customer.logoUrl}
                    alt={`${customer.name} logo`}
                    className="h-16 sm:h-20 w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    loading="lazy"
                    data-testid={`img-logo-${customer.id}`}
                  />
                </a>
              ) : (
                <div className="block group transition-all duration-300">
                  <img
                    src={customer.logoUrl}
                    alt={`${customer.name} logo`}
                    className="h-16 sm:h-20 w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                    loading="lazy"
                    data-testid={`img-logo-${customer.id}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-xs sm:text-sm text-white/60">
            Serving Austin and Marble Falls businesses since 2012
          </p>
        </div>
      </div>
    </div>
  );
}
