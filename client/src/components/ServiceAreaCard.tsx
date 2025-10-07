import { Card } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";

interface ServiceAreaCardProps {
  title: string;
  address: string;
  phone: string;
  cities: string[];
}

export default function ServiceAreaCard({ title, address, phone, cities }: ServiceAreaCardProps) {
  return (
    <Card className="p-6 bg-primary/5 border border-card-border">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div className="flex items-start gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary mt-1" />
        <p className="text-foreground">{address}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {cities.map((city) => (
          <div key={city} className="text-sm text-muted-foreground">
            {city}
          </div>
        ))}
      </div>
      <a 
        href={`tel:${phone.replace(/\D/g, '')}`}
        className="flex items-center gap-2 text-primary font-poppins font-bold text-xl hover-elevate px-2 py-1 rounded-md w-fit"
        data-testid={`phone-${title.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Phone className="w-5 h-5" />
        {phone}
      </a>
    </Card>
  );
}
