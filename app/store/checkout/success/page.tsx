'use client';
import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Phone } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

function MembershipSuccessContent() {
  const phoneConfig = usePhoneConfig();
  const searchParams = useSearchParams();
  const productSlug = searchParams?.get('product');

  useEffect(() => {
    // Track membership purchase conversion
    trackEvent('membership_purchase', 'membership', productSlug || 'unknown');
  }, [productSlug]);

  return (
    <>

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 py-16 lg:py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Welcome to the VIP Program!
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8">
                Your membership purchase was successful. You'll receive a confirmation email shortly with all the details.
              </p>

              <div className="bg-muted/50 rounded-lg p-6 mb-8 text-left">
                <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
                <ol className="space-y-3 list-decimal list-inside">
                  <li className="text-muted-foreground">
                    Check your email for membership confirmation and receipt
                  </li>
                  <li className="text-muted-foreground">
                    Our team will contact you within 24 hours to schedule your first maintenance visit
                  </li>
                  <li className="text-muted-foreground">
                    You can now enjoy priority scheduling and VIP member benefits
                  </li>
                  <li className="text-muted-foreground">
                    Save our VIP support line: <a href={phoneConfig.tel} className="text-primary hover:underline">{phoneConfig.display}</a>
                  </li>
                </ol>
              </div>

              <div className="space-y-4">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto"
                  asChild
                >
                  <a href="/">Return to Home</a>
                </Button>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Have questions about your membership?
                  </p>
                  <Button 
                    variant="outline"
                    size="lg"
                    asChild
                    data-testid="button-call-support"
                  >
                    <a href={phoneConfig.tel} className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Call {phoneConfig.display}
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}

export default function MembershipSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <MembershipSuccessContent />
    </Suspense>
  );
}
