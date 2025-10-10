import { useQuery } from "@tanstack/react-query";
import type { CommercialCustomer } from "@shared/schema";

export default function CommercialCustomersShowcase() {
  const { data: customers, isLoading } = useQuery<CommercialCustomer[]>({
    queryKey: ['/api/commercial-customers'],
  });

  if (isLoading) {
    return (
      <div className="py-12 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground">Loading our trusted partners...</p>
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
    <div className="py-12 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Trusted by Austin & Marble Falls Businesses
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join these local businesses who trust Economy Plumbing Services for their commercial plumbing needs
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 items-center justify-items-center">
          {activeCustomers.map((customer) => (
            <div
              key={customer.id}
              className="group relative"
              data-testid={`customer-logo-${customer.id}`}
            >
              {customer.websiteUrl ? (
                <a
                  href={customer.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 rounded-lg hover-elevate active-elevate-2 transition-all"
                  aria-label={`Visit ${customer.name} website`}
                  data-testid={`link-customer-${customer.id}`}
                >
                  <img
                    src={customer.logoUrl}
                    alt={`${customer.name} logo`}
                    className="h-16 w-auto object-contain mx-auto filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
                    loading="lazy"
                    data-testid={`img-logo-${customer.id}`}
                  />
                  <p className="text-xs text-center mt-2 text-muted-foreground group-hover:text-foreground transition-colors">
                    {customer.name}
                  </p>
                </a>
              ) : (
                <div className="block p-4 rounded-lg">
                  <img
                    src={customer.logoUrl}
                    alt={`${customer.name} logo`}
                    className="h-16 w-auto object-contain mx-auto filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                    loading="lazy"
                    data-testid={`img-logo-${customer.id}`}
                  />
                  <p className="text-xs text-center mt-2 text-muted-foreground">
                    {customer.name}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {activeCustomers.some(c => c.customerSince) && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Serving Austin and Marble Falls businesses since 2012
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
