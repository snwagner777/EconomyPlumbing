import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  CheckCircle,
  Phone,
  Clock,
  Wrench,
  Shield,
  Star,
  Users,
  Droplet
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

const services = [
  { title: "Multi-Floor Plumbing Systems", description: "Maintain complex plumbing across multiple office floors", critical: true },
  { title: "Restroom Facility Management", description: "High-capacity restrooms that handle daily employee and visitor traffic", critical: true },
  { title: "Break Room & Kitchen Plumbing", description: "Coffee stations, dishwashers, and food prep areas", critical: false },
  { title: "Water Heater Systems", description: "Commercial water heaters sized for building demand", critical: false },
  { title: "Backflow Testing & Certification", description: "Annual testing and certification to maintain compliance", critical: true },
  { title: "Pipe Leak Detection", description: "Advanced detection to find hidden leaks before major damage", critical: false },
  { title: "Emergency Shutoff Systems", description: "Quick response to prevent flooding in occupied buildings", critical: true },
  { title: "Preventive Maintenance Programs", description: "Scheduled inspections to avoid tenant disruptions", critical: false }
];

export default function OfficeBuilding() {
  const phoneConfig = usePhoneConfig();

  return (
    <>
      <SEOHead
        title="Office Building Plumbing Services Austin TX | Commercial Experts | Economy Plumbing"
        description="Professional office building plumbing in Austin. Multi-floor systems, restroom facilities, emergency response. Keep your tenants comfortable and productive!"
        canonical="/commercial/office-buildings"
      />

      <Header />

      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Building2 className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Office Building Plumbing Services
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Expert commercial plumbing for Austin office buildings. From single-floor offices to multi-story complexes, we keep your facilities running smoothly.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" data-testid="button-call-office">
              <a href={`tel:${phoneConfig.tel}`}>
                <Phone className="w-5 h-5 mr-2" />
                Call: {phoneConfig.display}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" data-testid="button-schedule-office">
              <a href="/contact">Schedule Service</a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">Minimal Disruption</span>
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
          <h2 className="text-3xl font-bold text-center mb-8">Why Property Managers Trust Us</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Tenant Satisfaction</h3>
                <p className="text-sm text-muted-foreground">
                  Happy tenants mean renewals. We help maintain comfortable facilities.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">After-Hours Service</h3>
                <p className="text-sm text-muted-foreground">
                  Flexible scheduling to minimize business interruptions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Droplet className="w-10 h-10 mx-auto mb-3 text-primary" />
                <h3 className="font-semibold mb-2">Preventive Approach</h3>
                <p className="text-sm text-muted-foreground">
                  Regular maintenance prevents costly emergency repairs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Office Building Plumbing Solutions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{service.title}</span>
                    </CardTitle>
                    {service.critical && <Badge variant="destructive">Critical</Badge>}
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
              <h2 className="text-3xl font-bold mb-4">Protect Your Building Investment</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Professional plumbing maintenance and emergency service for Austin office buildings.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" data-testid="button-emergency-office">
                  <a href={`tel:${phoneConfig.tel}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Call: {phoneConfig.display}
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" data-testid="button-quote-office">
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
