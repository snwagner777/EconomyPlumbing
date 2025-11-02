'use client';

import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, ExternalLink, Facebook, Shield, Heart, Clock, TrendingUp, CheckCircle, Award, Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SiYelp } from "react-icons/si";
import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

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
  const { toast } = useToast();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const { data: platforms, isLoading } = useQuery<ReviewPlatform[]>({
    queryKey: ['/api/review-platforms'],
  });

  // Submit internal feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async (data: { rating: number; feedback: string }) => {
      const response = await apiRequest("POST", "/api/review-feedback", data);
      return await response.json();
    },
    onSuccess: () => {
      setFeedbackSubmitted(true);
      toast({
        title: "Thank You!",
        description: "Your feedback has been received. We'll use it to improve our service."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback",
        variant: "destructive"
      });
    }
  });

  const handleFeedbackSubmit = () => {
    if (!selectedRating) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      });
      return;
    }
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please tell us about your experience",
        variant: "destructive"
      });
      return;
    }
    feedbackMutation.mutate({
      rating: selectedRating,
      feedback: feedbackText
    });
  };

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

  const displayRating = hoverRating !== null ? hoverRating : selectedRating;

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
            We'd love to hear about your experience!
          </p>
        </div>

        {/* Rating Selector - STEP 1 */}
        {!selectedRating && !feedbackSubmitted && (
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="text-2xl text-center">How Would You Rate Your Experience?</CardTitle>
              <CardDescription className="text-center">Click to select your rating</CardDescription>
            </CardHeader>
            <CardContent className="pt-8 pb-10">
              <div className="flex justify-center gap-3" data-testid="rating-selector">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    onMouseEnter={() => setHoverRating(rating)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="transition-transform hover:scale-110 active:scale-95"
                    data-testid={`star-${rating}`}
                  >
                    <Star
                      className={`w-16 h-16 transition-colors ${
                        displayRating && displayRating >= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-none text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {displayRating && (
                <p className="text-center mt-6 text-lg font-medium" data-testid="rating-label">
                  {displayRating === 5 && "Excellent! ⭐"}
                  {displayRating === 4 && "Great! 👍"}
                  {displayRating === 3 && "Good"}
                  {displayRating === 2 && "Fair"}
                  {displayRating === 1 && "Poor"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Happy customers (4-5 stars) → Public Review Platforms */}
        {selectedRating && selectedRating >= 4 && !feedbackSubmitted && (
          <>
            <Card className="border-2 border-green-500/30 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-500/5">
                <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  Wonderful! We're So Glad You Had a Great Experience
                </CardTitle>
                <CardDescription className="text-center">
                  {randomImpact}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground mb-6">
                  Would you mind sharing your positive experience on one of these platforms? It only takes 2 minutes!
                </p>
              </CardContent>
            </Card>

            {/* Quick Questions for Your Review */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Quick Questions to Guide Your Review
                </CardTitle>
                <CardDescription>Consider mentioning these in your feedback</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
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
          </>
        )}

        {/* Unhappy customers (<4 stars) → Internal Feedback Form */}
        {selectedRating && selectedRating < 4 && !feedbackSubmitted && (
          <Card className="border-2 border-orange-500/30 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500/10 to-orange-500/5">
              <CardTitle className="text-2xl text-center">We're Sorry to Hear That</CardTitle>
              <CardDescription className="text-center">
                Your feedback is valuable and helps us improve. Please tell us what went wrong.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="feedback-text" className="text-base font-medium">
                  What could we have done better?
                </Label>
                <Textarea
                  id="feedback-text"
                  data-testid="input-feedback"
                  placeholder="Please share details about your experience so we can make it right..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRating(null);
                    setFeedbackText("");
                  }}
                  data-testid="button-cancel-feedback"
                >
                  Go Back
                </Button>
                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={feedbackMutation.isPending || !feedbackText.trim()}
                  data-testid="button-submit-feedback"
                >
                  {feedbackMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feedback Submitted Success */}
        {feedbackSubmitted && (
          <Card className="border-2 border-green-500/30 shadow-lg">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Thank You for Your Feedback</h2>
              <p className="text-muted-foreground">
                We take all feedback seriously and will use it to improve our service. A member of our team may reach out to discuss your experience further.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Platform Selection - Only for Happy Customers */}
        {selectedRating && selectedRating >= 4 && !feedbackSubmitted && (
          <>
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
          </>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
