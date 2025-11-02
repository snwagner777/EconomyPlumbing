'use client';

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import { openScheduler } from "@/lib/scheduler";
import { usePhoneConfig, useMarbleFallsPhone } from "@/hooks/usePhoneConfig";

export default function Contact() {
  const austinPhone = usePhoneConfig();
  const marbleFallsPhone = useMarbleFallsPhone();
  
  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact Economy Plumbing Services",
    "description": "Contact Economy Plumbing for plumbing services in Austin and Marble Falls, Texas. Schedule online or call for 24/7 emergency service.",
    "url": "https://www.plumbersthatcare.com/contact",
    "mainEntity": {
      "@type": "Plumber",
      "name": "Economy Plumbing Services",
      "telephone": ["+15123689159", "+18304603565"],
      "address": [
        {
          "@type": "PostalAddress",
          "streetAddress": "701 Tillery St #12",
          "addressLocality": "Austin",
          "addressRegion": "TX",
          "postalCode": "78702",
          "addressCountry": "US"
        },
        {
          "@type": "PostalAddress",
          "addressLocality": "Marble Falls",
          "addressRegion": "TX",
          "addressCountry": "US"
        }
      ],
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          "opens": "07:30",
          "closes": "17:30"
        }
      ]
    }
  };
  
  return (
    <div className="min-h-screen">

      <Header />

      <section className="bg-primary text-primary-foreground py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl opacity-90 max-w-3xl mx-auto">
            Get in touch with Economy Plumbing Services. We're here to help with all your plumbing needs.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
              
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Austin Area Office</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <a href={austinPhone.tel} className="text-foreground text-lg font-poppins font-bold hover-elevate inline-block px-2 py-1 rounded-md">{austinPhone.display}</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">Address</p>
                        <p className="text-muted-foreground">701 Tillery St #12<br />Austin, TX 78702</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">Hours</p>
                        <p className="text-muted-foreground">24/7 Emergency Service<br />Mon-Fri: 7:30 AM - 5:30 PM<br />Sat-Sun: By Appointment</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-2xl font-bold mb-4">Marble Falls Area Office</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">Phone</p>
                        <a href={marbleFallsPhone.tel} className="text-foreground text-lg font-poppins font-bold hover-elevate inline-block px-2 py-1 rounded-md">{marbleFallsPhone.display}</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">Address</p>
                        <p className="text-muted-foreground">2409 Commerce Street<br />Marble Falls, TX 78654</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold">Hours</p>
                        <p className="text-muted-foreground">24/7 Emergency Service<br />Mon-Fri: 7:30 AM - 5:30 PM<br />Sat-Sun: By Appointment</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={() => openScheduler()}
                    size="lg"
                    data-testid="button-schedule"
                  >
                    Schedule Service Online
                  </Button>
                  <Button 
                    asChild
                    size="lg"
                    variant="outline"
                    data-testid="button-emergency"
                  >
                    <a href={austinPhone.tel}>24/7 Emergency Service</a>
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-8">Send Us a Message</h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
