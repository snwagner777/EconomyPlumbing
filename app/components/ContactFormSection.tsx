"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Phone } from "lucide-react";

export default function ContactFormSection() {
  const phoneConfig = typeof window !== "undefined" && window.__PHONE_CONFIG__ 
    ? window.__PHONE_CONFIG__ 
    : { display: "(512) 368-9159", tel: "tel:+15123689159" };
  
  const marbleFallsPhoneConfig = { display: "(830) 265-7383", tel: "tel:+18302657383" };
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitted(true);
        setFormData({ name: "", phone: "", email: "", message: "" });
        setTimeout(() => setSubmitted(false), 5000);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Get Your Free Estimate Today</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ready to solve your plumbing problems? Contact us for fast, reliable service and free estimates.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-bold mb-6">Request Free Estimate</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  data-testid="input-name"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  data-testid="input-phone"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  data-testid="input-email"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">Describe Your Plumbing Issue</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  data-testid="textarea-message"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              {submitted && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
                  Thank you for contacting us! We'll get back to you soon.
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-primary" 
                size="lg" 
                disabled={isSubmitting}
                data-testid="button-submit-estimate"
              >
                {isSubmitting ? "Submitting..." : "Get Free Estimate"}
              </Button>
            </form>
          </div>

          <div>
            <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  Phone Numbers
                </h4>
                <div className="space-y-2">
                  <a 
                    href={phoneConfig.tel} 
                    className="block text-lg font-poppins font-bold text-foreground hover-elevate px-2 py-1 rounded-md w-fit"
                    data-testid="contact-phone-austin"
                  >
                    Austin Area: {phoneConfig.display}
                  </a>
                  <a 
                    href={marbleFallsPhoneConfig.tel} 
                    className="block text-lg font-poppins font-bold text-foreground hover-elevate px-2 py-1 rounded-md w-fit"
                    data-testid="contact-phone-marble-falls"
                  >
                    Marble Falls Area: {marbleFallsPhoneConfig.display}
                  </a>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Business Hours</h4>
                <div className="space-y-1 text-muted-foreground">
                  <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p>Saturday: 9:00 AM - 3:00 PM</p>
                  <p>Sunday: Emergency Service Only</p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Service Locations</h4>
                <div className="space-y-2 text-muted-foreground">
                  <p>701 Tillery St #12, Austin, TX 78702</p>
                  <p>2409 Commerce Street, Marble Falls, TX 78654</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
