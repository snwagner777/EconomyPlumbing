import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const successStorySchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  story: z.string().min(20, "Please share more details about your experience (at least 20 characters)"),
  serviceCategory: z.string().min(1, "Please select a service category"),
  location: z.string().min(1, "Location is required"),
});

type SuccessStoryFormValues = z.infer<typeof successStorySchema>;

export default function SuccessStoryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [formStartTime, setFormStartTime] = useState(Date.now());
  const [honeypot, setHoneypot] = useState("");
  const { toast } = useToast();

  const form = useForm<SuccessStoryFormValues>({
    resolver: zodResolver(successStorySchema),
    defaultValues: {
      customerName: "",
      email: "",
      phone: "",
      story: "",
      serviceCategory: "",
      location: "",
    },
  });

  const handlePhotoUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setPhoto: (photo: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: SuccessStoryFormValues) => {
    if (!beforePhoto || !afterPhoto) {
      toast({
        title: "Photos Required",
        description: "Please upload both before and after photos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/success-stories", {
        ...data,
        beforePhoto,
        afterPhoto,
        formStartTime,
        website: honeypot, // Honeypot field - should be empty for real users
      });

      setIsSuccess(true);
      toast({
        title: "Success Story Submitted!",
        description: "Thank you for sharing! We'll review and publish your story soon.",
      });

      // Reset form
      form.reset();
      setBeforePhoto(null);
      setAfterPhoto(null);
      setFormStartTime(Date.now()); // Reset timing for next submission
      setHoneypot(""); // Reset honeypot
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8 space-y-4">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        <h3 className="text-2xl font-bold">Thank You!</h3>
        <p className="text-muted-foreground">
          Your success story has been submitted and is awaiting approval.
          We'll review it shortly and publish it to our website.
        </p>
        <Button onClick={() => setIsSuccess(false)} data-testid="button-submit-another">
          Submit Another Story
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} data-testid="input-customer-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (Optional)</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
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
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="(512) 555-1234" {...field} data-testid="input-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="serviceCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Category *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-service-category">
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Water Heater">Water Heater</SelectItem>
                    <SelectItem value="Drain Cleaning">Drain Cleaning</SelectItem>
                    <SelectItem value="Leak Repair">Leak Repair</SelectItem>
                    <SelectItem value="Emergency Plumbing">Emergency Plumbing</SelectItem>
                    <SelectItem value="Commercial Plumbing">Commercial Plumbing</SelectItem>
                    <SelectItem value="Gas Services">Gas Services</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location *</FormLabel>
                <FormControl>
                  <Input placeholder="Austin, TX" {...field} data-testid="input-location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="story"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Story *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Tell us about your experience with Economy Plumbing Services..."
                  className="min-h-[120px]"
                  {...field}
                  data-testid="textarea-story"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <FormLabel>Before Photo *</FormLabel>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {beforePhoto ? (
                <div className="space-y-2">
                  <img src={beforePhoto} alt="Before" className="max-h-32 mx-auto rounded" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBeforePhoto(null)}
                    data-testid="button-remove-before"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload before photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, setBeforePhoto)}
                    data-testid="input-before-photo"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <FormLabel>After Photo *</FormLabel>
            <div className="border-2 border-dashed rounded-lg p-4 text-center">
              {afterPhoto ? (
                <div className="space-y-2">
                  <img src={afterPhoto} alt="After" className="max-h-32 mx-auto rounded" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAfterPhoto(null)}
                    data-testid="button-remove-after"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Upload after photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoUpload(e, setAfterPhoto)}
                    data-testid="input-after-photo"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Honeypot field - hidden from users but accessible to bots */}
        <input
          type="text"
          name="website"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute -left-[9999px]"
          tabIndex={-1}
          autoComplete="off"
          data-testid="input-honeypot"
        />

        <Button
          type="submit"
          disabled={isSubmitting || !beforePhoto || !afterPhoto}
          className="w-full"
          data-testid="button-submit-story"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Success Story"}
        </Button>
      </form>
    </Form>
  );
}
