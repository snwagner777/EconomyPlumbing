import { SEOHead } from "@/components/SEO/SEOHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  HomeIcon,
  CheckCircle,
  Phone,
  Clock,
  Wrench,
  Shield,
  Star,
  Users,
  TrendingDown,
  AlertCircle
} from "lucide-react";
import { usePhoneConfig } from "@/hooks/usePhoneConfig";

const services = [
  { title: "Multi-Property Service Plans", description: "Consistent service across your entire portfolio", critical: false },
  { title: "Tenant Emergency Response", description: "24/7 availability for urgent plumbing issues", critical: true },
  { title: "Preventive Maintenance Programs", description: "Scheduled inspections to prevent costly emergencies", critical: true },
  { title: "Turnover Plumbing Services", description: "Fast repairs and upgrades between tenants", critical: false },
  { title: "Water Heater Management", description: "Installation, repair, and replacement for rental units", critical: false },
  { title: "Leak Detection & Repair", description: "Find hidden leaks before they cause major damage", critical: true },
  { title: "Sewer Line Inspections", description: "Camera inspections to identify problems early", critical: false },
  { title: "Code Compliance Consulting", description: "Ensure all properties meet Austin plumbing codes", critical: false }
];

const benefits = [
  { title: "Reduce Maintenance Costs", description: "Preventive care is cheaper than emergency repairs", icon: TrendingDown },
  { title: "Happy Tenants", description: "Fast response times lead to higher tenant satisfaction", icon: Users },
  { title: "Priority Scheduling", description: "Property management clients get priority service", icon: Clock },
  { title: "Transparent Pricing", description: "Clear quotes and consistent pricing across properties", icon: Shield }
];

export default function PropertyManagement() {
  const phoneConfig = usePhoneConfig();

  return (
    <>
      <SEOHead
        title="Property Management Plumbing Services Austin TX | Multi-Unit Experts | Economy Plumbing"
        description="Expert plumbing for Austin property managers. Multi-property service plans, 24/7 tenant support, preventive maintenance. Reduce costs and keep tenants happy!"
        canonical="/commercial/property-management"
      />

      <Header />

      <section className="bg-gradient-to-b from-primary/10 to-background py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HomeIcon className="w-12 h-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Property Management Plumbing Services
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            Your trusted plumbing partner for multi-family properties, apartment complexes, and rental portfolios across Austin. Reduce costs, keep tenants happy, and protect your investment.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" data-testid="button-call-property">
              <a href={`tel:${phoneConfig.tel}`}>
                <Phone className="w-5 h-5 mr-2" />
                Call: {phoneConfig.display}
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" data-testid="button-schedule-property">
              <a href="/contact">Discuss Your Portfolio</a>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-semibold">24/7 Tenant Support</span>
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
          <h2 className="text-3xl font-bold text-center mb-8">Benefits for Property Managers</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index}>
                <CardContent className="pt-6 text-center">
                  <benefit.icon className="w-10 h-10 mx-auto mb-3 text-primary" />
                  <h3 className="font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Property Management Plumbing Solutions</h2>
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

      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-primary" />
                Our Property Management Promise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p><strong>Same-Day Service:</strong> We prioritize emergency calls for your tenants</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p><strong>Clear Communication:</strong> You'll always know the status of service calls</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p><strong>Consistent Quality:</strong> Same high standards across all your properties</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p><strong>Competitive Pricing:</strong> Volume discounts for multiple properties</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20">
            <CardContent className="pt-8 text-center">
              <h2 className="text-3xl font-bold mb-4">Partner with Austin's Most Trusted Plumbers</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Let's discuss how we can help you manage your property portfolio more effectively.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Button asChild size="lg" data-testid="button-emergency-property">
                  <a href={`tel:${phoneConfig.tel}`}>
                    <Phone className="w-5 h-5 mr-2" />
                    Call: {phoneConfig.display}
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" data-testid="button-quote-property">
                  <a href="/contact">Request Portfolio Quote</a>
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
