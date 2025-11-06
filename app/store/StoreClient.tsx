'use client';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { openScheduler } from "@/lib/scheduler";
import { useEffect, useState } from "react";
import type { PhoneConfig } from "@/server/lib/phoneNumbers";
import Script from "next/script";

const ECWID_STORE_ID = "90741099";

interface StoreClientProps {
  phoneConfig: PhoneConfig;
}

export default function StoreClient({ phoneConfig }: StoreClientProps) {
  const [ecwidLoaded, setEcwidLoaded] = useState(false);

  const initializeEcwid = () => {
    console.log('[Ecwid] Script loaded, initializing store...');
    if (window.xProductBrowser) {
      try {
        window.xProductBrowser(
          "categoriesPerRow=3",
          "views=grid(20,3) list(60) table(60)",
          "categoryView=grid",
          "searchView=list",
          `id=my-store-${ECWID_STORE_ID}`
        );
        console.log('[Ecwid] Store initialized successfully');
        setEcwidLoaded(true);
      } catch (error) {
        console.error('[Ecwid] Error initializing store:', error);
      }
    } else {
      console.error('[Ecwid] xProductBrowser not available');
    }
  };

  return (
    <>
      <Script
        src={`https://app.ecwid.com/script.js?${ECWID_STORE_ID}&data_platform=code&data_date=2025-11-05`}
        strategy="afterInteractive"
        onLoad={initializeEcwid}
        onError={(e) => {
          console.error('[Ecwid] Failed to load script');
          console.error('[Ecwid] Error type:', e?.type || 'unknown');
        }}
        onReady={() => {
          console.log('[Ecwid] Script ready');
        }}
      />
      
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-1">
          <section className="bg-primary/5 py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Plumbing Products</h1>
                <p className="text-xl text-muted-foreground">
                  Quality plumbing products and supplies delivered to your door
                </p>
              </div>
            </div>
          </section>

          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="w-full">
                {!ecwidLoaded && (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                    <p className="text-muted-foreground">Loading products...</p>
                  </div>
                )}
                <div 
                  id={`my-store-${ECWID_STORE_ID}`}
                  data-testid="ecwid-store-container"
                />
              </div>
            </div>
          </section>

        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Shop With Us?</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                <p className="text-muted-foreground">
                  Professional-grade plumbing supplies and products we trust and use ourselves
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Shipping</h3>
                <p className="text-muted-foreground">
                  Drop-shipped directly to your door in Austin and Marble Falls areas
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                <p className="text-muted-foreground">
                  Questions about installation? Our team is here to help you succeed
                </p>
              </div>
            </div>
          </div>
          </section>

          <section className="py-16 lg:py-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="p-8 md:p-12 bg-primary/5 border-primary/20">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Help Finding Something?</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Our team can help you find the right product or answer installation questions
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg"
                      className="bg-primary"
                      onClick={() => openScheduler()}
                      data-testid="button-schedule-consultation"
                    >
                      Schedule Consultation
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      asChild
                      data-testid="button-call-us"
                    >
                      <a href={phoneConfig.tel}>Call {phoneConfig.display}</a>
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

declare global {
  interface Window {
    Ecwid?: {
      init: () => void;
    };
    xProductBrowser?: (...args: string[]) => void;
  }
}
