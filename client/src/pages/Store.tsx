import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { openScheduler } from "@/lib/scheduler";
import { useEffect } from "react";

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

// TypeScript declaration for Ecwid
declare global {
  interface Window {
    Ecwid?: {
      init: () => void;
    };
    xProductBrowser?: (...args: string[]) => void;
  }
}
