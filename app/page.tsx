import type { Metadata } from 'next';
import { ScheduleButton } from './components/ScheduleButton';
import { PhoneLink } from './components/PhoneLink';
import { CheckCircle, Droplets, Wind, Wrench, Bath, Building2, Flame } from 'lucide-react';
import { Card } from '../client/src/components/ui/card';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Economy Plumbing Austin TX | Licensed Experts Since 2012',
  description: 'Trusted Austin plumbing experts since 2012. Water heater specialists, drain cleaning & emergency service. Licensed, insured, same-day service. Call (512) 368-9159.',
  keywords: ['plumbing Austin TX', 'emergency plumber Austin', 'water heater repair Austin', 'drain cleaning Austin', 'licensed plumber Austin'],
  openGraph: {
    title: 'Economy Plumbing Services | Austin Plumbing Experts Since 2012',
    description: 'Central Texas\' Best Little Plumbing Company. Professional water heater, drain cleaning, and leak repair services.',
    type: 'website',
  },
};

export default function HomePage() {
  const services = [
    {
      icon: Droplets,
      title: "Water Heater Services",
      description: "Installation, repair, and maintenance of traditional and tankless water heaters.",
      link: "/water-heater-services",
    },
    {
      icon: Wind,
      title: "Drain Cleaning",
      description: "Professional drain cleaning and sewer line services to keep your pipes flowing.",
      link: "/drain-cleaning",
    },
    {
      icon: Wrench,
      title: "Leak Repair",
      description: "Fast leak detection and repair to protect your property from water damage.",
      link: "/leak-repair",
    },
    {
      icon: Bath,
      title: "Toilet & Faucet",
      description: "Complete installation, repair, and replacement services for fixtures.",
      link: "/toilet-faucet",
    },
    {
      icon: Building2,
      title: "Commercial Plumbing",
      description: "Comprehensive commercial plumbing services for businesses.",
      link: "/commercial-plumbing",
    },
    {
      icon: Flame,
      title: "Gas Line Services",
      description: "Professional gas line installation, repair, and safety inspections.",
      link: "/gas-line-services",
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="absolute inset-0 bg-[url('/hero-pattern.svg')] opacity-10" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl">
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
              Economy Plumbing Services
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 mb-4">
              Austin & Marble Falls
            </p>
            <p className="text-lg text-white/80 mb-8 max-w-2xl">
              Central Texas' Best Little Plumbing Company Since 2012. Licensed, insured, and committed to our community with water heater services, drain cleaning, and all your plumbing needs.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <ScheduleButton
                size="lg"
                className="bg-white text-blue-700 hover:bg-white/90 text-lg px-8"
              />
              <PhoneLink
                variant="outline"
                size="lg"
                className="text-white border-white bg-white/10 backdrop-blur-sm hover:bg-white/20 text-lg"
                location="austin"
              />
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium">Free Estimates</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-medium">Same-Day Service</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Our Plumbing Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              From routine maintenance to emergency repairs, we provide comprehensive plumbing solutions for homes and businesses throughout Central Texas.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <Link key={service.title} href={service.link}>
                  <Card className="p-6 h-full hover:shadow-xl transition-shadow cursor-pointer">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">{service.title}</h3>
                    <p className="text-muted-foreground">{service.description}</p>
                  </Card>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <ScheduleButton
              size="lg"
              className="bg-primary"
            >
              Schedule Service Today
            </ScheduleButton>
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Serving Central Texas
            </h2>
            <p className="text-lg text-muted-foreground">
              Two convenient locations to serve you better
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">Austin Metro Area</h3>
              <p className="text-muted-foreground mb-4">701 Tillery St #12, Austin, TX 78702</p>
              <PhoneLink location="austin" variant="default" className="mb-6" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Austin', 'Cedar Park', 'Leander', 'Round Rock', 'Georgetown', 'Pflugerville'].map(city => (
                  <div key={city} className="text-muted-foreground">• {city}</div>
                ))}
              </div>
            </Card>

            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-4">Marble Falls Area</h3>
              <p className="text-muted-foreground mb-4">2409 Commerce Street, Marble Falls, TX 78654</p>
              <PhoneLink location="marble-falls" variant="default" className="mb-6" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['Marble Falls', 'Burnet', 'Horseshoe Bay', 'Kingsland', 'Granite Shoals', 'Bertram'].map(city => (
                  <div key={city} className="text-muted-foreground">• {city}</div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Need Plumbing Service Today?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Call now or schedule online for fast, reliable service
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <PhoneLink
              variant="outline"
              size="lg"
              className="bg-white text-primary border-white hover:bg-white/90"
              location="austin"
            />
            <ScheduleButton
              variant="outline"
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              Schedule Online
            </ScheduleButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Economy Plumbing Services</h3>
              <p className="text-sm text-muted-foreground">
                Central Texas' Best Little Plumbing Company Since 2012
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/services" className="text-muted-foreground hover:text-foreground">Services</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <p className="text-sm text-muted-foreground mb-2">Austin: (512) 368-9159</p>
              <p className="text-sm text-muted-foreground">Marble Falls: (830) 265-9944</p>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Economy Plumbing Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
