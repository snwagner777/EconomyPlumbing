import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Send, Mail, MessageSquare } from "lucide-react";

const referralFormSchema = z.object({
  friendName: z.string().min(2, "Friend's name is required"),
  friendPhone: z.string().min(10, "Valid phone number is required"),
  friendEmail: z.string().email("Valid email is required").optional().or(z.literal("")),
});

type ReferralFormData = z.infer<typeof referralFormSchema>;

interface ReferralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerPhone: string;
  customerId: string;
  referralCode: string;
}

export function ReferralModal({
  open,
  onOpenChange,
  customerName,
  customerPhone,
  customerId,
  referralCode,
}: ReferralModalProps) {
  const { toast } = useToast();
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(true);

  const form = useForm<ReferralFormData>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: {
      friendName: "",
      friendPhone: "",
      friendEmail: "",
    },
  });

  const submitReferralMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      return apiRequest("POST", "/api/referrals/send", {
        referrerName: customerName,
        referrerPhone: customerPhone,
        referrerCustomerId: parseInt(customerId),
        referralCode: referralCode,
        refereeName: data.friendName,
        refereePhone: data.friendPhone,
        refereeEmail: data.friendEmail || undefined,
        sendEmail: sendEmail && !!data.friendEmail,
        sendSMS: sendSMS,
      });
    },
    onSuccess: () => {
      toast({
        title: "Referral sent!",
        description: "Your friend will receive an SMS and email about your referral.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send referral",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReferralFormData) => {
    submitReferralMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send a Referral</DialogTitle>
          <DialogDescription>
            Invite your friend to Economy Plumbing and you'll both benefit! They get $25 off and you earn credits.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Your Information</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>{customerName}</p>
                <p>{customerPhone}</p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="friendName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Smith"
                      {...field}
                      data-testid="input-friend-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="friendPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(512) 555-1234"
                      {...field}
                      data-testid="input-friend-phone"
                    />
                  </FormControl>
                  <FormDescription>
                    They'll receive an SMS with your referral link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="friendEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Friend's Email (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="friend@example.com"
                      {...field}
                      data-testid="input-friend-email"
                    />
                  </FormControl>
                  <FormDescription>
                    They'll also receive an email with your referral link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={submitReferralMutation.isPending}
                data-testid="button-send-referral"
              >
                {submitReferralMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Referral
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
