import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookieConsent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-lg" data-testid="banner-cookie">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              We use cookies to enhance your browsing experience and analyze site traffic. 
              By clicking "Accept", you consent to our use of cookies.{" "}
              <a 
                href="/privacy-policy" 
                className="underline hover:text-primary"
                data-testid="link-privacy"
              >
                View our privacy policy
              </a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              data-testid="button-decline-cookies"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-primary text-primary-foreground"
              data-testid="button-accept-cookies"
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              className="h-8 w-8"
              data-testid="button-close-banner"
              aria-label="Close cookie banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
