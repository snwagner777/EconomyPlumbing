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

interface ContactFormProps {
  pageContext?: string;
}

export default function ContactForm({ pageContext = "Contact Page" }: ContactFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    location: "",
    urgency: "",
    message: "",
    pageContext: pageContext
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
        pageContext: pageContext
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

              <div>
                <Label htmlFor="service">Service Needed</Label>
                <Select value={formData.service} onValueChange={(value) => setFormData({ ...formData, service: value })}>
                  <SelectTrigger data-testid="select-service">
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
                  <SelectTrigger data-testid="select-location">
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
                  <SelectTrigger data-testid="select-urgency">
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
                    href="tel:+15123689159" 
                    className="block text-lg font-poppins font-bold text-primary hover-elevate px-2 py-1 rounded-md w-fit"
                    data-testid="contact-phone-austin"
                  >
                    Austin Area: (512) 368-9159
                  </a>
                  <a 
                    href="tel:+18304603565" 
                    className="block text-lg font-poppins font-bold text-primary hover-elevate px-2 py-1 rounded-md w-fit"
                    data-testid="contact-phone-marble-falls"
                  >
                    Marble Falls Area: (830) 460-3565
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
                  className="text-primary hover-elevate px-2 py-1 rounded-md inline-block"
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
