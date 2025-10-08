import { SEOHead } from "@/components/SEO/SEOHead";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function OAuthSuccess() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      setLocation('/admin/oauth-config');
    }, 3000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  return (
    <>
      <SEOHead
        title="Authentication Successful | Admin"
        description="Google My Business authentication successful"
      />

      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1 flex items-center justify-center py-16">
          <Card className="p-12 max-w-md mx-4 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold mb-3">Authentication Successful!</h1>
            <p className="text-muted-foreground mb-8">
              Your Google account has been connected successfully. Now let's configure your Account and Location IDs.
            </p>

            <Button 
              asChild
              className="bg-primary w-full"
              data-testid="button-configure-ids"
            >
              <a href="/admin/oauth-config">Continue to Configuration</a>
            </Button>

            <p className="text-sm text-muted-foreground mt-4">
              You'll be redirected automatically in 3 seconds...
            </p>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}
