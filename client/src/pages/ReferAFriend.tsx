import { useEffect, useState } from "react";
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
  Users,
  Loader2
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { trackEvent } from "@/lib/analytics";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ReferAFriend() {
  const phoneConfig = usePhoneConfig();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    referrerName: '',
    referrerPhone: '',
    referrerEmail: '',
    refereeName: '',
    refereePhone: '',
    refereeEmail: '',
  });

  useEffect(() => {
    // Track page view
    try {
      trackEvent('Page View', 'Referral Page', 'Loaded');
    } catch (error) {
      console.warn('Analytics not loaded yet:', error);
    }
  }, []);

  const handlePhoneClick = () => {
    trackEvent('Refer a Friend CTA', 'Referral Page', 'Phone Call');
  };

  const submitReferralMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return await apiRequest('POST', '/api/referrals/submit', data);
    },
    onSuccess: () => {
      toast({
        title: "Referral Submitted!",
        description: "We'll reach out to your friend soon. You'll get $25 credit when they complete their first service.",
        duration: 5000,
      });
      setFormData({
        referrerName: '',
        referrerPhone: '',
        referrerEmail: '',
        refereeName: '',
        refereePhone: '',
        refereeEmail: '',
      });
      // Delay closing modal so success toast is visible
      setTimeout(() => setOpen(false), 1500);
      trackEvent('Referral Form', 'Submitted', 'Success');
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again or call us directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitReferralMutation.mutate(formData);
  };

  return (
    <>
      <SEOHead
        title="Refer a Friend & Earn $25 Credit | Economy Plumbing Austin TX"
        description="Refer a friend to Economy Plumbing and get $25 off your next service. They save $25 too! Unlimited referrals, instant tracking. Trusted Austin plumbers since 1999."
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
              Give $25, Get $25
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-6">
              Refer a friend to Economy Plumbing and you both save $25 on your next service
            </p>
          </div>

          {/* Value Props */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 bg-background/80 p-4 rounded-lg border" data-testid="value-prop-you">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">$25 for You</p>
                <p className="text-sm text-muted-foreground">Service credit</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-background/80 p-4 rounded-lg border" data-testid="value-prop-them">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Gift className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">$25 for Them</p>
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
                  Fill out the form and we'll reach out to your friend with priority scheduling. You'll automatically receive a $25 credit when they complete their first service.
                </p>
              </div>

              {/* Referral Form Dialog */}
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background cursor-pointer hover-elevate" data-testid="card-referral-form">
                    <CardContent className="pt-8 pb-8 text-center">
                      <div className="mb-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Gift className="w-8 h-8 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">Ready to Refer?</h3>
                        <p className="text-muted-foreground">
                          Click to submit a referral
                        </p>
                      </div>
                      <Button 
                        size="lg" 
                        className="w-full text-lg h-14"
                        data-testid="button-open-referral-form"
                      >
                        <Gift className="w-5 h-5 mr-2" />
                        Send Referral
                      </Button>
                      <p className="text-sm text-muted-foreground mt-4">
                        Quick and easy - takes less than 1 minute
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-primary" />
                      Refer a Friend
                    </DialogTitle>
                    <DialogDescription>
                      Share the love! Both you and your friend get $25 off.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="referrerName">Your Name</Label>
                      <Input
                        id="referrerName"
                        value={formData.referrerName}
                        onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                        required
                        data-testid="input-referrer-name"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrerPhone">Your Phone Number</Label>
                      <Input
                        id="referrerPhone"
                        type="tel"
                        value={formData.referrerPhone}
                        onChange={(e) => setFormData({ ...formData, referrerPhone: e.target.value })}
                        required
                        data-testid="input-referrer-phone"
                        placeholder="(512) 555-0100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="referrerEmail">Your Email (Optional)</Label>
                      <Input
                        id="referrerEmail"
                        type="email"
                        value={formData.referrerEmail}
                        onChange={(e) => setFormData({ ...formData, referrerEmail: e.target.value })}
                        data-testid="input-referrer-email"
                        placeholder="you@example.com"
                      />
                      <p className="text-xs text-muted-foreground">Helps us match your account for faster credit</p>
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium mb-3">Friend's Information</p>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="refereeName">Friend's Name</Label>
                          <Input
                            id="refereeName"
                            value={formData.refereeName}
                            onChange={(e) => setFormData({ ...formData, refereeName: e.target.value })}
                            required
                            data-testid="input-referee-name"
                            placeholder="Jane Smith"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="refereePhone">Friend's Phone Number</Label>
                          <Input
                            id="refereePhone"
                            type="tel"
                            value={formData.refereePhone}
                            onChange={(e) => setFormData({ ...formData, refereePhone: e.target.value })}
                            required
                            data-testid="input-referee-phone"
                            placeholder="(512) 555-0200"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="refereeEmail">Friend's Email (Optional)</Label>
                          <Input
                            id="refereeEmail"
                            type="email"
                            value={formData.refereeEmail}
                            onChange={(e) => setFormData({ ...formData, refereeEmail: e.target.value })}
                            data-testid="input-referee-email"
                            placeholder="jane@example.com"
                          />
                        </div>
                      </div>
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={submitReferralMutation.isPending}
                      data-testid="button-submit-referral"
                    >
                      {submitReferralMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Submit Referral
                        </>
                      )}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>

              <div className="mt-6 p-4 bg-muted/30 rounded-lg border" data-testid="info-tracking">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Secure & Easy Process</p>
                    <p className="text-xs text-muted-foreground">
                      Every referral is tracked. We'll notify you when your $25 credit is applied to your account.
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
                        We contact them with priority scheduling and $25 discount
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3" data-testid="step-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </div>
                    <div>
                      <p className="font-medium">You Get $25 Credit</p>
                      <p className="text-sm text-muted-foreground">
                        After their service, you receive $25 off your next job
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
                <span className="font-semibold text-left">How do I get my $25 credit?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Submit a referral using the form above. When your friend completes their first service (minimum $200), we automatically apply a $25 credit to your account. You'll receive an email confirmation when the credit is added. Use it anytime on your next service call.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-friend-benefit">
                <span className="font-semibold text-left">What does my friend get?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Your friend receives $25 off their first service (minimum $200 job), priority scheduling (often same-day or next-day), and the same 5-star service you experienced. We'll contact them directly to schedule at their convenience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-limit">
                <span className="font-semibold text-left">Is there a limit on referrals?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                No limit! Refer as many friends as you'd like. Each completed referral earns you another $25 credit. Credits never expire and can be stacked for larger jobs.
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
                Every referral is tracked automatically. When your friend completes their first service, your $25 credit is applied to your account. You'll receive an email confirmation when the credit is added. You can check your referral status anytime by calling us at {phoneConfig.display}.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-background border rounded-lg px-6">
              <AccordionTrigger className="hover:no-underline" data-testid="accordion-trigger-commercial">
                <span className="font-semibold text-left">Can I refer businesses?</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolutely! Commercial referrals qualify too. If you refer a restaurant, retail shop, office building, or property management company, you'll receive the same $25 credit per completed referral (minimum $250 commercial job).
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
              Start Earning $25 Credits Today
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
