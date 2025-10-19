import { useEffect } from "react";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gift,
  CheckCircle,
  Phone,
  DollarSign,
  Star,
  MessageCircle,
  Clock,
  Shield,
  Users
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { trackEvent } from "@/lib/analytics";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function ReferAFriend() {
  const phoneConfig = usePhoneConfig();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.nicejob.co/js/sdk.min.js?id=af0b88b8-5c68-4702-83f4-085ac673376f';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    trackEvent('Page View', 'Referral Page', 'Loaded');

    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handlePhoneClick = () => {
    trackEvent('Refer a Friend CTA', 'Referral Page', 'Phone Call');
  };

  return (
    <>
      <SEOHead
        title="Refer a Friend & Earn $50 Credit | Economy Plumbing Austin TX"
        description="Refer a friend to Economy Plumbing and get $50 off your next service. They save $50 too! Unlimited referrals, instant tracking. Trusted Austin plumbers since 1999."
        canonical="/refer-a-friend"
      />

      <Header />

      {/* Hero Section with Clear Value Prop */}
      <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-background py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <Gift className="w-4 h-4 mr-2" />
              Limited Time Offer
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Give $50, Get $50
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Refer a friend to Economy Plumbing and you both save $50 on your next service
            </p>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 bg-background/80 p-4 rounded-lg border" data-testid="value-prop-you">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">$50 for You</p>
                <p className="text-sm text-muted-foreground">Service credit</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/80 p-4 rounded-lg border" data-testid="value-prop-them">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">$50 for Them</p>
                <p className="text-sm text-muted-foreground">First service discount</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/80 p-4 rounded-lg border" data-testid="value-prop-unlimited">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">No Limit</p>
                <p className="text-sm text-muted-foreground">Refer unlimited friends</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referral Form - Primary CTA */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Form */}
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-3">
                  Send a Referral Now
                </h2>
                <p className="text-lg text-muted-foreground">
                  Fill out the form and we'll reach out to your friend with priority scheduling. You'll automatically receive a $50 credit when they complete their first service.
                </p>
              </div>

              {/* NiceJob Referral Widget - Prominent placement */}
              <Card className="border-primary/20" data-testid="card-referral-form">
                <CardContent className="pt-6">
                  <div className="nj-recommendation" data-testid="nicejob-referral-widget">
                    Recommend us!
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg border" data-testid="info-tracking">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Secure & Tracked by NiceJob</p>
                    <p className="text-xs text-muted-foreground">
                      Every referral is automatically tracked. We'll notify you when your credit is applied.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Benefits & Social Proof */}
            <div className="space-y-6">
              {/* How It Works */}
              <Card data-testid="card-how-it-works">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3" data-testid="step-1">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Submit Referral</p>
                      <p className="text-sm text-muted-foreground">
                        Fill out the form with your friend's contact info
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3" data-testid="step-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <p className="font-medium">We Reach Out</p>
                      <p className="text-sm text-muted-foreground">
                        We contact them with priority scheduling and $50 discount
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3" data-testid="step-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">You Get $50 Credit</p>
                      <p className="text-sm text-muted-foreground">
                        After their service, you receive $50 off your next job
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Social Proof */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background" data-testid="card-social-proof">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold" data-testid="text-referral-count">500+ Referrals</p>
                      <p className="text-sm text-muted-foreground">This year alone</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2" data-testid="rating-stars">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium ml-2">4.9/5</span>
                    </div>
                    <p className="text-sm text-muted-foreground italic" data-testid="text-testimonial">
                      "I've referred 3 friends already. Easy process, great rewards, and everyone's been happy with the service!"
                    </p>
                    <p className="text-xs text-muted-foreground">— Sarah M., Austin TX</p>
                  </div>
                </CardContent>
              </Card>

              {/* Alternate Options */}
              <Card data-testid="card-alternate-options">
                <CardHeader>
                  <CardTitle className="text-lg">Prefer to Call or Text?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    data-testid="button-call-referral"
                  >
                    <a 
                      href={`tel:${phoneConfig.tel}`}
                      onClick={handlePhoneClick}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call {phoneConfig.display}
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full"
                    data-testid="button-text-referral"
                  >
                    <a href={`sms:?&body=Check%20out%20Economy%20Plumbing!%20Call%20${phoneConfig.tel.replace(/[^0-9]/g, '')}%20and%20mention%20my%20name%20-%20we%20both%20save%20%2450!`}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Share via Text
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    Give us their info by phone, or have them mention your name when they call
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-4" data-testid="accordion-faq">
            <AccordionItem value="item-1" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-credit">
                <span className="font-semibold text-left">How do I get my $50 credit?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Submit a referral using the form above. When your friend completes their first service (minimum $200), we automatically apply a $50 credit to your account. You'll receive an email confirmation when the credit is added. Use it anytime on your next service call.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-friend-benefit">
                <span className="font-semibold text-left">What does my friend get?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your friend receives $50 off their first service (minimum $200 job), priority scheduling (often same-day or next-day), and the same 5-star service you experienced. We'll contact them directly to schedule at their convenience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-limit">
                <span className="font-semibold text-left">Is there a limit on referrals?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No limit! Refer as many friends as you'd like. Each completed referral earns you another $50 credit. Credits never expire and can be stacked for larger jobs.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-expiration">
                <span className="font-semibold text-left">Do credits expire?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Nope! Your referral credits never expire. You can accumulate multiple credits and use them all at once on a big job, or save them for future maintenance.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-tracking">
                <span className="font-semibold text-left">How is this tracked?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We use NiceJob, a professional referral tracking system. Every referral is logged automatically, whether submitted online, by phone, or when your friend mentions your name. You can check your referral status anytime by calling us at {phoneConfig.display}.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-commercial">
                <span className="font-semibold text-left">Can I refer businesses?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! Commercial referrals qualify too. If you refer a restaurant, retail shop, office building, or property management company, you'll receive the same $50 credit per completed referral (minimum $500 commercial job).
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20" data-testid="section-final-cta">
            <Gift className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-3xl font-bold mb-3">
              Start Earning $50 Credits Today
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Scroll back up to submit your first referral, or call us at {phoneConfig.display}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="secondary" className="px-4 py-2" data-testid="badge-no-limit">
                <CheckCircle className="w-4 h-4 mr-2" />
                No Limit
              </Badge>
              <Badge variant="secondary" className="px-4 py-2" data-testid="badge-never-expires">
                <CheckCircle className="w-4 h-4 mr-2" />
                Never Expires
              </Badge>
              <Badge variant="secondary" className="px-4 py-2" data-testid="badge-instant-tracking">
                <CheckCircle className="w-4 h-4 mr-2" />
                Instant Tracking
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
