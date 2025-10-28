'use client';
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Gift,
  Trophy,
  TrendingUp,
  Users,
  DollarSign,
  Star,
  Crown,
  Medal
} from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { ReferralSubmissionForm } from "@/components/ReferralSubmissionForm";

interface LeaderboardEntry {
  name: string;
  referralCount: number;
}

interface CustomerLeaderboardEntry {
  name: string;
  jobCount: number;
}

export default function ReferAFriend() {
  const { data: leaderboardData } = useQuery<{ leaderboard: LeaderboardEntry[] }>({
    queryKey: ['/api/referrals/leaderboard'],
  });

  const { data: customersLeaderboardData } = useQuery<{ leaderboard: CustomerLeaderboardEntry[] }>({
    queryKey: ['/api/customers/leaderboard'],
  });

  useEffect(() => {
    try {
      trackEvent('Page View', 'Referral Leaderboard', 'Loaded');
    } catch (error) {
      console.warn('Analytics not loaded yet:', error);
    }
  }, []);

  const getMedalIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <>
      <SEOHead
        title="Referral Leaderboard - Win Rewards | Economy Plumbing Austin"
        description="Join our referral leaderboard! Refer friends to Economy Plumbing and earn $25 per completed job. See who's leading and climb the ranks for exclusive rewards."
        canonical="/refer-a-friend"
      />

      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 via-primary/5 to-background py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5">
            <Trophy className="w-4 h-4 mr-2" />
            Referral Leaderboard
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Compete & Earn Rewards
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Refer friends, climb the leaderboard, and earn $25 in service credits for every completed referral
          </p>

          <Button
            asChild
            size="lg"
            className="text-lg h-14 px-8"
            data-testid="button-get-referral-link"
          >
            <a href="/customer-portal">
              <Gift className="w-5 h-5 mr-2" />
              Get Your Referral Link
            </a>
          </Button>
          <p className="text-sm text-muted-foreground mt-3">
            Access the Customer Portal to get your unique referral link
          </p>
        </div>
      </section>

      {/* Referral Submission Form */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <ReferralSubmissionForm />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">1. Get Your Link</h3>
                <p className="text-sm text-muted-foreground">
                  Visit the Customer Portal to get your unique referral link and tracking code
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">2. Share With Friends</h3>
                <p className="text-sm text-muted-foreground">
                  Send your link via SMS, email, or social media. They get $25 off their first service
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">3. Earn & Climb</h3>
                <p className="text-sm text-muted-foreground">
                  Get $25 service credit for each completed referral. Credits valid for 6 months.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Top Referrers
            </h2>
            <p className="text-lg text-muted-foreground">
              See who's leading the pack! Will you be next?
            </p>
          </div>

          {leaderboardData && leaderboardData.leaderboard.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaderboardData.leaderboard.map((entry, index) => (
                <Card 
                  key={index}
                  className={`${
                    index === 0 
                      ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-background md:col-span-2 lg:col-span-1' 
                      : index === 1 
                      ? 'border-gray-400/50 bg-gradient-to-br from-gray-400/10 to-background'
                      : index === 2
                      ? 'border-amber-600/50 bg-gradient-to-br from-amber-600/10 to-background'
                      : ''
                  }`}
                  data-testid={`leaderboard-entry-${index}`}
                >
                  <CardContent className="py-6">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto">
                        {getMedalIcon(index)}
                      </div>
                      <div>
                        <p className="font-bold text-xl mb-1" data-testid={`leaderboard-name-${index}`}>
                          {entry.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.referralCount} successful {entry.referralCount === 1 ? 'referral' : 'referrals'}
                        </p>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-center gap-1 text-primary font-bold">
                          <DollarSign className="w-5 h-5" />
                          <span className="text-2xl" data-testid={`leaderboard-earnings-${index}`}>
                            {entry.referralCount * 25}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">earned</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Be the First!</h3>
                <p className="text-muted-foreground mb-6">
                  The leaderboard is waiting for its first champion. Start referring today!
                </p>
                <Button asChild data-testid="button-get-started">
                  <a href="/customer-portal">
                    <Gift className="w-4 h-4 mr-2" />
                    Get Started
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Top Customers Leaderboard */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Most Loyal Customers
            </h2>
            <p className="text-lg text-muted-foreground">
              Our amazing customers who trust us most with their plumbing needs!
            </p>
          </div>

          {customersLeaderboardData && customersLeaderboardData.leaderboard.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customersLeaderboardData.leaderboard.map((entry, index) => (
                <Card 
                  key={index}
                  className={`${
                    index === 0 
                      ? 'border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-background md:col-span-2 lg:col-span-1' 
                      : index === 1 
                      ? 'border-gray-400/50 bg-gradient-to-br from-gray-400/10 to-background'
                      : index === 2
                      ? 'border-amber-600/50 bg-gradient-to-br from-amber-600/10 to-background'
                      : ''
                  }`}
                  data-testid={`customer-leaderboard-entry-${index}`}
                >
                  <CardContent className="py-6">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 flex items-center justify-center mx-auto">
                        {getMedalIcon(index)}
                      </div>
                      <div>
                        <p className="font-bold text-xl mb-1" data-testid={`customer-name-${index}`}>
                          {entry.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.jobCount} service {entry.jobCount === 1 ? 'call' : 'calls'}
                        </p>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-center">
                          <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">VIP Customer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-bold mb-2">Building Our Community</h3>
                <p className="text-muted-foreground">
                  Our loyal customers leaderboard is being built. Check back soon!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-primary" />
                  <CardTitle>Unlimited Earnings</CardTitle>
                </div>
                <CardDescription>
                  No caps on how much you can earn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">$25 per completed referral</p>
                    <p className="text-sm text-muted-foreground">
                      No limit on referrals. Service credit only, no cash value.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Credits valid for 6 months</p>
                    <p className="text-sm text-muted-foreground">
                      Use your rewards within 180 days of earning them
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Gift className="w-6 h-6 text-primary" />
                  <CardTitle>Your Friends Benefit Too</CardTitle>
                </div>
                <CardDescription>
                  Everyone wins with our referral program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">$25 off their first service</p>
                    <p className="text-sm text-muted-foreground">
                      Instant discount on jobs $200 or more
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Same 5-star service</p>
                    <p className="text-sm text-muted-foreground">
                      Licensed, insured plumbers you trust
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Get your unique referral link from the Customer Portal and start sharing today
          </p>
          <Button
            asChild
            size="lg"
            className="text-lg h-14 px-8"
            data-testid="button-customer-portal-cta"
          >
            <a href="/customer-portal">
              <Users className="w-5 h-5 mr-2" />
              Access Customer Portal
            </a>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            New customer? Call us first to set up your account, then access the portal to get your referral link
          </p>
          <p className="text-xs text-muted-foreground mt-3 max-w-2xl mx-auto">
            * Credits are valid for 6 months from issue date and have no cash value. Credits apply to service calls only and cannot be redeemed for cash or transferred.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
