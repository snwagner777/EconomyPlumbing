import { useQuery } from "@tanstack/react-query";
import { Star, ExternalLink, Facebook, Shield, Heart, Clock, TrendingUp, CheckCircle, Award, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SiYelp } from "react-icons/si";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface ReviewPlatform {
  id: string;
  platform: string;
  displayName: string;
  url: string;
  enabled: boolean;
  sortOrder: number;
  icon: string | null;
  description: string | null;
}

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'google':
      return <Star className="w-6 h-6" />;
    case 'facebook':
      return <Facebook className="w-6 h-6" />;
    case 'bbb':
      return <Shield className="w-6 h-6" />;
    case 'yelp':
      return <SiYelp className="w-6 h-6" />;
    default:
      return <Star className="w-6 h-6" />;
  }
};

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'google':
      return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800';
    case 'facebook':
      return 'bg-[#1877F2] hover:bg-[#1668D9] dark:bg-[#1668D9] dark:hover:bg-[#1459C0]';
    case 'bbb':
      return 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800';
    case 'yelp':
      return 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800';
    default:
      return 'bg-primary hover:bg-primary/90';
  }
};

export default function ReviewRequest() {
  const { data: platforms, isLoading } = useQuery<ReviewPlatform[]>({
    queryKey: ['/api/review-platforms'],
  });

  // Dynamic personalization based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Random rotation of customer impact messages
  const impactMessages = [
    "Your review helps families find reliable plumbing service when they need it most",
    "Local homeowners depend on reviews like yours to make informed decisions",
    "Your feedback guides others to trustworthy service in our community",
    "By sharing your experience, you're helping neighbors avoid plumbing disasters",
  ];
  const randomImpact = impactMessages[Math.floor(Math.random() * impactMessages.length)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SEOHead
        title="Leave a Review | Economy Plumbing Services"
        description="Share your experience with Economy Plumbing Services. Your review helps our business grow and helps other customers make informed decisions."
        canonical="/request-review"
      />
      
      <Header />

      <div className="container max-w-4xl mx-auto px-4 py-16 space-y-8">
        {/* Header with dynamic greeting */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Star className="w-8 h-8 text-primary fill-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {getGreeting()}! Thank You for Choosing Economy Plumbing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {randomImpact}. A quick review takes just 2 minutes and makes a huge difference!
          </p>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">15,000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">4.8★ Average Rating</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Since 1995</span>
            </div>
          </div>
        </div>

        {/* Quick Questions for Your Review */}
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-primary" />
              Quick Questions to Guide Your Review
            </CardTitle>
            <CardDescription>Consider mentioning these in your feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">How was our response time?</p>
                  <p className="text-sm text-muted-foreground">Did we arrive when promised?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">How was our technician?</p>
                  <p className="text-sm text-muted-foreground">Professional, friendly, knowledgeable?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Was the problem solved?</p>
                  <p className="text-sm text-muted-foreground">Did we fix it right the first time?</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="font-medium">Would you recommend us?</p>
                  <p className="text-sm text-muted-foreground">To friends, family, or neighbors?</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why Your Review Matters */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="text-2xl">The Impact of Your Review</CardTitle>
            <CardDescription>Here's how your 2-minute review helps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Helps 50+ families monthly:</strong> Your review guides Austin homeowners to reliable emergency plumbing service
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Award className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Recognizes excellent service:</strong> Our technicians take pride in every positive review - it's the highlight of their day
              </p>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Supports a local business:</strong> As a family-owned company since 1995, your review helps us compete with corporate chains
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Platform Selection */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-center">Choose Your Preferred Platform</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms?.map((platform) => (
                <Card key={platform.id} className="hover-elevate transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPlatformColor(platform.platform)} text-white`}>
                        {getPlatformIcon(platform.platform)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.displayName}</CardTitle>
                        {platform.description && (
                          <CardDescription className="text-xs mt-1">{platform.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      asChild
                      className={`w-full ${getPlatformColor(platform.platform)} text-white`}
                      size="lg"
                      data-testid={`button-review-${platform.platform}`}
                    >
                      <a
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Review on {platform.displayName}
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Thank You Message */}
        <Card className="bg-muted/50 border-muted">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <Heart className="w-12 h-12 text-primary fill-primary/20" />
            </div>
            <div>
              <p className="text-lg font-medium mb-2">Thank You for Being Part of Our Story</p>
              <p className="text-muted-foreground">
                Every review represents a real person we've helped. Your honest feedback helps us continue delivering excellent plumbing service to the Austin and Marble Falls area for another 30 years.
              </p>
            </div>
            <p className="text-sm text-muted-foreground italic">
              "We treat every home like it's our own, and every customer like family."
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
