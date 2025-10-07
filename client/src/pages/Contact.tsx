import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import { SEOHead } from "@/components/SEO/SEOHead";

export default function Contact() {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Contact Us | Economy Plumbing Services Austin & Marble Falls TX"
        description="Contact Economy Plumbing Austin (512) 368-9159, Marble Falls (830) 460-3565. Schedule online. 24/7 emergency plumbing available. Visit our offices."
        canonical="https://economyplumbingservices.com/contact"
      />

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
                        <a href="tel:+15123689159" className="text-primary text-lg font-poppins font-bold hover-elevate inline-block px-2 py-1 rounded-md">(512) 368-9159</a>
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
                        <a href="tel:+18304603565" className="text-primary text-lg font-poppins font-bold hover-elevate inline-block px-2 py-1 rounded-md">(830) 460-3565</a>
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
                    onClick={() => (window as any).STWidgetManager("ws-open")}
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
                    <a href="tel:+15123689159">24/7 Emergency Service</a>
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
