import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  UtensilsCrossed,
  CheckCircle,
  Phone,
  Clock,
  AlertTriangle,
  Wrench,
  Shield,
  Star,
  Droplet,
  Thermometer
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

const services = [
  {
    title: "Grease Trap Installation & Maintenance",
    description: "Code-compliant grease trap systems to prevent sewer backups and pass health inspections",
    critical: true
  },
  {
    title: "Commercial Kitchen Plumbing",
    description: "High-capacity dishwashers, prep sinks, and 3-compartment sink installations",
    critical: true
  },
  {
    title: "Emergency Drain Clearing",
    description: "24/7 response for clogged floor drains, sink backups, and line blockages",
    critical: true
  },
  {
    title: "Water Heater Systems",
    description: "Commercial-grade water heaters sized for heavy restaurant demand",
    critical: false
  },
  {
    title: "Backflow Prevention",
    description: "Required backflow devices to protect water supply and maintain code compliance",
    critical: false
  },
  {
    title: "Gas Line Installation & Repair",
    description: "Safe, code-compliant gas lines for ranges, ovens, and fryers",
    critical: false
  },
  {
    title: "Ice Machine Plumbing",
    description: "Dedicated water lines and drains for reliable ice production",
    critical: false
  },
  {
    title: "Bathroom Facilities",
    description: "ADA-compliant restroom plumbing for staff and customers",
    critical: false
  }
];

const painPoints = [
  { issue: "Failed Health Inspection", solution: "Emergency grease trap service and drain repairs" },
  { issue: "Kitchen Flooding During Rush", solution: "24/7 emergency response with fast turnaround" },
  { issue: "No Hot Water", solution: "Commercial water heater repair/replacement same-day" },
  { issue: "Recurring Drain Clogs", solution: "Preventive maintenance plans and drain line camera inspections" }
];

export default function RestaurantPlumbing() {
  const phoneConfig = usePhoneConfig();

  return (
    <>
      <SEOHead
        title="Restaurant Plumbing Services Austin TX | Commercial Kitchen Experts | Economy Plumbing"
        description="Expert restaurant plumbing for Austin kitchens. Grease traps, emergency drain clearing, commercial water heaters, gas lines. 24/7 service. Health inspection ready!"
        canonical="/commercial/restaurants"
      />

      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <UtensilsCrossed className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Restaurant Plumbing Services
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Keep your Austin restaurant running smoothly with commercial plumbing experts who understand the demands of your kitchen. Health inspection ready, 24/7 emergency service.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              data-testid="button-call-restaurant"
            >
              <a href={`tel:${phoneConfig.tel}`}>
                <Phone className="w-5 h-5 mr-2" />
                Call: {phoneConfig.display}
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              data-testid="button-schedule-restaurant"
            >
              <a href="/contact">
                Schedule Service
              </a>
            </Button>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">24/7 Emergency</span>
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

      {/* Why Restaurants Trust Us */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Why Austin Restaurants Trust Economy Plumbing
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">24/7 Response</h3>
                <p className="text-sm text-muted-foreground">
                  Plumbing emergencies don't wait for business hours. We're always ready.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Wrench className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Minimize Downtime</h3>
                <p className="text-sm text-muted-foreground">
                  Fast, efficient repairs to get you back to serving customers quickly.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Shield className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Code Compliant</h3>
                <p className="text-sm text-muted-foreground">
                  All work meets Austin health department and building code requirements.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Preventive Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Scheduled maintenance to catch problems before they become emergencies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Comprehensive Restaurant Plumbing Services
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{service.title}</span>
                    </CardTitle>
                    {service.critical && (
                      <Badge variant="destructive">Critical</Badge>
                    )}
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

      {/* Common Pain Points */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Common Restaurant Plumbing Issues We Solve
          </h2>
          <div className="space-y-4">
            {painPoints.map((point, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <h3 className="font-semibold">Problem:</h3>
                      </div>
                      <p className="text-muted-foreground">{point.issue}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Our Solution:</h3>
                      </div>
                      <p className="text-muted-foreground">{point.solution}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20">
            <CardContent className="pt-8 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Keep Your Kitchen Running?
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Whether you need emergency service or preventive maintenance, we're here to help your restaurant succeed.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button
                  asChild
                  size="lg"
                  data-testid="button-emergency-restaurant"
                >
                  <a href={`tel:${phoneConfig.tel}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Emergency: {phoneConfig.display}
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  data-testid="button-quote-restaurant"
                >
                  <a href="/contact">
                    Get a Quote
                  </a>
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
