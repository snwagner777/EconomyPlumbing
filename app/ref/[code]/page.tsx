'use client';
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

export default function ReferralLanding() {
  const params = useParams();
  const router = useRouter();
  const [isTracking, setIsTracking] = useState(true);
  
  const trackClickMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/referrals/track-click", { code });
    },
  });

  useEffect(() => {
    const code = params?.code as string;
    
    if (!code) {
      // No code, redirect to home
      router.push("/");
      return;
    }

    // Store referral code in cookie (30 days)
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);
    document.cookie = `referralCode=${code}; path=/; expires=${expires.toUTCString()}`;
    
    // Track the click
    trackClickMutation.mutate(code, {
      onSuccess: () => {
        console.log('[Referral Link] Click tracked for code:', code);
      },
      onError: (error) => {
        console.error('[Referral Link] Error tracking click:', error);
      },
      onSettled: () => {
        // Redirect to referral offer page after tracking
        setTimeout(() => {
          setIsTracking(false);
          router.push(`/referral-offer?code=${code}`);
        }, 500);
      }
    });
  }, [params?.code, router]);

  if (isTracking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading referral...</p>
        </div>
      </div>
    );
  }

  return null;
}
