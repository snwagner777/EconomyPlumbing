import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSubmissionSchema, type InsertContactSubmission } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactFormSectionProps {
  title?: string;
  description?: string;
  defaultService?: string;
  defaultLocation?: string;
  className?: string;
}

export default function ContactFormSection({ 
  title = "Get a Free Estimate",
  description = "Contact us today for expert plumbing services. We'll respond within 1 hour during business hours.",
  defaultService,
  defaultLocation,
  className = ""
}: ContactFormSectionProps) {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<InsertContactSubmission>({
    resolver: zodResolver(insertContactSubmissionSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: defaultService || "",
      location: defaultLocation || "",
      urgency: "",
      message: "",
    },
  });

  const submitContact = useMutation({
    mutationFn: async (data: InsertContactSubmission) => {
      const res = await apiRequest("POST", "/api/contact", data);
      return res.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      form.reset();
      toast({
        title: "Message Sent!",
        description: "We'll contact you within 1 hour during business hours.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please call us instead.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertContactSubmission) => {
    submitContact.mutate(data);
  };

  if (isSubmitted) {
    return (
      <section className={className}>
        <Card className="p-8 max-w-2xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-4">Thank You!</h3>
          <p className="text-muted-foreground mb-6">
            We've received your message and will contact you within 1 hour during business hours.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Need immediate assistance?
          </p>
          <Button 
            asChild 
            className="bg-primary"
            data-testid="button-call-now"
          >
            <a href="tel:5126492811">Call (512) 649-2811</a>
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className={className}>
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" data-testid="input-phone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} type="email" data-testid="input-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Needed</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-service">
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="water-heater">Water Heater</SelectItem>
                        <SelectItem value="drain-cleaning">Drain Cleaning</SelectItem>
                        <SelectItem value="leak-repair">Leak Repair</SelectItem>
                        <SelectItem value="toilet-faucet">Toilet/Faucet</SelectItem>
                        <SelectItem value="gas">Gas Services</SelectItem>
                        <SelectItem value="backflow">Backflow Testing</SelectItem>
                        <SelectItem value="commercial">Commercial Plumbing</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="urgency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Urgency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-urgency">
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="emergency">Emergency - Need Help Now</SelectItem>
                        <SelectItem value="urgent">Urgent - Within 24 Hours</SelectItem>
                        <SelectItem value="soon">Soon - This Week</SelectItem>
                        <SelectItem value="scheduled">Scheduled - Next Week or Later</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City/Location</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g. Austin, Cedar Park" data-testid="input-location" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Describe your plumbing issue..."
                      rows={4}
                      data-testid="textarea-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary"
              disabled={submitContact.isPending}
              data-testid="button-submit-contact"
            >
              {submitContact.isPending ? "Sending..." : "Send Message"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Or call us directly at{" "}
              <a href="tel:5126492811" className="text-primary hover:underline">
                (512) 649-2811
              </a>
            </p>
          </form>
        </Form>
      </Card>
    </section>
  );
}
