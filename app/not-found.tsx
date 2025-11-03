import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Home, Search, Phone, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '404 - Page Not Found | Economy Plumbing Services',
  description: 'The page you\'re looking for doesn\'t exist. Find plumbing services, emergency repairs, and service areas in Austin, TX.',
  robots: 'noindex, nofollow',
};

export default function NotFound() {
  const popularPages = [
    {
      title: 'Emergency Plumbing',
      description: '24/7 emergency plumbing services',
      href: '/emergency',
      icon: Phone,
    },
    {
      title: 'Water Heater Services',
      description: 'Installation, repair & replacement',
      href: '/water-heater-services',
      icon: Home,
    },
    {
      title: 'Service Areas',
      description: 'Austin, Cedar Park, Marble Falls & more',
      href: '/service-areas',
      icon: Search,
    },
    {
      title: 'All Plumbing Services',
      description: 'Complete list of our services',
      href: '/services',
      icon: Home,
    },
  ];

  return (
    <>
      <Header />
      
      <div className="min-h-screen flex items-center justify-center bg-muted/30 py-16 px-4">
        <div className="max-w-2xl w-full text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-primary mb-4" data-testid="text-404-code">404</h1>
            <h2 className="text-3xl font-bold mb-4" data-testid="text-404-title">Page Not Found</h2>
            <p className="text-lg text-muted-foreground mb-8" data-testid="text-404-message">
              Oops! The page you're looking for seems to have sprung a leak. 
              Don't worry - we'll help you find what you need.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" data-testid="button-home">
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Go Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" data-testid="button-contact">
              <Link href="/contact" className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Us
              </Link>
            </Button>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-6">Popular Pages</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {popularPages.map((page) => (
                <Link 
                  key={page.href} 
                  href={page.href} 
                  className="group"
                  data-testid={`link-${page.href.replace('/', '')}`}
                >
                  <Card className="hover-elevate p-6 text-left">
                    <div className="flex items-start gap-3">
                      <page.icon className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                          {page.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {page.description}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h3 className="font-semibold mb-2">Need Help Finding Something?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Our team is here to help. Contact us or browse our services to find what you need.
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <Link href="/blog" className="text-primary hover:underline" data-testid="link-blog">
                Blog Articles
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/faq" className="text-primary hover:underline" data-testid="link-faq">
                FAQ
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/about" className="text-primary hover:underline" data-testid="link-about">
                About Us
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link href="/customer-portal" className="text-primary hover:underline" data-testid="link-portal">
                Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
