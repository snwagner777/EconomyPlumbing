'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Phone, Mail, Clock } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { A2PConsentCheckboxes } from "@/components/A2PConsentCheckboxes";
interface ContactFormProps {
  pageContext?: string;
  austinPhone?: { display: string; tel: string };
  marbleFallsPhone?: { display: string; tel: string };
}

export default function ContactForm({ 
  pageContext = "Contact Page",
  austinPhone,
  marbleFallsPhone
}: ContactFormProps) {
  // Use server-provided phone numbers or fallback
  const phoneConfig = austinPhone || { display: '(512) 368-9159', tel: '+15123689159' };
  const marbleFallsPhoneConfig = marbleFallsPhone || { display: '(830) 460-3565', tel: '+18304603565' };
  const { toast } = useToast();
  const [formStartTime] = useState(Date.now()); // Track when form was loaded
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    location: "",
    urgency: "",
    message: "",
    address: "",
    city: "",
    state: "TX",
    zip: "",
    smsConsent: false,
    emailConsent: false,
    pageContext: pageContext,
    website: "", // Honeypot field - invisible to users
    formStartTime: formStartTime // Timestamp for spam detection
  });

  const contactMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Thank you for contacting us! We'll get back to you soon.",
      });
      setFormData({
        name: "",
        phone: "",
        email: "",
        service: "",
        location: "",
        urgency: "",
        message: "",
        address: "",
        city: "",
        state: "TX",
        zip: "",
        smsConsent: false,
        emailConsent: false,
        pageContext: pageContext,
        website: "",
        formStartTime: Date.now()
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    contactMutation.mutate(formData);
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
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  data-testid="input-name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  data-testid="input-phone"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  data-testid="input-email"
                />
              </div>

              {/* Honeypot field - hidden from humans, visible to bots */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0 }} aria-hidden="true" tabIndex={-1}>
                <label htmlFor="website">Website (leave blank)</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  autoComplete="off"
                  tabIndex={-1}
                />
              </div>

              <div>
                <Label htmlFor="service">Service Needed</Label>
                <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                  <SelectTrigger id="service" data-testid="select-service">
                    <SelectValue placeholder="Select a service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="water-heater">Water Heater Repair/Replacement</SelectItem>
                    <SelectItem value="drain">Drain Cleaning</SelectItem>
                    <SelectItem value="leak">Leak Detection & Repair</SelectItem>
                    <SelectItem value="toilet-faucet">Toilet & Faucet Services</SelectItem>
                    <SelectItem value="commercial">Commercial Plumbing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value })}>
                  <SelectTrigger id="location" data-testid="select-location">
                    <SelectValue placeholder="Select your city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="austin">Austin</SelectItem>
                    <SelectItem value="cedar-park">Cedar Park</SelectItem>
                    <SelectItem value="leander">Leander</SelectItem>
                    <SelectItem value="round-rock">Round Rock</SelectItem>
                    <SelectItem value="georgetown">Georgetown</SelectItem>
                    <SelectItem value="marble-falls">Marble Falls</SelectItem>
                    <SelectItem value="burnet">Burnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select value={formData.urgency} onValueChange={(value) => setFormData({ ...formData, urgency: value })}>
                  <SelectTrigger id="urgency" data-testid="select-urgency">
                    <SelectValue placeholder="Select urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency (ASAP)</SelectItem>
                    <SelectItem value="urgent">Urgent (Today)</SelectItem>
                    <SelectItem value="normal">Normal (This Week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message">Describe Your Plumbing Issue</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  maxLength={500}
                  data-testid="textarea-message"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.message.length}/500 characters
                </p>
              </div>

              {/* Address Fields */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Service Address (Optional - helps us serve you better)</p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main St"
                      data-testid="input-address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Austin"
                        data-testid="input-city"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        placeholder="78701"
                        maxLength={5}
                        data-testid="input-zip"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* A2P Consent Checkboxes */}
              <A2PConsentCheckboxes
                smsConsent={formData.smsConsent}
                emailConsent={formData.emailConsent}
                onSmsConsentChange={(checked) => setFormData({ ...formData, smsConsent: checked })}
                onEmailConsentChange={(checked) => setFormData({ ...formData, emailConsent: checked })}
              />

              <Button 
                type="submit" 
                className="w-full bg-primary" 
                size="lg" 
                disabled={contactMutation.isPending}
                data-testid="button-submit-estimate"
              >
                {contactMutation.isPending ? "Submitting..." : "Get Free Estimate"}
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
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Business Hours
                </h4>
                <p className="text-muted-foreground">Monday - Friday: 7:30 AM - 5:30 PM</p>
                <p className="text-muted-foreground">Saturday - Sunday: Appointment Only</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email
                </h4>
                <a 
                  href="mailto:hello@plumbersthatcare.com" 
                  className="text-foreground hover-elevate px-2 py-1 rounded-md inline-block"
                  data-testid="contact-email"
                >
                  hello@plumbersthatcare.com
                </a>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Licensed & Insured</h4>
                <p className="text-muted-foreground">Texas Master Plumber License #M-41147</p>
                <p className="text-muted-foreground">Fully Insured</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Service Promise</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Free estimates on all services</li>
                  <li>• Upfront pricing with no hidden fees</li>
                  <li>• 100% satisfaction guarantee</li>
                  <li>• Clean, professional service</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
