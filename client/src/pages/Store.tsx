import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import SchedulerModal from "@/components/SchedulerModal";
import type { Product } from "@shared/schema";

export default function Store() {
  const [schedulerOpen, setSchedulerOpen] = useState(false);
  
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const memberships = products?.filter(p => p.category === 'membership') || [];

  return (
    <>
      <Helmet>
        <title>Plumbing Products & Memberships | Economy Plumbing Store</title>
        <meta name="description" content="Shop plumbing maintenance memberships and quality plumbing products from Economy Plumbing. Save on annual maintenance and get priority service." />
        <meta property="og:title" content="Plumbing Products & Memberships | Economy Plumbing Store" />
        <meta property="og:description" content="Shop plumbing maintenance memberships and quality plumbing products from Economy Plumbing." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header onScheduleClick={() => setSchedulerOpen(true)} />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-primary/5 py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Plumbing Store</h1>
                <p className="text-xl text-muted-foreground">
                  Protect your home with annual maintenance memberships and quality plumbing products
                </p>
              </div>
            </div>
          </section>

          {/* Memberships Section */}
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Maintenance Memberships</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Keep your plumbing in top shape with annual maintenance plans
                </p>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Loading memberships...</p>
                </div>
              ) : memberships.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {memberships.map((membership) => (
                    <Card 
                      key={membership.id} 
                      className="p-6 flex flex-col"
                      data-testid={`card-membership-${membership.slug}`}
                    >
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold mb-2">{membership.name}</h3>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-4xl font-bold text-primary">${(membership.price / 100).toFixed(0)}</span>
                          <span className="text-muted-foreground">/year</span>
                        </div>
                        <p className="text-muted-foreground">{membership.description}</p>
                      </div>

                      {membership.features && membership.features.length > 0 && (
                        <div className="mb-6 flex-1">
                          <p className="font-semibold mb-3">Includes:</p>
                          <ul className="space-y-2">
                            {membership.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button 
                        className="w-full bg-primary" 
                        asChild
                        data-testid={`button-purchase-${membership.slug}`}
                      >
                        <a href={`/store/checkout/${membership.slug}`}>
                          Purchase Now
                        </a>
                      </Button>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No memberships available at this time.</p>
                </div>
              )}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 lg:py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose a Membership?</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Save Money</h3>
                  <p className="text-muted-foreground">
                    Prevent costly repairs with regular maintenance and member-only discounts
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Priority Service</h3>
                  <p className="text-muted-foreground">
                    Members get priority scheduling and faster response times
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Peace of Mind</h3>
                  <p className="text-muted-foreground">
                    Regular inspections catch problems before they become emergencies
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="p-8 md:p-12 bg-primary/5 border-primary/20">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions About Our Memberships?</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Our team is happy to help you choose the right plan for your home
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg"
                      className="bg-primary"
                      onClick={() => setSchedulerOpen(true)}
                      data-testid="button-schedule-consultation"
                    >
                      Schedule Consultation
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      asChild
                      data-testid="button-call-us"
                    >
                      <a href="tel:5126492811">Call (512) 649-2811</a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
        <SchedulerModal open={schedulerOpen} onOpenChange={setSchedulerOpen} />
      </div>
    </>
  );
}
