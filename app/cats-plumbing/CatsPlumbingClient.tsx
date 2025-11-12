'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PhoneConfig } from '@/server/lib/phoneNumbers';
import { Wand2, Loader2, Rss } from 'lucide-react';
import type { GeneratedPlumbingImage } from '@shared/schema';

interface CatsPlumbingClientProps {
  phoneConfig: PhoneConfig;
}

export default function CatsPlumbingClient({ phoneConfig }: CatsPlumbingClientProps) {
  const [images, setImages] = useState<GeneratedPlumbingImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchImages() {
    try {
      const response = await fetch('/api/generate-plumbing-image?animal=cat');
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      const data = await response.json();
      setImages(data.images || []);
    } catch (err: any) {
      console.error('[Fetch Cat Images]', err);
      setError('Failed to load gallery. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchImages();
  }, []);

  async function generateCatImage() {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-plumbing-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animal: 'cat' }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to generate image' }));
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (err: any) {
      const errorMessage = err?.message || 'Oops! Failed to generate image. Please try again.';
      setError(errorMessage);
      console.error('[Generate Cat Image]', err);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header austinPhone={{ display: phoneConfig.display, tel: phoneConfig.tel }} />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/10 to-background py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              Cats Doing Plumbing!
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Just for fun - click the button below to generate an AI image of a talented feline plumber at work!
            </p>
            
            <Button
              size="lg"
              onClick={generateCatImage}
              disabled={isGenerating}
              className="px-8"
              data-testid="button-generate-cat"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 mr-2" />
                  Generate Cat Plumber Image
                </>
              )}
            </Button>

            {error && (
              <p className="mt-4 text-destructive" data-testid="text-error">{error}</p>
            )}
          </div>
        </section>

        {isLoading ? (
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Loading gallery...</p>
            </div>
          </section>
        ) : images.length > 0 ? (
          <section className="py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-bold">
                  Recent Generated Cat Plumbers
                </h2>
                <a
                  href="/rss/cats-plumbing.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-muted-foreground hover-elevate px-3 py-2 rounded-md"
                  data-testid="link-rss-feed"
                  title="Subscribe to RSS feed for social media automation"
                >
                  <Rss className="w-4 h-4" />
                  RSS Feed
                </a>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image, index) => (
                  <Card key={image.id} className="overflow-hidden hover-elevate" data-testid={`card-cat-${index}`}>
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={`Professional cat plumber AI-generated image - adorable cat wearing work clothes fixing plumbing - image ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading={index < 3 ? 'eager' : 'lazy'}
                        title="AI Generated Cat Plumber - Economy Plumbing Services"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="bg-muted/50 py-16 lg:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">Need Real Plumbing Service?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              While these AI-generated felines are incredibly talented, our professional human plumbers are who you really want on the job! 
              We provide expert plumbing services throughout the Austin area with purr-fect precision.
            </p>
            <a
              href={`tel:${phoneConfig.tel}`}
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover-elevate active-elevate-2"
              data-testid="button-call-now"
            >
              Call Now: {phoneConfig.display}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
