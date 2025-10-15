import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCircle } from "lucide-react";
import { openScheduler } from "@/lib/scheduler";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

/*
 * ECWID SETUP INSTRUCTIONS:
 * 
 * 1. Create your Ecwid account at https://www.ecwid.com/
 * 2. Choose a plan (Business $35/mo recommended for full features)
 * 3. Get your Store ID from Settings → General → Store Profile
 * 4. Replace "YOUR_STORE_ID" below with your actual Ecwid Store ID
 * 
 * DROP-SHIPPING SETUP (After store is running):
 * 1. Install Printful app from Ecwid App Market for custom branded products
 * 2. Install Spocket app from Ecwid App Market for US/EU supplier products
 * 3. Connect Stripe in Ecwid Settings → Payment
 * 
 * See /tmp/ECWID_SETUP_GUIDE.md for detailed instructions
 * See /tmp/ecwid_products_reference.txt for list of products to add
 */

const ECWID_STORE_ID = "90741099"; // Your Ecwid Store ID

export default function Store() {
  const { data: products } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const memberships = products?.filter(p => p.category === 'membership') || [];

  const membershipTiers = memberships.map((membership) => {
    const isPlatinum = membership.name.toLowerCase().includes('platinum');
    const priceDisplay = isPlatinum 
      ? `$${(membership.price / 100).toFixed(2)} / 3 years`
      : `$${(membership.price / 100).toFixed(2)} / year`;
    
    return {
      name: membership.name,
      slug: membership.slug,
      price: priceDisplay,
      description: membership.description,
      features: membership.features || [],
      image: membership.image,
      popular: isPlatinum && membership.name.toLowerCase().includes('tank')
    };
  });

  useEffect(() => {
    // Load Ecwid script
    const script = document.createElement('script');
    script.src = `https://app.ecwid.com/script.js?${ECWID_STORE_ID}&data_platform=code`;
    script.type = 'text/javascript';
    script.setAttribute('charset', 'utf-8');
    script.setAttribute('data-cfasync', 'false');
    
    // Initialize Ecwid once script loads
    script.onload = () => {
      if (window.xProductBrowser) {
        window.xProductBrowser(`id=my-store-${ECWID_STORE_ID}`);
      }
    };
    
    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <>
      <SEOHead
        title="VIP Memberships & Plumbing Products | Economy Store"
        description="VIP memberships with 10-15% discounts & quality plumbing products. Priority service, fast shipping to Austin & Marble Falls. Call (512) 368-9159!"
        canonical="https://www.plumbersthatcare.com/store"
        ogImage="https://www.plumbersthatcare.com/attached_assets/logo.jpg"
        ogImageAlt="Economy Plumbing Services - VIP Memberships and Products"
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-primary/5 py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Store</h1>
                <p className="text-xl text-muted-foreground">
                  VIP memberships and quality plumbing products
                </p>
              </div>
            </div>
          </section>

          {/* VIP Memberships Section */}
          {membershipTiers.length > 0 && (
            <section className="py-16 lg:py-20 bg-muted/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">VIP Memberships</h2>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Save money with priority service, discounts, and annual maintenance
                  </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {membershipTiers.map((tier, idx) => (
                    <Card key={idx} className={`p-8 relative flex flex-col ${tier.popular ? 'border-primary border-2' : ''}`}>
                      {tier.popular && (
                        <Badge className="absolute top-4 right-4 bg-primary">Most Popular</Badge>
                      )}
                      {tier.image && (
                        <div className="mb-4 flex justify-center">
                          <img 
                            src={tier.image} 
                            alt={`${tier.name} VIP membership tier`}
                            width="128"
                            height="128"
                            loading="lazy"
                            decoding="async"
                            className="w-32 h-32 object-contain"
                          />
                        </div>
                      )}
                      <div className="text-center mb-6">
                        <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                        <p className="text-3xl font-poppins font-bold text-primary mb-2">{tier.price}</p>
                        <p className="text-muted-foreground text-sm">{tier.description}</p>
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {tier.features.map((feature, featureIdx) => (
                          <li key={featureIdx} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        asChild 
                        className="w-full"
                        data-testid={`button-purchase-${tier.slug}`}
                      >
                        <Link href={`/store/checkout/${tier.slug}`}>Purchase Now</Link>
                      </Button>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Ecwid Products Section */}
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Plumbing Products</h2>
                <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                  Professional-grade products delivered to your door
                </p>
              </div>
              <div className="w-full">
                {/* Ecwid store widget will load here */}
                <div 
                  id="my-store-90741099"
                  data-testid="ecwid-store-container"
                />
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="py-16 lg:py-24 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Shop With Us?</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                  <p className="text-muted-foreground">
                    Professional-grade plumbing supplies and products we trust and use ourselves
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Fast Shipping</h3>
                  <p className="text-muted-foreground">
                    Drop-shipped directly to your door in Austin and Marble Falls areas
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                  <p className="text-muted-foreground">
                    Questions about installation? Our team is here to help you succeed
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
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Help Finding Something?</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Our team can help you find the right product or answer installation questions
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg"
                      className="bg-primary"
                      onClick={() => openScheduler()}
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
                      <a href="tel:+15123689159">Call (512) 368-9159</a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

// TypeScript declaration for Ecwid
declare global {
  interface Window {
    Ecwid?: {
      init: () => void;
    };
    xProductBrowser?: (...args: string[]) => void;
  }
}
