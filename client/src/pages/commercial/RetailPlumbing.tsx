import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Store,
  CheckCircle,
  Phone,
  Clock,
  AlertTriangle,
  Wrench,
  Shield,
  Star,
  Users
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

const services = [
  { title: "Customer Restroom Maintenance", description: "Clean, functional restrooms create positive shopping experiences", critical: true },
  { title: "Emergency Leak Repairs", description: "Fast response to prevent merchandise damage and store closures", critical: true },
  { title: "Backflow Prevention", description: "Required devices to protect public water supply and maintain compliance", critical: true },
  { title: "Water Heater Service", description: "Reliable hot water for break rooms and cleaning needs", critical: false },
  { title: "Drain Line Maintenance", description: "Prevent clogs in high-traffic restrooms and utility areas", critical: false },
  { title: "Fixture Upgrades", description: "Modern, efficient fixtures that reduce water bills", critical: false },
  { title: "ADA Compliance", description: "Accessible restroom plumbing that meets all requirements", critical: false },
  { title: "Preventive Maintenance Plans", description: "Regular inspections to avoid disruptions during business hours", critical: false }
];

export default function RetailPlumbing() {
  const phoneConfig = usePhoneConfig();

  return (
    <>
      <SEOHead
        title="Retail Store Plumbing Services Austin TX | Minimize Downtime | Economy Plumbing"
        description="Expert retail plumbing for Austin stores. Customer restroom maintenance, emergency repairs, ADA compliance. Keep your store open and customers happy!"
        canonical="/commercial/retail"
      />

      <Header />

      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Store className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Retail Store Plumbing Services
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Keep your Austin retail store running smoothly with minimal disruption to customers. Fast response, professional service, and preventive maintenance plans.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" data-testid="button-call-retail">
              <a href={`tel:${phoneConfig.tel}`}>
                <Phone className="w-5 h-5 mr-2" />
                Call: {phoneConfig.display}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" data-testid="button-schedule-retail">
              <a href="/contact">Schedule Service</a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">Minimal Downtime</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold">Licensed & Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-semibold">200+ 5-Star Reviews</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Why Retail Stores Choose Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Customer-First Mindset</h3>
                <p className="text-sm text-muted-foreground">
                  We understand your customers expect clean, functional restrooms. We deliver.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Flexible Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  After-hours and weekend service to avoid disrupting your business.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Emergency Ready</h3>
                <p className="text-sm text-muted-foreground">
                  24/7 response for leaks and issues that could close your store.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Complete Retail Plumbing Services</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{service.title}</span>
                    </CardTitle>
                    {service.critical && <Badge variant="destructive">Essential</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20">
            <CardContent className="pt-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Customer Experience?</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Professional plumbing service that keeps your store running and customers satisfied.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" data-testid="button-emergency-retail">
                  <a href={`tel:${phoneConfig.tel}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Call: {phoneConfig.display}
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" data-testid="button-quote-retail">
                  <a href="/contact">Get a Quote</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </>
  );
}
