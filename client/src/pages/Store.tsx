import { SEOHead } from "@/components/SEO/SEOHead";
import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { openScheduler } from "@/lib/scheduler";

/*
 * ECWID SETUP INSTRUCTIONS:
 * 
 * 1. Create your Ecwid account at https://www.ecwid.com/
 * 2. Choose a plan (Venture $15/mo or Business $35/mo recommended)
 * 3. After creating your account, find your Store ID:
 *    - Go to Ecwid Admin → Settings → General → Store Profile
 *    - Copy your Store ID (it's a number like "12345678")
 * 4. Replace "YOUR_STORE_ID" below with your actual Store ID
 * 5. Add all your products/memberships in Ecwid dashboard
 * 
 * DROP-SHIPPING SETUP (After store is running):
 * 1. Install Printful app from Ecwid App Market for custom branded products
 * 2. Install Spocket app from Ecwid App Market for US/EU supplier products
 * 3. Connect Stripe in Ecwid Settings → Payment for seamless checkout
 * 
 * See /tmp/ecwid_products_reference.txt for list of products to add to Ecwid
 */

const ECWID_STORE_ID = "YOUR_STORE_ID"; // Replace with your actual Ecwid store ID

export default function Store() {
  useEffect(() => {
    // Load Ecwid script dynamically
    if (ECWID_STORE_ID !== "YOUR_STORE_ID") {
      const script = document.createElement('script');
      script.src = `https://app.ecwid.com/script.js?${ECWID_STORE_ID}`;
      script.setAttribute('data-cfasync', 'false');
      script.charset = 'utf-8';
      
      // Initialize Ecwid widget once script loads
      script.onload = () => {
        // @ts-ignore - Ecwid global is added by the loaded script
        if (window.Ecwid) {
          // @ts-ignore
          window.Ecwid.init();
        }
      };

      document.body.appendChild(script);

      return () => {
        // Cleanup: remove script when component unmounts
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        // Clean up Ecwid instance if it exists
        // @ts-ignore
        if (window.Ecwid && window.Ecwid.destroy) {
          // @ts-ignore
          window.Ecwid.destroy();
        }
      };
    }
  }, []);

  return (
    <>
      <SEOHead
        title="Plumbing Products & Memberships | Economy Plumbing Store"
        description="Shop VIP plumbing memberships & quality products. Save on annual maintenance, get priority service. Austin & Marble Falls. Call (512) 368-9159 today!"
        canonical="https://www.plumbersthatcare.com/store"
        ogImage="https://www.plumbersthatcare.com/attached_assets/logo.jpg"
        ogImageAlt="Economy Plumbing Services - VIP Memberships and Professional Products"
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
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

          {/* Ecwid Store Section */}
          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {ECWID_STORE_ID === "YOUR_STORE_ID" ? (
                <div className="text-center py-12">
                  <Card className="p-8 max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold mb-4">Store Setup Required</h2>
                    <p className="text-muted-foreground mb-4">
                      To display your Ecwid store, please update the ECWID_STORE_ID constant in 
                      <code className="bg-muted px-2 py-1 rounded mx-1">client/src/pages/Store.tsx</code>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      See instructions at the top of Store.tsx for setup steps
                    </p>
                  </Card>
                </div>
              ) : (
                <div 
                  id={`my-store-${ECWID_STORE_ID}`}
                  data-testid="ecwid-store-widget"
                >
                  {/* Ecwid store will render here */}
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
