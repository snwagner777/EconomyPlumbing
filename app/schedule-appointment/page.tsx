'use client';
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Calendar, Shield, Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ScheduleAppointment() {
  return (
    <>

      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/10 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-page-title">
                Schedule Your Appointment
              </h1>
              <p className="text-xl text-muted-foreground" data-testid="text-page-subtitle">
                Book your plumbing service online with Economy Plumbing Services. Choose your preferred date and time, and we'll take care of the rest.
              </p>
            </div>
          </div>
        </section>

        {/* Book Service Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4" data-testid="text-book-service-title">
                  Book Your Service Online
                </h2>
                <p className="text-lg text-muted-foreground" data-testid="text-book-service-description">
                  Select your preferred appointment time and we'll confirm your booking within minutes.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-6 mb-12">
                <Card data-testid="card-feature-flexible">
                  <CardContent className="p-6 text-center">
                    <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Flexible Scheduling</h3>
                    <p className="text-muted-foreground">
                      Choose from available time slots that work best for your schedule
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-feature-licensed">
                  <CardContent className="p-6 text-center">
                    <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Licensed & Insured</h3>
                    <p className="text-muted-foreground">
                      All our technicians are fully licensed and insured professionals
                    </p>
                  </CardContent>
                </Card>

                <Card data-testid="card-feature-confirmation">
                  <CardContent className="p-6 text-center">
                    <Bell className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Instant Confirmation</h3>
                    <p className="text-muted-foreground">
                      Receive immediate confirmation and reminders for your appointment
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* ServiceTitan Scheduler */}
              <Card className="overflow-hidden" data-testid="card-scheduler">
                <CardContent className="p-0">
                  <iframe 
                    src="https://go.servicetitan.com/webscheduler?tenantid=576158144&campaignid=3261493" 
                    style={{ width: '100%', height: '700px', border: 'none' }}
                    title="ServiceTitan Web Scheduler"
                    frameBorder="0"
                    allow="payment; geolocation"
                    loading="lazy"
                    data-testid="iframe-scheduler"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Service Areas Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4" data-testid="text-service-areas-title">
                  We Serve Your Area
                </h2>
                <p className="text-lg text-muted-foreground" data-testid="text-service-areas-subtitle">
                  Professional plumbing services across Central Texas
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center" data-testid="area-austin-metro">
                  <h3 className="text-xl font-semibold mb-3">Austin Metro</h3>
                  <p className="text-muted-foreground">
                    <Link href="/plumber-austin" className="hover:text-primary hover:underline">Austin</Link>, <Link href="/plumber-in-cedar-park--tx" className="hover:text-primary hover:underline">Cedar Park</Link>, <Link href="/plumber-leander" className="hover:text-primary hover:underline">Leander</Link>, <Link href="/round-rock-plumber" className="hover:text-primary hover:underline">Round Rock</Link>, <Link href="/plumber-georgetown" className="hover:text-primary hover:underline">Georgetown</Link>
                  </p>
                </div>

                <div className="text-center" data-testid="area-hill-country">
                  <h3 className="text-xl font-semibold mb-3">Hill Country</h3>
                  <p className="text-muted-foreground">
                    <Link href="/plumber-marble-falls" className="hover:text-primary hover:underline">Marble Falls</Link>, <Link href="/plumber-burnet" className="hover:text-primary hover:underline">Burnet</Link>, <Link href="/plumber-horseshoe-bay" className="hover:text-primary hover:underline">Horseshoe Bay</Link>, <Link href="/plumber-kingsland" className="hover:text-primary hover:underline">Kingsland</Link>
                  </p>
                </div>

                <div className="text-center" data-testid="area-south-austin">
                  <h3 className="text-xl font-semibold mb-3">South Austin</h3>
                  <p className="text-muted-foreground">
                    <Link href="/plumber-buda" className="hover:text-primary hover:underline">Buda</Link>, <Link href="/plumber-kyle" className="hover:text-primary hover:underline">Kyle</Link>, Dripping Springs, Wimberley
                  </p>
                </div>
              </div>

              <div className="text-center mt-8" data-testid="area-north-austin">
                <h3 className="text-xl font-semibold mb-3">North Austin</h3>
                <p className="text-muted-foreground">
                  <Link href="/plumber-pflugerville" className="hover:text-primary hover:underline">Pflugerville</Link>, <Link href="/plumber-liberty-hill" className="hover:text-primary hover:underline">Liberty Hill</Link>, <Link href="/plumber-bertram" className="hover:text-primary hover:underline">Bertram</Link>, Lago Vista
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
