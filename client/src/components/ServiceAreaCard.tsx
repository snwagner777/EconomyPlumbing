import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone } from "lucide-react";

interface ServiceAreaCardProps {
  title: string;
  address: string;
  phone: string;
  cities: string[];
}

// Normalize phone to E.164 format (tel:+1...)
function normalizePhoneLink(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  
  // If 11 digits starting with "1", it already has country code
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `tel:+${digitsOnly}`;
  }
  
  // If 10 digits, add country code
  if (digitsOnly.length === 10) {
    return `tel:+1${digitsOnly}`;
  }
  
  // Fallback: just return what we have
  return `tel:+${digitsOnly}`;
}

export default function ServiceAreaCard({ title, address, phone, cities }: ServiceAreaCardProps) {
  return (
    <Card className="p-6 bg-primary/5 border border-card-border">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div className="flex items-start gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary mt-1" />
        <p className="text-foreground">{address}</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {cities.map((city) => (
          <Badge 
            key={city} 
            variant="secondary" 
            className="text-sm px-3 py-1 rounded-full"
          >
            {city}
          </Badge>
        ))}
      </div>
      <a 
        href={normalizePhoneLink(phone)}
        className="flex items-center gap-2 text-foreground font-poppins font-bold text-xl hover-elevate px-2 py-1 rounded-md w-fit"
        data-testid={`phone-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Phone className="w-5 h-5" />
        {phone}
      </a>
    </Card>
  );
}
