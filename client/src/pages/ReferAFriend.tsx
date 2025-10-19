import { useEffect } from "react";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gift,
  CheckCircle,
  Phone,
  Users,
  DollarSign,
  Heart,
  Star,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";
import { trackEvent } from "@/lib/analytics";

const steps = [
  {
    step: 1,
    title: "Share Your Experience",
    description: "Tell your friends and family about your great experience with Economy Plumbing",
    icon: MessageCircle
  },
  {
    step: 2,
    title: "They Get Service",
    description: "When they call and mention your name, they'll receive priority scheduling",
    icon: Users
  },
  {
    step: 3,
    title: "You Both Save",
    description: "You get a credit toward future service, and they get a new customer discount",
    icon: Gift
  }
];

const benefits = [
  { title: "Trusted Service", description: "Refer with confidence - you know the quality they'll receive", icon: Star },
  { title: "Help Neighbors", description: "Help friends and family find a reliable plumber they can trust", icon: Heart },
  { title: "Save Money", description: "Earn credits toward future plumbing needs with every referral", icon: DollarSign },
  { title: "Priority Support", description: "Referred customers get priority scheduling", icon: CheckCircle }
];

export default function ReferAFriend() {
  const phoneConfig = usePhoneConfig();

  // Load NiceJob widget script for referral functionality
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.nicejob.co/js/sdk.min.js?id=af0b88b8-5c68-4702-83f4-085ac673376f';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const handleReferClick = () => {
    trackEvent('Refer a Friend CTA', 'Referral Page', 'Phone Call');
    window.location.href = `tel:${phoneConfig.tel}`;
  };

  return (
    <>
      <SEOHead
        title="Refer a Friend - Save on Plumbing Services | Economy Plumbing Austin TX"
        description="Love Economy Plumbing? Refer your friends and family to earn credits toward future service! Both you and your referral save money. Trusted Austin plumbers since 1999."
        canonical="/refer-a-friend"
      />

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Gift className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Refer a Friend, Save Together
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Love the service you received from Economy Plumbing? Share the experience with friends and family - and both of you save money!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={handleReferClick}
              size="lg"
              data-testid="button-refer-call"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call to Refer: {phoneConfig.display}
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              data-testid="button-refer-contact"
            >
              <a href="/contact">
                Send Referral Online
              </a>
            </Button>
          </div>

          <div className="mt-8 inline-block">
            <Badge variant="secondary" className="px-6 py-2 text-base">
              <Star className="w-4 h-4 mr-2" />
              200+ 5-Star Reviews from Happy Customers
            </Badge>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Our Referral Program Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <Card key={step.step} className="relative">
                <div className="absolute -top-4 left-6">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {step.step}
                  </div>
                </div>
                <CardHeader className="pt-8">
                  <div className="mb-3">
                    <step.icon className="w-10 h-10 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Refer Economy Plumbing?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6 text-center">
                  <benefit.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Referral Rewards Program
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-primary" />
                  For You (The Referrer)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Service Credit</p>
                    <p className="text-sm text-muted-foreground">
                      Earn credit toward your next plumbing service
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Unlimited Referrals</p>
                    <p className="text-sm text-muted-foreground">
                      No limit on how many friends you can refer
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Priority Service</p>
                    <p className="text-sm text-muted-foreground">
                      Continued priority scheduling for loyal customers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-6 h-6 text-primary" />
                  For Your Friend (New Customer)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">New Customer Discount</p>
                    <p className="text-sm text-muted-foreground">
                      Special pricing on their first service call
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Priority Scheduling</p>
                    <p className="text-sm text-muted-foreground">
                      Referred customers get fast-tracked scheduling
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">5-Star Service</p>
                    <p className="text-sm text-muted-foreground">
                      The same quality service you experienced
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Join Hundreds of Happy Customers
              </CardTitle>
              <CardDescription className="text-center text-base mt-2">
                Our customers trust us enough to recommend us to their friends and family
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">200+</div>
                  <p className="text-sm text-muted-foreground">5-Star Reviews</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">25+</div>
                  <p className="text-sm text-muted-foreground">Years in Business</p>
                </div>
                <div>
                  <div className="text-4xl font-bold text-primary mb-2">1000s</div>
                  <p className="text-sm text-muted-foreground">Satisfied Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How to Refer - Powered by NiceJob */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">
              How to Refer (Powered by NiceJob)
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our referral program is managed through NiceJob, ensuring you get credit for every friend you refer. Choose your preferred referral method below!
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Method 1: Call */}
            <Card>
              <CardHeader>
                <div className="mb-3">
                  <Phone className="w-10 h-10 text-primary" />
                </div>
                <CardTitle>Call Us</CardTitle>
                <CardDescription>
                  Quick and personal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Call us with your friend's name and contact info. We'll reach out and track the referral in NiceJob.
                </p>
                <Button
                  onClick={handleReferClick}
                  className="w-full"
                  data-testid="button-refer-phone-method"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
              </CardContent>
            </Card>

            {/* Method 2: Tell Them to Call */}
            <Card className="border-primary/30">
              <CardHeader>
                <div className="mb-3">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <CardTitle>Have Them Call</CardTitle>
                <CardDescription>
                  They get priority service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tell your friend to call and mention YOUR NAME. Our NiceJob system automatically tracks the referral.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  data-testid="button-share-number"
                >
                  <a href={`sms:?&body=I%20use%20Economy%20Plumbing%20and%20they%27re%20great!%20Call%20${phoneConfig.tel.replace(/[^0-9]/g, '')}%20and%20mention%20my%20name%20for%20priority%20service.`}>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Share via Text
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Method 3: Online Form */}
            <Card>
              <CardHeader>
                <div className="mb-3">
                  <Gift className="w-10 h-10 text-primary" />
                </div>
                <CardTitle>Online Referral</CardTitle>
                <CardDescription>
                  Submit anytime
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Fill out our contact form with your referral details. We'll add it to NiceJob and follow up.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full"
                  data-testid="button-refer-online"
                >
                  <a href="/contact?subject=Referral">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Submit Referral
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold mb-2">NiceJob Tracks Everything</h3>
                <p className="text-sm text-muted-foreground">
                  No matter which method you choose, our NiceJob system tracks your referral and ensures you get credit toward future service. Your friend gets priority scheduling and a new customer discount!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="pt-8 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">
                Start Earning Rewards
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Ready to share the best plumbing service in Austin? Use the NiceJob referral system above, or contact us directly to get started!
              </p>

              <p className="text-sm text-muted-foreground">
                Questions about our referral program? Call us at {phoneConfig.display}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </>
  );
}
