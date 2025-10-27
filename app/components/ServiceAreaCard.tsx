import { MapPin, Phone } from "lucide-react";

interface ServiceAreaCardProps {
  title: string;
  address: string;
  phone: string;
  cities: string[];
}

function normalizePhoneLink(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
    return `tel:+${digitsOnly}`;
  }
  if (digitsOnly.length === 10) {
    return `tel:+1${digitsOnly}`;
  }
  return `tel:+${digitsOnly}`;
}

export default function ServiceAreaCard({ title, address, phone, cities }: ServiceAreaCardProps) {
  return (
    <div className="p-6 bg-primary/5 border border-card-border rounded-md">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <div className="flex items-start gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary mt-1" />
        <p className="text-foreground">{address}</p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {cities.map((city) => (
          <span 
            key={city} 
            className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground"
          >
            {city}
          </span>
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
    </div>
  );
}
