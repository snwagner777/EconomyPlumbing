'use client';

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, CheckCircle, AlertCircle, Gift } from "lucide-react";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phoneUtils";

interface SMSOptInWidgetProps {
  variant?: "card" | "inline" | "minimal" | "hero";
  title?: string;
  description?: string;
  showIncentive?: boolean;
  customerId?: number;
  source?: string;
}

export default function SMSOptInWidget({
  variant = "card",
  title = "Get Exclusive Offers via Text",
  description = "Join our text list for special discounts, maintenance reminders, and priority service",
  showIncentive = true,
  customerId,
  source = "website",
}: SMSOptInWidgetProps) {
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const optInMutation = useMutation({
    mutationFn: async (data: {
      phone: string;
      firstName: string;
      customerId?: number;
      source: string;
    }) => {
      const response = await apiRequest('POST', '/api/sms/opt-in', data);
      return response.json();
    },
    onSuccess: () => {
      setShowSuccess(true);
      setPhone("");
      setFirstName("");
      setAgreedToTerms(false);
      
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePhoneNumber(phone)) {
      return;
    }
    
    if (!agreedToTerms) {
      return;
    }

    optInMutation.mutate({
      phone: phone.replace(/\D/g, ''), // Remove non-digits
      firstName,
      customerId,
      source,
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  if (showSuccess) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          Success! You're now signed up for text updates. Reply STOP at any time to unsubscribe.
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === "minimal") {
    return (
      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            type="tel"
            placeholder="Phone number"
            value={phone}
            onChange={handlePhoneChange}
            required
            data-testid="input-sms-phone-minimal"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!agreedToTerms || optInMutation.isPending}
          data-testid="button-sms-signup-minimal"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Get Texts
        </Button>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms-minimal"
            checked={agreedToTerms}
            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            data-testid="checkbox-terms-minimal"
          />
          <Label htmlFor="terms-minimal" className="text-xs text-muted-foreground cursor-pointer">
            I agree to receive texts
          </Label>
        </div>
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <div className="rounded-lg border bg-card p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-4">
            <MessageSquare className="w-8 h-8 text-primary mt-1" />
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
              
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="max-w-[150px]"
                  data-testid="input-sms-name-inline"
                />
                <Input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={handlePhoneChange}
                  required
                  className="max-w-[200px]"
                  data-testid="input-sms-phone-inline"
                />
                <Button 
                  type="submit" 
                  disabled={!agreedToTerms || optInMutation.isPending}
                  data-testid="button-sms-signup-inline"
                >
                  Sign Up
                </Button>
              </div>
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms-inline"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  className="mt-1"
                  data-testid="checkbox-terms-inline"
                />
                <Label htmlFor="terms-inline" className="text-xs text-muted-foreground cursor-pointer">
                  I agree to receive recurring automated marketing text messages at the phone number provided. 
                  Consent is not a condition of purchase. Msg & data rates may apply. 
                  Reply STOP to unsubscribe. View our <a href="/privacy-policy" className="underline">Privacy Policy</a>.
                </Label>
              </div>
            </div>
          </div>
        </form>

        {optInMutation.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to sign up. Please try again or contact support.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (variant === "hero") {
    return (
      <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-8 text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <MessageSquare className="w-12 h-12 text-primary" />
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-bold mb-2">{title}</h2>
            <p className="text-lg text-muted-foreground">{description}</p>
          </div>

          {showIncentive && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-green-100 dark:bg-green-950 px-4 py-2 text-green-800 dark:text-green-200">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">Get $25 off your next service when you sign up!</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex-1"
                data-testid="input-sms-name-hero"
              />
              <Input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={handlePhoneChange}
                required
                className="flex-1"
                data-testid="input-sms-phone-hero"
              />
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms-hero"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
                data-testid="checkbox-terms-hero"
              />
              <Label htmlFor="terms-hero" className="text-sm text-muted-foreground text-left cursor-pointer">
                I agree to receive recurring automated marketing text messages at the phone number provided. 
                Consent is not a condition of purchase. Message frequency varies. 
                Msg & data rates may apply. Reply STOP to unsubscribe. 
                View our <a href="/privacy-policy" className="underline">Privacy Policy</a> and <a href="/terms-of-service" className="underline">Terms</a>.
              </Label>
            </div>
            
            <Button 
              type="submit" 
              size="lg"
              className="w-full"
              disabled={!agreedToTerms || optInMutation.isPending}
              data-testid="button-sms-signup-hero"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              {optInMutation.isPending ? "Signing up..." : "Sign Me Up for Text Deals"}
            </Button>
          </form>
        </div>

        {optInMutation.isError && (
          <Alert variant="destructive" className="mt-6 max-w-md mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to sign up. Please check your phone number and try again.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Default card variant
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {showIncentive && (
            <Alert className="border-primary/20 bg-primary/5">
              <Gift className="h-4 w-4 text-primary" />
              <AlertDescription className="text-primary">
                <strong>Special Offer:</strong> Get $25 off your next service when you sign up for texts!
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
            <div>
              <Label htmlFor="firstName">First Name (Optional)</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                data-testid="input-sms-name-card"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 555-5555"
                value={phone}
                onChange={handlePhoneChange}
                required
                data-testid="input-sms-phone-card"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Standard message and data rates may apply
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                className="mt-1"
                data-testid="checkbox-terms-card"
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I agree to receive text messages
                </Label>
                <p className="text-xs text-muted-foreground">
                  By checking this box, you agree to receive recurring automated marketing text messages 
                  (e.g., cart reminders) at the phone number provided. Consent is not a condition of purchase. 
                  Message frequency varies. Msg & data rates may apply. 
                  Reply STOP to unsubscribe or HELP for help. 
                  View our <a href="/privacy-policy" className="underline">Privacy Policy</a> and{" "}
                  <a href="/terms-of-service" className="underline">Terms of Service</a>.
                </p>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!agreedToTerms || optInMutation.isPending}
            data-testid="button-sms-signup-card"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {optInMutation.isPending ? "Signing up..." : "Sign Up for Text Offers"}
          </Button>
        </form>

        {optInMutation.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to sign up. Please check your information and try again.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}