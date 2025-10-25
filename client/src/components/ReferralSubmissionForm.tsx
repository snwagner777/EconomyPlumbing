import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const referralSchema = z.object({
  // Referrer info
  referrerName: z.string().min(2, "Your name must be at least 2 characters"),
  referrerEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  referrerPhone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
  
  // Referee info
  refereeName: z.string().min(2, "Friend's name must be at least 2 characters"),
  refereeEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  refereePhone: z.string().min(10, "Please enter a valid phone number").optional().or(z.literal("")),
}).refine(
  (data) => data.referrerEmail || data.referrerPhone,
  {
    message: "Please provide either your email or phone number",
    path: ["referrerEmail"],
  }
).refine(
  (data) => data.refereeEmail || data.refereePhone,
  {
    message: "Please provide either your friend's email or phone number",
    path: ["refereeEmail"],
  }
);

type ReferralFormData = z.infer<typeof referralSchema>;

interface ReferralResponse {
  success: boolean;
  message: string;
  referralLink?: string;
  referrerId?: number;
  referrerName?: string;
}

export function ReferralSubmissionForm() {
  const [submittedData, setSubmittedData] = useState<ReferralResponse | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      referrerName: "",
      referrerEmail: "",
      referrerPhone: "",
      refereeName: "",
      refereeEmail: "",
      refereePhone: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      const res = await fetch("/api/referrals/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit referral");
      }
      
      return res.json() as Promise<ReferralResponse>;
    },
    onSuccess: (data) => {
      setSubmittedData(data);
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/leaderboard"] });
      form.reset();
      
      toast({
        title: "Referral Submitted!",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyLink = () => {
    if (submittedData?.referralLink) {
      navigator.clipboard.writeText(submittedData.referralLink);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  const shareLink = () => {
    if (submittedData?.referralLink && navigator.share) {
      navigator.share({
        title: "Get $25 off your first plumbing service!",
        text: `${submittedData.referrerName} referred you to Economy Plumbing. Get $25 off your first service!`,
        url: submittedData.referralLink,
      });
    }
  };

  if (submittedData?.referralLink) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-6 h-6" />
            <CardTitle>Referral Submitted Successfully!</CardTitle>
          </div>
          <CardDescription>
            Share this link with your friend to track the referral
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm text-muted-foreground mb-2 block">Your Personalized Referral Link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={submittedData.referralLink}
                className="font-mono text-sm"
                data-testid="input-referral-link"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyLink}
                data-testid="button-copy-link"
              >
                <Copy className="w-4 h-4" />
              </Button>
              {navigator.share && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={shareLink}
                  data-testid="button-share-link"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              When your friend clicks this link and provides their contact info, we'll track the referral automatically. 
              You'll earn $25 in service credit once they complete their first job!
            </AlertDescription>
          </Alert>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setSubmittedData(null)}
            data-testid="button-submit-another"
          >
            Submit Another Referral
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Submit a Referral</CardTitle>
        <CardDescription>
          Refer a friend and we'll give you a personalized tracking link to share with them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-6">
            {/* Referrer Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Your Information</h3>
                <p className="text-sm text-muted-foreground">
                  We'll verify you're a customer and create your tracking link
                </p>
              </div>

              <FormField
                control={form.control}
                name="referrerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Smith" {...field} data-testid="input-referrer-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="referrerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} data-testid="input-referrer-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referrerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(512) 555-1234" {...field} data-testid="input-referrer-phone" />
                      </FormControl>
                      <FormDescription className="text-xs">At least one contact method required</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Referee Section */}
            <div className="space-y-4 pt-6 border-t">
              <div>
                <h3 className="text-lg font-semibold mb-1">Friend's Information</h3>
                <p className="text-sm text-muted-foreground">
                  Who would you like to refer?
                </p>
              </div>

              <FormField
                control={form.control}
                name="refereeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Friend's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} data-testid="input-referee-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="refereeEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Friend's Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="friend@example.com" {...field} data-testid="input-referee-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="refereePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Friend's Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(512) 555-5678" {...field} data-testid="input-referee-phone" />
                      </FormControl>
                      <FormDescription className="text-xs">At least one contact method required</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={submitMutation.isPending}
              data-testid="button-submit-referral"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Referral & Get Link"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
