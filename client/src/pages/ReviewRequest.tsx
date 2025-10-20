import { useQuery } from "@tanstack/react-query";
import { Star, ExternalLink, Facebook, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SiYelp } from "react-icons/si";
import { SEOHead } from "@/components/SEO/SEOHead";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <SEOHead
        title="Leave a Review | Economy Plumbing Services"
        description="Share your experience with Economy Plumbing Services. Your review helps our business grow and helps other customers make informed decisions."
        canonical="/request-review"
      />

      <div className="container max-w-4xl mx-auto px-4 py-16 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
            <Star className="w-8 h-8 text-primary fill-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Love Our Service?
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We'd be grateful if you could share your experience! Your review helps us grow and helps other customers find reliable plumbing service.
          </p>
        </div>

        {/* Why Your Review Matters */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="text-2xl">Why Your Review Matters</CardTitle>
            <CardDescription>Your feedback makes a real difference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Helps Your Neighbors:</strong> Other homeowners rely on honest reviews to find trustworthy plumbers
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Supports Our Team:</strong> Positive reviews motivate our technicians and help us improve our service
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <p className="text-muted-foreground">
                <strong className="text-foreground">Takes Just 2 Minutes:</strong> A quick review can have a lasting impact on our business
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
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium mb-2">Thank You for Your Support! 🙏</p>
            <p className="text-muted-foreground">
              Your honest feedback helps us continue delivering excellent plumbing service to the Austin and Marble Falls area.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
